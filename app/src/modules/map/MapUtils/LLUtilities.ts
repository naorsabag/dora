import { MapEventArgs } from "../Events/MapEventArgs";
import { Coordinate } from "../Geometries/Coordinate";
import * as L from "leaflet";
import { IUtilities } from "./IUtilities";
import { ScreenCoordinate } from "../GraphicsUtils/ScreenCoordinate";
import { Geometry } from "../Geometries/Geometry";

export class LLUtilties implements IUtilities {
	public static latLngToCoordinate(latlng: L.LatLng): Coordinate {
		return new Coordinate(latlng.lat, latlng.lng);
	}

	public static latLngsToCoordinates(latlngs: L.LatLng[]): Coordinate[] {
		return latlngs.map(latLng => LLUtilties.latLngToCoordinate(latLng));
	}

	public static latlngsRingsToCoordinatesRings(latlngsRings: L.LatLng[][]): Coordinate[][] {
		return latlngsRings.map(ring => LLUtilties.latLngsToCoordinates(ring));
	}

	public static coordinateToLatLng(coordinate: Coordinate): L.LatLngTuple {
		return [coordinate.latitude, coordinate.longitude];
	}

	public static coordinatesToLatLngs(coordinates: Coordinate[]): L.LatLngTuple[] {
		return coordinates.map(coord => LLUtilties.coordinateToLatLng(coord));
	}

	public static coordinatesRingsTolatlngsRings(coordsRings: Coordinate[][]): L.LatLngTuple[][] {
		return coordsRings.map(ring => LLUtilties.coordinatesToLatLngs(ring));
	}

	public static detachEvent(layer: L.Layer, eventName: string, handler: (event: L.LeafletMouseEvent) => void): void {
		layer.off(eventName, handler);
	}

	public static attachEvent(layer: L.Layer, eventName: string, callback: (event: MapEventArgs) => void): () => void {
		let handler = (eventParams: L.LeafletMouseEvent) => {
			const mapEvent: MapEventArgs = new MapEventArgs(eventParams.latlng.lng,
				eventParams.latlng.lat,
				eventParams.latlng.alt,
				eventParams.originalEvent.button,
				eventParams.originalEvent.ctrlKey,
				eventParams.originalEvent.altKey,
				eventParams.originalEvent.shiftKey,
				eventParams.containerPoint.x,
				eventParams.containerPoint.y,
				eventParams.originalEvent.preventDefault,
				eventParams.originalEvent);
			callback(mapEvent);
		};
		layer.on(eventName, handler);
		return () => {
			LLUtilties.detachEvent(layer, eventName, handler);
		};
	}

	public static overrideMarkerDefaultIcon(): void {
		delete (<any>L.Icon.Default.prototype)._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconUrl: require("leaflet/dist/images/marker-icon.png"),
			shadowUrl: require("leaflet/dist/images/marker-shadow.png")
		});
	}

	public static overrideDefaultDrawFunctions(): void {
		(<any>L).Draw.Feature.prototype._cancelDrawing = () => {/* empty */
		};
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