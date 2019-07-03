import { GoogleEarthMapComponent } from "../../GoogleEarthMapComponent";
import { GEXXXLayer } from "./XXXLayer/GEXXXLayer";
import { XXXTreeControl } from "./XXXTreeControl";
import * as $ from "jquery";
import { XXXLayerType } from "./XXXLayer/XXXLayerType";
import { IXXXTreeConfig } from "./IXXXTreeConfig";
import { NetworkLink } from "./XXXLayer/NetworkLink";
import { XXXLayer } from "./XXXLayer/XXXLayer";

export class GEXXXTreeControl extends XXXTreeControl {
	protected mapComponent: GoogleEarthMapComponent;
	protected layers: GEXXXLayer[];
	protected YYYLayersNetworkLink: NetworkLink;

	constructor(mapComponent: GoogleEarthMapComponent, config?: IXXXTreeConfig) {
		super(mapComponent, config);

		this.YYYLayersNetworkLink = new NetworkLink(this.mapComponent, this.mapComponent.getConfig().YYYLayersKmzUrl);
	}

	protected createXXXLayerFromWMS(id: string, text: string, type: XXXLayerType, layerIds: string): XXXLayer {
		let layer = new GEXXXLayer(this.mapComponent, id, text, type);
		layer.setNetworkLink(this.YYYLayersNetworkLink, layerIds);
		return layer;
	}

	protected loadTree(): Promise<void> {
		let promise = new Promise<void>((resolve, reject) => {
			let geLayers: google.earth.KmlObjectList<google.earth.KmlFeature> = this.mapComponent.nativeMapInstance.getLayerRoot().getFeatures().getChildNodes();
			this.layers = new Array();
			this.generateTree(geLayers, null);
			this.layers.map(layer => {
				this.DFSMap(layer, l => {
					l.htmlClass = "ge-XXX-layer";
					l.tooltip = "!!! !!!!! - " + l.text;
				});
			});
			let XXXLayers = this.layers.slice();

			let crfPromise = new Promise<XXXLayer>((resolve, reject) => {
				let url = this.mapComponent.getConfig().crfZZZLayersUrl;
				(<any>google.earth).addSideDatabase(this.mapComponent.nativeMapInstance, url, (db) => {
					let sideDBLayers: google.earth.KmlObjectList<google.earth.KmlFeature> = db.getFeatures().getChildNodes();
					for (let i = 0; i < sideDBLayers.getLength(); i++) {
						let layer = sideDBLayers.item(i);
						if (layer.getName() === "Imagery" || layer.getName() === "Terrain") {
							layer.setVisibility(false);
						}
					}
					let crfZZZLayers = new GEXXXLayer(this.mapComponent, "crfZZZLayers", "!!!!! !!!!! !!\"!", XXXLayerType.Folder, db, null);
					this.layers.push(crfZZZLayers);
					this.generateTree(sideDBLayers, crfZZZLayers);
					this.DFSMap(crfZZZLayers, l => {
						l.htmlClass = "ge-crf-layer";
						l.tooltip = "!!\"! - " + l.text;
					});

					db.setVisibility(false);
					resolve(crfZZZLayers);
				},
					reject,
					{
						username: "",
						password: ""
					});
			});

			let YYYPromise = this.loadYYYLayers();

			let YYYNetworkLinkPromise = this.YYYLayersNetworkLink.addToMap();

			let promises = [crfPromise, YYYPromise, YYYNetworkLinkPromise];
			Promise.all(promises.map(this.reflectPromise)).then((results) => {
				//make sure at least one succeeded
				let success = !results.every(r => !r.status);
				if (success) {
					if (results[2].status) {
						this.YYYLayersNetworkLink.updateVisibility();
					}

					if (results[1].status) {
						results[1].value.map(layer => {
							this.DFSMap(layer, l => {
								l.htmlClass = "ge-YYY-layer";
								l.tooltip = "!!! !!!!!! - " + l.text;
							});
						});
						this.layers = this.layers.concat(results[1].value);
					}
					this.reorderTree(XXXLayers, results[1].value);
					resolve();
				}
				else {
					reject();
				}
			});
		});

		return promise;
	}

	protected reflectPromise(promise): Promise<{ value: any, status: boolean }> {
		return promise.then((v) => { return { value: v, status: true }; },
			(e) => { return { value: null, ex: e, status: false }; });
	}

	protected addControl(): void {
		let mapEl = $("#" + this.mapComponent.getConfig().mapDivId);
		let controlBg = $("<iframe>").addClass("XXX-base-layers-control-bg ge-XXX-base-layers-control-bg").appendTo(mapEl);
		let control = $("<div>").addClass("XXX-base-layers-control ge-XXX-base-layers-control").appendTo(mapEl);
		this.createControlPopup(control.get(0), "ge-XXX-base-layers-popup");
	}

	private generateTree(layers: google.earth.KmlObjectList<google.earth.KmlFeature>, parent: GEXXXLayer) {
		for (let i = 0; i < layers.getLength(); i++) {
			let geLayer = layers.item(i);
			let layerType: XXXLayerType = (geLayer.getType() === "KmlLayer") ? XXXLayerType.Layer : XXXLayerType.Folder;
			let layer = new GEXXXLayer(this.mapComponent, geLayer.getId(), geLayer.getName(), layerType, geLayer, parent);

			if (layer.text === "Imagery") {
				continue;
			}
			else if (layer.text === "Terrain") {
				continue;
			}

			if (parent === null) {
				this.layers.push(layer);
			} else {
				parent.getChildren().push(layer);
			}

			if (layer.type === XXXLayerType.Folder) {
				let childNodes = (<google.earth.KmlFolder>geLayer).getFeatures().getChildNodes();
				let children = childNodes.getLength();
				if (children > 0) {
					this.generateTree(childNodes, layer);
				}
			}
		}
	}

	public toggleLayers(layers: GEXXXLayer[], state: boolean) {
		let networkLinks: NetworkLink[] = new Array();
		layers.forEach((layer) => {
			layer.toggle(state);
			if (layer.fromNetworkLink && networkLinks.indexOf(layer.getNetworkLink()) < 0) {
				networkLinks.push(layer.getNetworkLink());
			}
		});
		networkLinks.forEach((link) => {
			link.updateVisibility();
		});
	}

	private reorderTree(XXXLayers: GEXXXLayer[], YYYLayers: GEXXXLayer[]): void {
		let codeMapsFolder: GEXXXLayer = XXXLayers.filter(n => n.text === "!!!! !!!")[0];
		if (typeof codeMapsFolder !== "undefined") {
			codeMapsFolder.text = "!!!!! (!!!\"!, !!\"ם)";
		}

		// get the 3d buldings layer from XXX hauma,
		// change the name and put it at the end of the buildings folder of erz haYYY,
		// instead of the 3d building layer of YYY
		let YYYBuildingsFolder: GEXXXLayer = YYYLayers.filter(n => n.text === "!!!!ם")[0];
		if (typeof YYYBuildingsFolder !== "undefined") {
			YYYBuildingsFolder.htmlClass = "ge-combined-folder";
			YYYBuildingsFolder.tooltip = YYYBuildingsFolder.text;
			this.layers = this.layers.filter(n => n !== YYYBuildingsFolder);
			this.layers.splice(1, 0, YYYBuildingsFolder);

			let YYY3dBuildings: GEXXXLayer = YYYBuildingsFolder.getChildren().filter(n => n.text === "!!!! !!!!!ם - !!! !!!!")[0];
			let XXX3dBuildings: GEXXXLayer;
			let generalFolder: GEXXXLayer = XXXLayers.filter(n => n.text === "!!!!")[0];
			if (typeof generalFolder !== "undefined") {
				XXX3dBuildings = generalFolder.getChildren().filter(n => n.text === "!!!!ם")[0];
			}
			if (typeof YYY3dBuildings !== "undefined" && typeof XXX3dBuildings !== "undefined") {
				XXX3dBuildings.text = "!!!! !!!!!ם - !!! !!!!";
				XXX3dBuildings.tooltip = "!!! !!!!! - " + XXX3dBuildings.text;
				generalFolder.removeChild(XXX3dBuildings);
				YYYBuildingsFolder.removeChild(YYY3dBuildings);
				YYYBuildingsFolder.addChild(XXX3dBuildings);
			}
		}
	}
}