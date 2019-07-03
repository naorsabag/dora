import { Coordinate } from "../Geometries/Coordinate";
import { MapEventArgs } from "../Events/MapEventArgs";
import { IUtilities } from "./IUtilities";
import { ScreenCoordinate } from "../GraphicsUtils/ScreenCoordinate";
import { Geometry } from "../Geometries/Geometry";

export class GMUtilities implements IUtilities {
	private map: google.maps.Map;

	constructor(map: google.maps.Map) {
		this.map = map;
	}

	public latLngToCoordinate(latlng: google.maps.LatLng): Coordinate {
		return new Coordinate(latlng.lat(), latlng.lng());
	}

	public latLngsToCoordinates(latlngs: google.maps.LatLng[]): Coordinate[] {
		return latlngs.map(latLng => this.latLngToCoordinate(latLng));
	}

	public latlngsRingsToCoordinatesRings(latlngsRings: google.maps.LatLng[][]): Coordinate[][] {
		return latlngsRings.map(ring => this.latLngsToCoordinates(ring));
	}

	public coordinateToLatLng(coordinate: Coordinate): google.maps.LatLng {
		return new google.maps.LatLng(coordinate.latitude, coordinate.longitude);
	}

	public coordinatesToLatLngs(coordinates: Coordinate[]): google.maps.LatLng[] {
		return coordinates.map(coord => this.coordinateToLatLng(coord));
	}

	public coordinatesRingsTolatlngsRings(coordsRings: Coordinate[][]): google.maps.LatLng[][] {
		return coordsRings.map(ring => this.coordinatesToLatLngs(ring));
	}

	public attachEventListener(object: google.maps.MVCObject, eventName: string, callback: (event: MapEventArgs) => void): () => void {
		let listener = google.maps.event.addListener(object, eventName, (params) => {
				if (callback != null && typeof callback === "function") {
					let mapEvent: MapEventArgs = new MapEventArgs(params.latLng.lng(), params.latLng.lat());
					if (params.Ua) {
						mapEvent.button = params.Ua.button;
						mapEvent.ctrlPressed = params.Ua.ctrlKey;
						mapEvent.altPressed = params.Ua.altKey;
						mapEvent.shiftPressed = params.Ua.shiftKey;
						mapEvent.clientX = params.Ua.x;
						mapEvent.clientY = params.Ua.y;
						mapEvent.preventDefault = params.Ua.defaultPrevented;
					}
					callback(mapEvent);
				}
			}
		);

		let closeEvent = () => {
			google.maps.event.removeListener(listener);
		};

		return closeEvent;
	}

	public attachDataEventListener(feature: google.maps.Data.Feature, eventName: string, callback: (event: MapEventArgs) => void): () => void {
		let listener = this.map.data.addListener(eventName, (params) => {
			if (params.feature === feature) {
				if (callback != null && typeof callback === "function") {
					let mapEvent: MapEventArgs = new MapEventArgs(params.latLng.lng(), params.latLng.lat());
					if (params.Ua) {
						mapEvent.button = params.Ua.button;
						mapEvent.ctrlPressed = params.Ua.ctrlKey;
						mapEvent.altPressed = params.Ua.altKey;
						mapEvent.shiftPressed = params.Ua.shiftKey;
						mapEvent.clientX = params.Ua.x;
						mapEvent.clientY = params.Ua.y;
						mapEvent.preventDefault = params.Ua.defaultPrevented;
					}
					callback(mapEvent);
				}
			}
		});

		let cancelFunc = () => {
			google.maps.event.removeListener(listener);
		};

		return cancelFunc;
	}

	public mapPixelsToLatLng(x, y): google.maps.LatLng {
		let northEast = this.map.getBounds().getNorthEast();
		let southWest = this.map.getBounds().getSouthWest();
		let projection = this.map.getProjection();
		let topRight = projection.fromLatLngToPoint(northEast);
		let bottomLeft = projection.fromLatLngToPoint(southWest);
		let scale = 1 << this.map.getZoom();
		return projection.fromPointToLatLng(new google.maps.Point(x / scale + bottomLeft.x, y / scale + topRight.y));
	}

	public openBalloonHtml(html: string, coordinate: Coordinate): void {
		let options: google.maps.InfoWindowOptions = {
			content: html,
			position: this.coordinateToLatLng(coordinate)
		};
		let infoWindow = new google.maps.InfoWindow(options);
		infoWindow.open(this.map);
	}

	public pickEntity(eventArgs: MapEventArgs): Geometry {
		throw new Error("Method not implemented.");
	}

	public pickEntities(eventArgs: MapEventArgs, maxEntities?: number): Geometry[] {
		throw new Error("Method not implemented.");
	}

	public entitiesAmountInPositionGreaterThan(eventArgs: MapEventArgs, num: number): boolean {
		throw new Error("Method not implemented.");
	}

	public onMouseEvent(eventType: number, listener: (eventArgs?: MapEventArgs) => void): () => void {
		throw new Error("Method not implemented.");
	}

	public addEntityMouseEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void {
		throw new Error("Method not implemented.");
	}

	public addEntityMouseOutEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void {
		throw new Error("Method not implemented.");
	}

	public toScreenPosFromCoordinate(coordinate: Coordinate): ScreenCoordinate {
		throw new Error("Method not implemented.");
	}
}