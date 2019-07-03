import { XXXLayer } from "./XXXLayer";
import { TileLayerProvider } from "../../../../Config/TileLayerProvider";
import { XXXLayerType } from "./XXXLayerType";
import { LeafletMapComponent } from "../../../LeafletMapComponent";
import * as L from "leaflet";

export class LLXXXLayer extends XXXLayer {
	protected mapComponent: LeafletMapComponent;
	public parentFolder: LLXXXLayer;
	public provider: TileLayerProvider;
	public tileLayer: L.TileLayer;

	constructor(mapComponent: LeafletMapComponent, originalId: string, text: string, type: XXXLayerType, provider: TileLayerProvider = null, parentFolder?: LLXXXLayer, htmlClass?: string, tooltip?: string) {
		super(mapComponent, originalId, text, type, parentFolder, htmlClass, tooltip);

		this.provider = provider;
	}

	public getChildren(): LLXXXLayer[] {
		return <LLXXXLayer[]>super.getChildren();
	}

	private loadMzvUmaVectorLayer() {
		let tileLayer: L.TileLayer;
		if (this.provider.isWMS) {
			tileLayer = L.tileLayer.wms(this.provider.url, this.provider.options);
		}
		else {
			tileLayer = L.tileLayer(this.provider.url, this.provider.options);
		}

		tileLayer.addTo(this.mapComponent.nativeMapInstance);
		this.tileLayer = tileLayer;
	}

	public toggle(state: boolean) {
		if (this.type === XXXLayerType.Layer && this.active !== state) {
			if (state) {
				this.loadMzvUmaVectorLayer();
			}
			else {
				this.mapComponent.nativeMapInstance.removeLayer(this.tileLayer);
			}
			this.active = state;
		}
	}
}