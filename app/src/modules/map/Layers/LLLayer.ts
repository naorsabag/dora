import { Layer } from "./Layer";
import { LeafletMapComponent } from "../Components/LeafletMapComponent";
import * as L from "leaflet";
import { ILayerChild } from "./ILayerChild";

export class LLLayer extends Layer {
	protected mapComponent: LeafletMapComponent;
	private layerGroup: L.LayerGroup = null;

	constructor(mapComponent: LeafletMapComponent) {
		super(mapComponent);
	}

	public addGeometry(geometry: ILayerChild): void {
		this.geometries.push(geometry);
		if (this.layerGroup !== null) {
			geometry.addToLayer(this);
		}
	}

	public removeGeometry(geometry: ILayerChild): void {
		this.geometries = this.geometries.filter(g => g !== geometry);
		if (this.layerGroup !== null) {
			geometry.removeFromLayer(this);
		}
	}

	public addLayer(layer: L.Layer): void {
		if (this.layerGroup !== null) {
			this.layerGroup.addLayer(layer);
		}
	}

	public removeLayer(layer: L.Layer): void {
		if (this.layerGroup !== null) {
			this.layerGroup.removeLayer(layer);
		}
	}

	public show(): void {
		if (this.layerGroup === null) {
			if (this.mapComponent.useCluster) {
				this.layerGroup = L.markerClusterGroup();
			} else {
				this.layerGroup = new L.LayerGroup();
			}
			this.geometries.forEach(geometry => {
				geometry.addToLayer(this);
			});
		}
		if (!this.displayed) {
			this.mapComponent.nativeMapInstance.addLayer(this.layerGroup);
			this.geometries.forEach(geometry => {
				geometry.setVisibility(true);
			});
		}
		this.displayed = true;
	}

	public hide(): void {
		if (this.layerGroup !== null && this.displayed) {
			this.mapComponent.nativeMapInstance.removeLayer(this.layerGroup);
			this.geometries.forEach(geometry => {
				geometry.setVisibility(false);
			});
		}
		this.displayed = false;
	}

	public remove(): void {
		if (this.layerGroup !== null) {
			this.mapComponent.nativeMapInstance.removeLayer(this.layerGroup);
			this.geometries.forEach(geometry => {
				geometry.removeFromLayer(this);
			});
			this.layerGroup = null;
		}
		this.displayed = false;
	}

}