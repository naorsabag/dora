import { IXXXTreeControl } from "./IXXXTreeControl";
import { IMapComponent } from "../../IMapComponent";
import * as $ from "jquery";
import { XXXLayer } from "./XXXLayer/XXXLayer";
import { IXXXTreeConfig } from "./IXXXTreeConfig";
import { XXXTreeConfig } from "./XXXTreeConfig";
import { XXXLayerType } from "./XXXLayer/XXXLayerType";

export abstract class XXXTreeControl implements IXXXTreeControl {
	protected mapComponent: IMapComponent;
	protected config: XXXTreeConfig = new XXXTreeConfig();
	protected layers: XXXLayer[] = null;
	protected treeContainer: JQuery;

	constructor(mapComponent: IMapComponent, config?: IXXXTreeConfig) {
		this.mapComponent = mapComponent;
		if (typeof config !== "undefined") {
			this.config.update(config);
			this.layers = this.config.layers;
		}
	}

	protected abstract loadTree(): Promise<void>;
	protected abstract addControl(): void;
	//layers must be toggled in an array because some are connected to a networkLink, and are updated as a group
	public abstract toggleLayers(layers: XXXLayer[], state: boolean);
	protected abstract createXXXLayerFromWMS(id: string, text: string, type: XXXLayerType, layerIds: string): XXXLayer;

	protected loadYYYLayers(): Promise<XXXLayer[]> {
		let url = this.mapComponent.getConfig().XXXVectorLayersUrl;
		return new Promise<XXXLayer[]>((resolve, reject) => {
			$.ajax({
				url: url,
				type: "GET",
				traditional: true,
				contentType: "application/json",
				xhrFields: {
					withCredentials: true
				}
			}).then((response) => {

				let children: XXXLayer[] = [];

				// builds the roots first
				response.items.forEach(item => {

					if (typeof item.category_parent_id === "undefined") {
						let newChild = this.createXXXLayerFromWMS(item.category_id, item.category_name, XXXLayerType.Folder, item.layer_ids);

						children.push(newChild);
					}
				});

				// Adds the childrens to the relevant root
				response.items.forEach((item) => {
					if (typeof item.category_parent_id !== "undefined") {

						let itemParent = children.filter(c => {
							//intentional ==, because one is numeric and one is a string
							return c.originalId.toString() === item.category_parent_id;
						});

						let newChild = this.createXXXLayerFromWMS(item.category_id, item.category_name, XXXLayerType.Layer, item.layer_ids);

						itemParent[0].getChildren().push(newChild);
					}

				});

				children.forEach((item) => {
					if (item.getChildren() && item.getChildren().length === 0) {
						item.type = XXXLayerType.Layer;
					}
				});

				resolve(children);
			}, reject);
		});
	}

	public addToMap(): void {
		this.addControl();

		if (this.layers === null) {
			this.loadTree().then(() => {
				this.initializeTreeComponent();
			}, () => {
				console.error("Failed to load XXX tree layers");
			});
		}
		else {
			this.initializeTreeComponent();
		}
	}

	protected createControlPopup(control: HTMLElement, elClass: string): void {
		let popupBg = $("<iframe>").addClass("XXX-base-layers-popup-bg").appendTo(control);
		let popup = $("<div>").addClass("XXX-base-layers-popup " + elClass).appendTo(control);
		let closeBtnSrc = require("../../../../../../assets/xBtn.png");
		let closeBtn = $("<img>").attr({ src: closeBtnSrc }).addClass("close-btn").appendTo(popup);
		closeBtn.on("click", () => {
			popupBg.hide();
			popup.hide();
		});
		this.treeContainer = $("<div>").text("!!!!!!...").css({ direction: "rtl" }).appendTo(popup);

		$(control).on("click", (e) => {
			if (e.target !== closeBtn.get(0)) {
				popupBg.show();
				popup.show();
			}
		});
	}

	protected initializeTreeComponent(): void {
		this.treeContainer.text("");
		let plugins: string[] = ["checkbox", "types", "changed"];
		if (this.config.rememberState) {
			plugins.push("state");
		}
		this.treeContainer.jstree({
			core: {
				data: this.layers
			},
			checkbox: {
				keep_selected_style: false
			},
			types: {
				Layer: {
					icon: "layer-icon"
				}
			},
			plugins: plugins
		});

		this.treeContainer.on("changed.jstree", (e, data) => {
			let selectedLayers: XXXLayer[] = [];
			data.changed.selected.forEach(id => {
				let node: XXXLayer = this.treeContainer.jstree(true).get_node(id).original;
				selectedLayers.push(node);
			});
			this.toggleLayers(selectedLayers, true);

			let deselectedLayers: XXXLayer[] = [];
			data.changed.deselected.forEach(id => {
				let node: XXXLayer = this.treeContainer.jstree(true).get_node(id).original;
				deselectedLayers.push(node);
			});
			this.toggleLayers(deselectedLayers, false);
		});
	}

	/**
	 * apply a method to each node of a tree
	 */
	protected DFSMap(tree: XXXLayer, func: (node: XXXLayer) => void): XXXLayer {
		func(tree);
		tree.getChildren().forEach(child => {
			this.DFSMap(child, func);
		});
		return tree;
	}
}