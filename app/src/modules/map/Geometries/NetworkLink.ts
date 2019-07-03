import { ViewBounds } from "../Components/View/ViewBounds";
import { MapUtils } from "../MapUtils/MapUtils";
import { MapComponent } from "../Components/MapComponent";
import { NetworklinkNode } from "./NetworklinkNode";

export abstract class NetworkLink {

	private readonly minPixels: number = 128;
	private readonly MAX_NODES: number = 1000;
	private readonly changeOpacity: boolean = false;
	protected readonly makeEntitiesDoraCompatible: boolean = true;
	private nodeNum: number = 0;

	private root: NetworklinkNode;

	private _nodeRenderStartNum: number = 0;
	private isInVisitState: boolean = false;
	private isInVisitStatePromise: Promise<void>;

	private showMode: boolean = false;

	protected constructor(protected mapComponent: MapComponent, private doc: Document
		, protected changePolyToLine?: boolean, protected url?: string, protected hover?: boolean) {

		let minLodPixelElements: HTMLCollectionOf<Element> = doc.getElementsByTagName("minLodPixels");
		if (minLodPixelElements.length) {
			this.minPixels = +doc.getElementsByTagName("minLodPixels")[0].innerHTML;
		}

		//check if its buildings layer of XXX Hauma
		if (url &&
			this.url.lastIndexOf("LINK") === 0) {
			this.changeOpacity = true;
			this.hover = false;
			this.makeEntitiesDoraCompatible = false;
		}

		this.root = this.createRoot();
	}

	public startListen(): Promise<void> {
		this.showMode = true;

		this.mapComponent.on("viewChanged", this.listener);

		return this.safeVisitNode(this.root, this.mapComponent.getViewBounds());
	}

	public stopListen(): Promise<void> {
		this.showMode = false;

		this.mapComponent.off("viewChanged", this.listener);

		return this.safeVisitNode(this.root,
			this.mapComponent.getViewBounds());
	}

	private listener = (currentBounds: ViewBounds): Promise<void> => {
		this._nodeRenderStartNum++;

		return this.safeVisitNode(this.root, currentBounds);
	}

	private createRoot(): NetworklinkNode {
		return new NetworklinkNode(<XMLDocument>this.doc.cloneNode(true), null, this.nodeNum++);
	}

	private async safeVisitNode(node: NetworklinkNode, currentBounds: ViewBounds): Promise<void> {

		if (this.isInVisitState) {
			if (this.showMode) {
				this.showMode = false;
				await this.isInVisitStatePromise;
				this.showMode = true;
			}
			else {
				await this.isInVisitStatePromise;
			}

			return this.safeVisitNode(node, currentBounds);
		}

		this.isInVisitState = true;

		if (this.nodeNum > this.MAX_NODES) {
			this.showMode = false;
			this.isInVisitStatePromise = this.visitNode(node, currentBounds);
			await this.isInVisitStatePromise;
			this.nodeNum = 0;
			this.root = this.createRoot();
			this.showMode = true;
		}

		this.isInVisitStatePromise = this.visitNode(node, currentBounds);
		await this.isInVisitStatePromise;

		this.isInVisitState = false;
	}

	private async visitNode(node: NetworklinkNode, currentBounds: ViewBounds): Promise<void> {
		if (!this.showMode || !this.isNodeShouldBeVisible(node, currentBounds)) {
			if (!node.isVisible) {
				return;
			}

			if (node.children.length) {
				await this.visitChildren(node.children, currentBounds);
			}

			if (node.dataSource) {
				this.hideDataSource(node.dataSource);
			}

			node.isVisible = false;
			return;
		}

		if (!node.children) {
			await this.addChildren(node);
		}

		await this.visitChildren(node.children, currentBounds);

		if (!node.dataSource) {
			node.dataSource = await this.createDataSource(node.doc);
			if (this.changeOpacity) {
				this.setPolygonsOpacity(node.dataSource);
			}
		}

		if (!node.isVisible) {
			await this.showDataSource(node.dataSource);
			node.isVisible = true;
		}

		return;
	}

	private async visitChildren(children: NetworklinkNode[], currentBounds: ViewBounds): Promise<void> {
		let promiseArr: Promise<void>[] = [];
		for (let child of children) {
			promiseArr.push(this.visitNode(child, currentBounds));
		}
		await Promise.all(promiseArr);
	}

	private isNodeShouldBeVisible(node: NetworklinkNode, currentBounds: ViewBounds): boolean {
		if (!node.bounds) {
			return true;
		}

		let area: number = this.getBoundPixelCountOnView(node.bounds, currentBounds);
		return area >= this.minPixels * this.minPixels;
	}

	private async addChildren(node: NetworklinkNode): Promise<void> {
		node.children = [];

		let networklinkElmList: HTMLCollectionOf<Element> = node.doc.getElementsByTagName("NetworkLink");
		let promiseArr: Promise<NetworklinkNode>[] = [];

		for (let networklinkElm of [].slice.call(networklinkElmList)) {
			promiseArr.push(this.createChild(networklinkElm));

			node.doc.getElementsByTagName("Document")[0].removeChild(networklinkElm);
		}

		node.children = await Promise.all(promiseArr);
	}

	private async createChild(networklinkElm: Element): Promise<NetworklinkNode> {
		let north: number = +networklinkElm.getElementsByTagName("north")[0].innerHTML;
		let south: number = +networklinkElm.getElementsByTagName("south")[0].innerHTML;
		let east: number = +networklinkElm.getElementsByTagName("east")[0].innerHTML;
		let west: number = +networklinkElm.getElementsByTagName("west")[0].innerHTML;

		let innerText: string = networklinkElm.getElementsByTagName("href")[0].innerHTML;
		let relativePath: string = this.url;

		if (innerText.substr(0, 2) === "./") {
			innerText = innerText.substr(2, innerText.length);

			relativePath += innerText;
		}
		else {
			relativePath = innerText.substring(innerText.indexOf("LINK"));
		}

		let res: Response = await fetch(relativePath || innerText);
		if (!res.ok) {
			throw new Error(res.statusText);
		}
		let data: string = await res.text();

		let parser: DOMParser = new DOMParser();
		let newNodeDoc: Document = parser.parseFromString(data, <SupportedType>"text/xml");

		return new NetworklinkNode(newNodeDoc,
			new ViewBounds(north, south, west, east), this.nodeNum++);

	}

	protected abstract async createDataSource(doc: Document): Promise<any>;

	protected abstract async showDataSource(datSource): Promise<void>;

	protected abstract hideDataSource(datSource);

	protected abstract getBoundPixelCountOnView(nodeBounds: ViewBounds, viewBounds: ViewBounds): number;

	public async focus(val: number): Promise<boolean> {
		return this.focusOnNode(val, this.root.dataSource);
	}

	protected abstract async focusOnNode(val: number, dataSource: any): Promise<boolean>;

	protected abstract setPolygonsOpacity(dataSource): void;

	public abstract getId(): string;

	private async registerForNextRenderStart(): Promise<void> {
		let currentNodeRenderNum = this._nodeRenderStartNum;
		while (currentNodeRenderNum === this._nodeRenderStartNum) {
			await MapUtils.timeout(10);
		}
	}

	public async registerForNextRenderEnd(onStart?: () => void): Promise<void> {
		await this.registerForNextRenderStart();
		onStart && onStart();
		return this.isInVisitStatePromise;
	}

}