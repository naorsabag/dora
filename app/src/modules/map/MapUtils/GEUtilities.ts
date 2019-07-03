import * as _ from "underscore";
import { IMapConfig } from "../Config/IMapConfig";
import { MapEventArgs } from "../Events/MapEventArgs";
import { Coordinate } from "../Geometries/Coordinate";
import { MapUtils } from "./MapUtils";
import { IUtilities } from "./IUtilities";
import { ScreenCoordinate } from "../GraphicsUtils/ScreenCoordinate";
import { Geometry } from "../Geometries/Geometry";
import { ColorRgba } from "../Common/ColorRgba";

/**
 * Created by T60352784 on 17/01/2017.
 */

export class GEUtilities implements IUtilities {
	private map: google.earth.GEPlugin;
	private config: IMapConfig;

	constructor(map: google.earth.GEPlugin, config: IMapConfig) {
		this.map = map;
		this.config = config;
	}

	public createPolygonGeometry(coordinates: Coordinate[]): google.earth.KmlPolygon {
		let kmlPolygon = this.map.createPolygon("");
		let kmlLinearRing = this.map.createLinearRing("");

		coordinates.forEach(coordinate => {
			kmlLinearRing
				.getCoordinates()
				.pushLatLngAlt(
					coordinate.latitude,
					coordinate.longitude,
					coordinate.altitude
				);
		});
		kmlPolygon.setOuterBoundary(kmlLinearRing);
		return kmlPolygon;
	}

	public createHierarchicalPolygonGeometry(coordinatesMat: Coordinate[][]): google.earth.KmlPolygon {
		const kmlPolygon = this.map.createPolygon("");
		const kmlLinearRingArray = coordinatesMat.map(coordinatesArr => {
			const kmlLinearRing = this.map.createLinearRing("");
			coordinatesArr.forEach(coordinate => {
				kmlLinearRing
					.getCoordinates()
					.pushLatLngAlt(coordinate.latitude, coordinate.longitude, coordinate.altitude);
			});

			return kmlLinearRing;
		});
		kmlPolygon.setOuterBoundary(kmlLinearRingArray[0]);
		const innerContainer = kmlPolygon.getInnerBoundaries();
		kmlLinearRingArray.slice(1).forEach(ring => innerContainer.appendChild(ring));

		return kmlPolygon;
	}

	public createLineGeometry(coordinates: Coordinate[]): google.earth.KmlLineString {
		let kmlLineString: google.earth.KmlLineString = this.map.createLineString(
			""
		);

		coordinates.forEach(coordinate => {
			kmlLineString
				.getCoordinates()
				.pushLatLngAlt(coordinate.latitude, coordinate.longitude, coordinate.altitude);
		});
		return kmlLineString;
	}

	public attachOnDoubleClickEvent(nativeGeometry: google.earth.KmlPlacemark, callback: (event: MapEventArgs) => void, isPoint = false): () => void {
		let handler = (geParam) => {
			const heliosMapEvent: MapEventArgs = new MapEventArgs(
				isPoint ? geParam.getTarget().getGeometry().getLongitude() : geParam.getLongitude(),
				isPoint ? geParam.getTarget().getGeometry().getLatitude() : geParam.getLatitude(),
				isPoint ? geParam.getTarget().getGeometry().getAltitude() : geParam.getAltitude(),
				geParam.getButton(),
				geParam.getCtrlKey(),
				geParam.getAltKey(),
				geParam.getShiftKey(),
				geParam.getClientX(),
				geParam.getClientY(),
				geParam.preventDefault,
				geParam
			);
			heliosMapEvent.preventDefault();
			if (heliosMapEvent.button === 0) {
				this.executeEventCallback(heliosMapEvent, callback);
			}
		};

		google.earth.addEventListener(nativeGeometry, "dblclick", handler);

		let cancelFunc = () => {
			google.earth.removeEventListener(nativeGeometry, "dblclick", handler);
		};

		return cancelFunc;
	}

	public attachOnMouseOverEvent(nativeGeometry: google.earth.KmlPlacemark, callback: (event: MapEventArgs) => void, isPoint = false): () => void {
		let handler = (geParam) => {
			const heliosMapEvent: MapEventArgs = new MapEventArgs(
				isPoint ? geParam.getTarget().getGeometry().getLongitude() : geParam.getLongitude(),
				isPoint ? geParam.getTarget().getGeometry().getLatitude() : geParam.getLatitude(),
				isPoint ? geParam.getTarget().getGeometry().getAltitude() : geParam.getAltitude(),
				geParam.getButton(),
				geParam.getCtrlKey(),
				geParam.getAltKey(),
				geParam.getShiftKey(),
				geParam.getClientX(),
				geParam.getClientY(), null, geParam);
			this.executeEventCallback(heliosMapEvent, callback);
		};

		google.earth.addEventListener(nativeGeometry, "mouseover", handler);

		let cancelFunc = () => {
			google.earth.removeEventListener(nativeGeometry, "mouseover", handler);
		};

		return cancelFunc;
	}

	public attachOnMouseOutEvent(nativeGeometry: google.earth.KmlPlacemark, callback: (event: MapEventArgs) => void, isPoint = false): () => void {
		let handler = (geParam) => {
			const heliosMapEvent: MapEventArgs = new MapEventArgs(
				isPoint ? geParam.getTarget().getGeometry().getLongitude() : geParam.getLongitude(),
				isPoint ? geParam.getTarget().getGeometry().getLatitude() : geParam.getLatitude(),
				isPoint ? geParam.getTarget().getGeometry().getAltitude() : geParam.getAltitude(),
				geParam.getButton(),
				geParam.getCtrlKey(),
				geParam.getAltKey(),
				geParam.getShiftKey(),
				geParam.getClientX(),
				geParam.getClientY(), null, geParam);
			this.executeEventCallback(heliosMapEvent, callback);
		};

		google.earth.addEventListener(nativeGeometry, "mouseout", handler);

		let cancelFunc = () => {
			google.earth.removeEventListener(nativeGeometry, "mouseout", handler);
		};

		return cancelFunc;
	}

	public attachOnClickEvent(nativeGeometry: google.earth.KmlPlacemark, callback: (event: MapEventArgs) => void, isPoint = false): () => void {
		let handler = (geParam) => {
			const heliosMapEvent: MapEventArgs = new MapEventArgs(
				isPoint ? geParam.getTarget().getGeometry().getLongitude() : geParam.getLongitude(),
				isPoint ? geParam.getTarget().getGeometry().getLatitude() : geParam.getLatitude(),
				isPoint ? geParam.getTarget().getGeometry().getAltitude() : geParam.getAltitude(),
				geParam.getButton(),
				geParam.getCtrlKey(),
				geParam.getAltKey(),
				geParam.getShiftKey(),
				geParam.getClientX(),
				geParam.getClientY(), null, geParam);

			if (heliosMapEvent.button === 0) {
				this.executeEventCallback(heliosMapEvent, callback);
			}
		};

		google.earth.addEventListener(nativeGeometry, "click", handler);

		let cancelFunc = () => {
			google.earth.removeEventListener(nativeGeometry, "click", handler);
		};

		return cancelFunc;
	}

	public attachOnRightClickEvent(nativeGeometry: google.earth.KmlPlacemark, callback: (event: MapEventArgs) => void, isPoint = false): () => void {
		let handler = (geParam) => {
			const heliosMapEvent: MapEventArgs = new MapEventArgs(
				isPoint ? geParam.getTarget().getGeometry().getLongitude() : geParam.getLongitude(),
				isPoint ? geParam.getTarget().getGeometry().getLatitude() : geParam.getLatitude(),
				isPoint ? geParam.getTarget().getGeometry().getAltitude() : geParam.getAltitude(),
				geParam.getButton(),
				geParam.getCtrlKey(),
				geParam.getAltKey(),
				geParam.getShiftKey(),
				geParam.getClientX(),
				geParam.getClientY(),
				null,
				geParam
			);

			if (heliosMapEvent.button === 2) {
				this.executeEventCallback(heliosMapEvent, callback);
			}
		};

		google.earth.addEventListener(nativeGeometry, "click", handler);

		let cancelFunc = () => {
			google.earth.removeEventListener(nativeGeometry, "click", handler);
		};

		return cancelFunc;
	}

	public openBalloonHtml(nativeGeometry: google.earth.KmlPlacemark, html: string): void {
		const balloon = this.map.createHtmlStringBalloon("");
		balloon.setFeature(nativeGeometry);
		balloon.setContentString(html);
		this.map.setBalloon(balloon);
	}

	public openBalloonImage(nativeGeometry: any,
							imageSource: any,
							maxHeight?: string,
							maxWidth?: string,
							height?: string,
							width?: string): void {
		const image = document.createElement("img");
		image.setAttribute("src", imageSource);
		image.style.maxHeight = maxHeight;
		image.style.maxWidth = maxWidth;
		if (height) {
			image.style.height = height;
		}
		if (width) {
			image.style.width = width;
		}

		this.openBalloonHtml(nativeGeometry, image.outerHTML);
	}

	public latLngToCoordinate(geCoordinate: google.earth.KmlCoord | google.earth.KmlMouseEvent): Coordinate {
		return new Coordinate(
			geCoordinate.getLatitude(),
			geCoordinate.getLongitude(),
			geCoordinate.getAltitude()
		);
	}

	public latLngsToCoordinates(latlngs: google.earth.KmlCoordArray): Coordinate[] {
		let array: Coordinate[] = [];

		for (let i = 0; i < latlngs.getLength(); i++) {
			array.push(this.latLngToCoordinate(latlngs.get(i)));
		}

		return array;
	}

	public coordinateToLatLng(coordinate: Coordinate): google.earth.KmlCoord {
		let coord = (<any>this.map).createCoord();
		coord.setLatLngAlt(
			coordinate.latitude,
			coordinate.longitude,
			coordinate.altitude
		);
		return coord;
	}

	public coordinatesToLatLngs(coordinates: Coordinate[]): google.earth.KmlCoord[] {
		let array: google.earth.KmlCoord[] = [];

		_.each(coordinates, (current: Coordinate) => {
			array.push(this.coordinateToLatLng(current));
		});

		return array;
	}

	public replaceKmlCoordArray(oldArray: google.earth.KmlCoordArray, newArray: Coordinate[]): void {
		while (oldArray.getLength() > 0) {
			oldArray.pop();
		}

		let newCoordinates = this.coordinatesToLatLngs(newArray);
		_.each(newCoordinates, (current: google.earth.KmlCoord) => {
			oldArray.push(current);
		});
	}

	public dragPlacemark(placemark: google.earth.KmlPlacemark, accuracy: number = 5): () => void {
		let moveCounter = 0;
		const placemarkCoordinates = this.getPlacemarkCoordinates(placemark);
		const originalCoordinates = placemarkCoordinates.map(geCoordinates =>
			this.latLngsToCoordinates(geCoordinates)
		);

		let originalStartDragCoord: Coordinate;

		let mouseDownHandler = (event: google.earth.KmlMouseEvent) => {
			originalStartDragCoord = this.latLngToCoordinate(event);

			google.earth.addEventListener(this.map.getGlobe(), "mousemove", mouseMoveHandler);
			google.earth.addEventListener(this.map.getGlobe(), "mouseup", mouseUpHandler);
		};

		let mouseUpHandler = () => {
			google.earth.removeEventListener(this.map.getGlobe(), "mousemove", mouseMoveHandler);
			google.earth.removeEventListener(this.map.getGlobe(), "mouseup", mouseUpHandler);
		};

		let mouseMoveHandler = (event: google.earth.KmlMouseEvent) => {
			event.preventDefault();
			moveCounter++;
			if (moveCounter % accuracy === 0) {
				let newPosition: Coordinate = this.latLngToCoordinate(event);

				let deltaLatitude = newPosition.latitude - originalStartDragCoord.latitude;
				let deltaLongitude = newPosition.longitude - originalStartDragCoord.longitude;

				placemarkCoordinates.forEach((geCoordinates, i) => {
					for (let j = 0; j < geCoordinates.getLength(); j++) {
						let newCoord = (<any>this.map).createCoord();
						newCoord.setLatitude(originalCoordinates[i][j].latitude + deltaLatitude);
						newCoord.setLongitude(originalCoordinates[i][j].longitude + deltaLongitude);
						geCoordinates.set(j, newCoord);
					}
				});
			}
		};

		google.earth.addEventListener(placemark, "mousedown", mouseDownHandler);

		let cancel = () => {
			google.earth.removeEventListener(placemark, "mousedown", mouseDownHandler);
			google.earth.removeEventListener(placemark, "mouseup", mouseUpHandler);
		};

		return cancel;
	}

	public setOpacity(colorObj: google.earth.KmlColor, opacity: number) {
		colorObj.setA(Math.round(opacity * 255));
	}

	public setColor(colorObj: google.earth.KmlColor, color: string) {
		const rgba = ColorRgba.fromColorString(color);
		colorObj.setR(rgba.R);
		colorObj.setG(rgba.G);
		colorObj.setB(rgba.B);
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

	private getPlacemarkCoordinates(placemark: google.earth.KmlPlacemark): google.earth.KmlCoordArray[] {
		const geometry = placemark.getGeometry();
		const allCoordinates: google.earth.KmlCoordArray[] = [];
		switch (geometry.getType()) {
			case "KmlLineString": {
				allCoordinates.push((<google.earth.KmlLineString>geometry).getCoordinates());
				break;
			}
			case "KmlPolygon": {
				allCoordinates.push((<google.earth.KmlPolygon>geometry).getOuterBoundary().getCoordinates());
				const innerBoundaries = (<google.earth.KmlPolygon>geometry).getInnerBoundaries().getChildNodes();

				for (let index = 0; index < innerBoundaries.getLength(); index++) {
					allCoordinates.push(innerBoundaries.item(index).getCoordinates());
				}
				break;
			}
			default: {
				throw new Error("Cant get the coordinates for this type of geometry placemark");
			}
		}

		return allCoordinates;
	}

	private executeEventCallback(e: MapEventArgs, callback: (event: MapEventArgs) => void) {
		if (this.config.debugMode) {
			setTimeout(() => {
				callback(e);
			}, 100);
		} else {
			callback(e);
		}
	}
}
