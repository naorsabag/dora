import { IXXXTreeControl } from "./IXXXTreeControl";
import { LeafletMapComponent } from "../../LeafletMapComponent";
import * as $ from "jquery";
import { LLXXXLayer } from "./XXXLayer/LLXXXLayer";
import { XXXTreeControl } from "./XXXTreeControl";
import * as L from "leaflet";
import { ITileLayerProvider } from "../../../Config/ITileLayerProvider";
import { TileLayerProvider } from "../../../Config/TileLayerProvider";
import { XXXLayerType } from "./XXXLayer/XXXLayerType";
import { IXXXTreeConfig } from "./IXXXTreeConfig";
import { XXXLayer } from "./XXXLayer/XXXLayer";

export class LLXXXTreeControl extends XXXTreeControl {
	protected mapComponent: LeafletMapComponent;
	protected layers: LLXXXLayer[];

	constructor(mapComponent: LeafletMapComponent, config?: IXXXTreeConfig) {
		super(mapComponent, config);
	}

	protected loadTree(): Promise<void> {
		this.layers = new Array();

		let placesLayerProvider = this.mapComponent.getConfig().placesLayerProvider;
		let placesLayer: LLXXXLayer = new LLXXXLayer(this.mapComponent, null,
			"!!!!!!, !!!!!ם !!!!! !!!!!!", XXXLayerType.Layer, placesLayerProvider);
		this.layers.push(placesLayer);

		return this.loadYYYLayers().then((layers) => {
			this.layers = this.layers.concat(<LLXXXLayer[]>layers);
		});
	}

	protected createXXXLayerFromWMS(id: string, text: string, type: XXXLayerType, layerIds: string): XXXLayer {
		let provider = undefined;
		provider = new TileLayerProvider(this.mapComponent.getConfig().XXXWMSVectorLayersUrl,
			{
				id: id,
				layers: layerIds,
				format: "image/png",
				transparent: true,
				crs: L.CRS.EPSG3857,
				maxZoom: 22,
				minZoom: 2
			}, true);
		return new LLXXXLayer(this.mapComponent, id, text, type, provider);
	}

	protected addControl(): void {
		(<any>L.Control).XXXBaseLayers = L.Control.extend({
			onAdd: (map) => {
				let div = L.DomUtil.create("div");
				$(div).addClass("XXX-base-layers-control leaflet-XXX-base-layers-control");
				//prevents map events (causing zooming and dragging) to occur on the popup
				L.DomEvent.on(div, "mousewheel", L.DomEvent.stopPropagation);
				L.DomEvent.on(div, "dblclick", L.DomEvent.stopPropagation);
				L.DomEvent.on(div, "mousedown", L.DomEvent.stopPropagation);

				this.createControlPopup(div, "leaflet-XXX-base-layers-popup");
				return div;
			},
			onRemove: (map) => {
			}
		});

		let control = new (<any>L.Control).XXXBaseLayers({ position: "topleft" });
		control.addTo(this.mapComponent.nativeMapInstance);
	}

	public toggleLayers(layers: LLXXXLayer[], state: boolean) {
		layers.forEach((layer) => {
			layer.toggle(state);
		});
	}
}