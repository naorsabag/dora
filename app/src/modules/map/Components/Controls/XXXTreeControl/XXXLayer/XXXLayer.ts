import { XXXLayerType } from "./XXXLayerType";
import { IMapComponent } from "../../../IMapComponent";
import { tooltip } from "leaflet";

export abstract class XXXLayer {
	protected mapComponent: IMapComponent;
	public originalId: string;
	public text: string;
	public type: XXXLayerType;
	public htmlClass: string = null;
	public tooltip: string = null;
	//jstree requires the children property, but for some reason it removes it later - so we need childLayers as well
	private get children(): XXXLayer[] {
		return this.childLayers;
	}
	private childLayers: XXXLayer[];
	public active: boolean = false;
	public parentFolder: XXXLayer = null;
	public get a_attr(): any {
		let attr: any = {};
		if (this.htmlClass !== null) {
			attr.class = this.htmlClass;
		}
		if (this.tooltip !== null) {
			attr.title = this.tooltip;
		}
		return attr;
	}

	constructor(mapComponent: IMapComponent, originalId: string, text: string, type: XXXLayerType, parentFolder?: XXXLayer, htmlClass?: string, tooltip?: string) {
		this.mapComponent = mapComponent;
		this.originalId = originalId;
		this.text = text;
		this.type = type;
		if (typeof parentFolder !== "undefined") {
			this.parentFolder = parentFolder;
		}
		if (typeof htmlClass !== "undefined") {
			this.htmlClass = htmlClass;
		}
		if (typeof tooltip !== "undefined") {
			this.tooltip = tooltip;
		}
		this.setChildren([]);
	}

	public abstract toggle(state: boolean);

	public getChildren(): XXXLayer[] {
		return this.childLayers;
	}

	public setChildren(children: XXXLayer[]): void {
		this.childLayers = children;
	}

	public addChild(child: XXXLayer): void {
		this.childLayers.push(child);
		child.parentFolder = this;
	}

	public removeChild(child: XXXLayer): void {
		this.childLayers = this.childLayers.filter(l => l !== child);
		child.parentFolder = null;
	}
}