import { Coordinate } from "../Geometries/Coordinate";
import { IGraphicsUtils } from "./IGraphicsUtils";
import { LeafletMapComponent } from "../Components/LeafletMapComponent";
import * as L from "leaflet";

export class LLGraphicsUtils implements IGraphicsUtils {
	constructor(private mapComponent: LeafletMapComponent) {
	}

	addMarkArrow(coordinate: Coordinate): L.Layer {
		const markerIcon = L.divIcon({
			iconSize: [30, 30],
			iconAnchor: [15, 15],
			shadowSize: [0, 0],
			className: "marker-highlight-animated-icon",
			html: "<div class='highlight-arrow highlight-arrow-bounce'></div><div class='markerHighlighFlare'></div><div class='markerHighlighGlow'></div>"
		});

		return L.marker([coordinate.latitude, coordinate.longitude], {
			icon: markerIcon
		}).addTo(this.mapComponent.nativeMapInstance);
	}

	removeMarkArrow(marker: L.Layer): void {
		this.mapComponent.nativeMapInstance.removeLayer(marker);
	}
}