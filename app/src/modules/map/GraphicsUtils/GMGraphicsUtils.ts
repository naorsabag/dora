import { Coordinate } from "../Geometries/Coordinate";
import { IGraphicsUtils } from "./IGraphicsUtils";
import { GoogleMapsMapComponent } from "../Components/GoogleMapsMapComponent";

export class GMGraphicsUtils implements IGraphicsUtils {
	constructor(private mapComponent: GoogleMapsMapComponent) {
	}

	addMarkArrow(coordinate: Coordinate): google.maps.Marker {
		let latLng: google.maps.LatLng = this.mapComponent.utils.coordinateToLatLng(coordinate);
		return new google.maps.Marker({
			position: latLng,
			map: this.mapComponent.nativeMapInstance,
			icon: require("../../../../assets/Navigation-Down.png"),
		});
	}

	removeMarkArrow(marker: google.maps.Marker): void {
		marker.setMap(null);
	}
}