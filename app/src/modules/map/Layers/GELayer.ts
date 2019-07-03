import { GoogleEarthMapComponent } from "../Components/GoogleEarthMapComponent";
import { Layer } from "./Layer";
import { ILayerChild } from "./ILayerChild";

export class GELayer extends Layer {
	protected mapComponent: GoogleEarthMapComponent;
	private folder: google.earth.KmlFolder = null;

	constructor(mapComponent: GoogleEarthMapComponent) {
		super(mapComponent);
	}

	public addGeometry(geometry: ILayerChild): void {
		this.geometries.push(geometry);
		if (this.folder !== null) {
			geometry.addToLayer(this);
		}
	}

	public removeGeometry(geometry: ILayerChild): void {
		this.geometries = this.geometries.filter(g => g !== geometry);
		if (this.folder !== null) {
			geometry.removeFromLayer(this);
		}
	}

	public addPlacemark(placemark: google.earth.KmlPlacemark): void {
		if (this.folder !== null) {
			this.folder.getFeatures().appendChild(placemark);
		}
	}

	public removePlacemark(placemark: google.earth.KmlPlacemark): void {
		if (this.folder !== null) {
			this.folder.getFeatures().removeChild(placemark);
		}
	}

	public show(): void {
		if (this.folder === null) {
			this.folder = this.mapComponent.nativeMapInstance.createFolder("");
			this.geometries.forEach(geometry => {
				geometry.addToLayer(this);
			});
			this.mapComponent.nativeMapInstance.getFeatures().appendChild(this.folder);
		} else {
			this.geometries.forEach(geometry => {
				geometry.setVisibility(true);
			});
		}
		this.folder.setVisibility(true);
		this.displayed = true;
	}

	public hide(): void {
		if (this.folder !== null) {
			this.folder.setVisibility(false);
			this.geometries.forEach(geometry => {
				geometry.setVisibility(false);
			});
		}
		this.displayed = false;
	}

	public remove(): void {
		if (this.folder !== null) {
			this.mapComponent.nativeMapInstance.getFeatures().removeChild(this.folder);
			this.geometries.forEach(geometry => {
				geometry.removeFromLayer(this);
			});
			this.folder = null;
		}
		this.displayed = false;
	}

}