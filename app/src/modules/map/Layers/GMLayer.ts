import { Layer } from "./Layer";
import { ILayerChild } from "./ILayerChild";
import { GoogleMapsMapComponent } from "../Components/GoogleMapsMapComponent";

export class GMLayer extends Layer {
	private addedToMap: boolean = false;
	protected mapComponent: GoogleMapsMapComponent;

	constructor(mapComponent: GoogleMapsMapComponent) {
		super(mapComponent);
	}

	public addGeometry(geometry: ILayerChild): void {
		this.geometries.push(geometry);
		if (this.addedToMap) {
			geometry.addToLayer(this);
		}
	}

	public removeGeometry(geometry: ILayerChild): void {
		this.geometries = this.geometries.filter(g => g !== geometry);
		if (this.addedToMap) {
			geometry.removeFromLayer(this);
		}
	}

	public show(): void {
		if (!this.addedToMap) {
			this.geometries.forEach(geometry => {
				geometry.addToLayer(this);
			});
			this.addedToMap = true;
		}
		this.geometries.forEach(geometry => {
			geometry.setVisibility(true);
		});
		this.displayed = true;
	}

	public hide(): void {
		this.geometries.forEach(geometry => {
			geometry.setVisibility(false);
		});
		this.displayed = false;
	}

	public remove(): void {
		if (this.addedToMap) {
			this.geometries.forEach(geometry => {
				geometry.removeFromLayer(this);
			});
			this.addedToMap = false;
		}
		this.displayed = false;
	}

}