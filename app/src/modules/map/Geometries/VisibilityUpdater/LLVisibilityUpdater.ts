import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { LLLayer } from "../../Layers/LLLayer";
import { Point } from "../Point";

export class LLVisibilityUpdater {
	private mapComponent: LeafletMapComponent;

	constructor(mapComponent: LeafletMapComponent) {
		this.mapComponent = mapComponent;
	}

	public updateVisibility(visible: boolean, geometryOnMap: L.Layer, addedToMap: boolean, addedToLayers: LLLayer[], icons?: Point[]) {
		if (addedToMap) {
			if (visible) {
				this.mapComponent.nativeMapInstance.addLayer(geometryOnMap);
			}
			else {
				this.mapComponent.nativeMapInstance.removeLayer(geometryOnMap);
			}
		}
		addedToLayers.forEach((layer: LLLayer) => {
			if (visible) {
				layer.addLayer(geometryOnMap);
			}
			else {
				layer.removeLayer(geometryOnMap);
			}
		});

		if (typeof icons !== "undefined") {
			icons.forEach(iconPoint => {
				iconPoint.setVisibility(visible);
			});
		}
	}
}