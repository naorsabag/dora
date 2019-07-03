import { IActionToken } from "../../Common/IActionToken";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { LLUtilties } from "../../MapUtils/LLUtilities";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { DoubleLine } from "../DoubleLine";
import { IGeometryDrawing } from "./IGeometryDrawing";
import * as _ from "underscore";
import * as L from "leaflet";

export class LLGeometryDrawing implements IGeometryDrawing {
	private mapComponent: LeafletMapComponent;

	constructor(mapComponent: LeafletMapComponent) {
		this.mapComponent = mapComponent;
	}

	private samplePoint(token?: IActionToken): Promise<Coordinate> {
		return new Promise<Coordinate>((resolve, reject) => {
			LLUtilties.overrideDefaultDrawFunctions();
			LLUtilties.overrideMarkerDefaultIcon();

			let createdCallback = (event) => {
				resolve(LLUtilties.latLngToCoordinate(event.layer._latlng));
			};

			(<any>L).drawLocal.draw.handlers.marker.tooltip.start = "";
			let marker = new L.Draw.Marker(this.mapComponent.nativeMapInstance, {});
			marker.enable();

			this.mapComponent.nativeMapInstance.once(L.Draw.Event.CREATED, createdCallback);

			if (token) {
				token.cancel = (): void => {
					marker.disable();
					this.mapComponent.nativeMapInstance.off(L.Draw.Event.CREATED, createdCallback);
					reject();
				};
			}
		});
	}

	private sampleLine(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			LLUtilties.overrideDefaultDrawFunctions();
			let createdCallback = (event) => {
				resolve(LLUtilties.latLngsToCoordinates(event.layer._latlngs));
			};

			(<any>L).drawLocal.draw.handlers.polyline.tooltip = {
				start: "",
				cont: "",
				end: ""
			};

			let polyline = new (<any>L).Draw.Polyline(this.mapComponent.nativeMapInstance, {
				showLength: false
			});
			polyline.enable();

			this.mapComponent.nativeMapInstance.once(L.Draw.Event.CREATED, createdCallback);

			if (token) {
				token.cancel = (): void => {
					polyline.disable();
					this.mapComponent.nativeMapInstance.off(L.Draw.Event.CREATED, createdCallback);
					reject();
				};
			}
		});
	}

	private samplePolygon(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			LLUtilties.overrideDefaultDrawFunctions();
			let createdCallback = (event) => {
				let closedShapeCoordinates = event.layer._latlngs[0];
				closedShapeCoordinates.push(_.first(closedShapeCoordinates));
				resolve(LLUtilties.latLngsToCoordinates(closedShapeCoordinates));
			};

			(<any>L).drawLocal.draw.handlers.polygon.tooltip = {
				start: "",
				cont: "",
				end: ""
			};

			let polygon = new L.Draw.Polygon(this.mapComponent.nativeMapInstance, {});
			polygon.enable();

			this.mapComponent.nativeMapInstance.once(L.Draw.Event.CREATED, createdCallback);

			if (token) {
				token.cancel = (): void => {
					polygon.disable();
					this.mapComponent.nativeMapInstance.off(L.Draw.Event.CREATED, createdCallback);
					reject();
				};
			}
		});
	}

	private sampleRectangle(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			LLUtilties.overrideDefaultDrawFunctions();
			const createdCallback = (event) => {
				const closedShapeCoordinates = event.layer._latlngs[0];
				closedShapeCoordinates.push(_.first(closedShapeCoordinates));
				resolve(LLUtilties.latLngsToCoordinates(closedShapeCoordinates));
			};

			(<any>L).drawLocal.draw.handlers.rectangle.tooltip = {
				start: "",
				cont: "",
				end: ""
			};

			const rectangle = new L.Draw.Rectangle(this.mapComponent.nativeMapInstance, {});
			rectangle.enable();

			this.mapComponent.nativeMapInstance.once(L.Draw.Event.CREATED, createdCallback);

			if (token) {
				token.cancel = (): void => {
					rectangle.disable();
					this.mapComponent.nativeMapInstance.off(L.Draw.Event.CREATED, createdCallback);
					reject();
				};
			}
		});
	}


	//TODO: iconDesign in this case???
	public async drawPoint(design?: IGeometryDesign, token?: IActionToken): Promise<Point> {
		const coordinate: Coordinate = await this.samplePoint(token);
		return this.mapComponent.geometryBuilder.buildPoint(coordinate, design);
	}

	public async drawLine(design?: IGeometryDesign, token?: IActionToken): Promise<Line> {
		const coordinates: Coordinate[] = await this.sampleLine(token);
		return this.mapComponent.geometryBuilder.buildLine(coordinates, design);
	}

	public async drawArrow(design?: IArrowGeometryDesign, token?: IActionToken): Promise<Arrow> {
		const coordinates: Coordinate[] = await this.sampleLine(token);
		return this.mapComponent.geometryBuilder.buildArrow(coordinates, design);
	}

	public async drawPolygon(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon> {
		const coordinates: Coordinate[] = await this.samplePolygon(token);
		return this.mapComponent.geometryBuilder.buildPolygon(coordinates, design);
	}

	public async drawDoubleLine(design?: IDoubleLineGeometryDesign, token?: IActionToken): Promise<DoubleLine> {
		const coordinates: Coordinate[] = await this.sampleLine(token);
		return this.mapComponent.geometryBuilder.buildDoubleLine(coordinates, design);
	}

	public async drawRectangle(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon> {
		const coordinates: Coordinate[] = await this.sampleRectangle(token);
		const poly: Polygon = this.mapComponent.geometryBuilder.buildPolygon(coordinates, design);
		return poly;
	}
}