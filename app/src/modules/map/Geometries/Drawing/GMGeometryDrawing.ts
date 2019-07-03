import { IActionToken } from "../../Common/IActionToken";
import { GoogleMapsMapComponent } from "../../Components/GoogleMapsMapComponent";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { DoubleLine } from "../DoubleLine";
import { IGeometryDrawing } from "./IGeometryDrawing";
import * as _ from "underscore";

export class GMGeometryDrawing implements IGeometryDrawing {
	private mapComponent: GoogleMapsMapComponent;

	constructor(mapComponent: GoogleMapsMapComponent) {
		this.mapComponent = mapComponent;
	}

	private samplePoint(token?: IActionToken): Promise<Coordinate> {
		return new Promise<Coordinate>((resolve, reject) => {
			let managerOptions: google.maps.drawing.DrawingManagerOptions = {
				drawingControl: false,
				drawingMode: google.maps.drawing.OverlayType.MARKER,
			};

			let drawingManager = new google.maps.drawing.DrawingManager(managerOptions);
			drawingManager.setMap(this.mapComponent.nativeMapInstance);

			let listener = google.maps.event.addListenerOnce(drawingManager, "markercomplete", (event: any) => {
				event.setMap(null);
				drawingManager.setMap(null);
				let coordinate = new Coordinate(event.getPosition().lat(), event.getPosition().lng());
				resolve(coordinate);
			});

			if (token) {
				token.cancel = (): void => {
					drawingManager.setMap(null);
					google.maps.event.removeListener(listener);
					reject();
				};
			}
		});
	}

	private sampleLine(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			let managerOptions: google.maps.drawing.DrawingManagerOptions = {
				drawingControl: false,
				drawingMode: google.maps.drawing.OverlayType.POLYLINE,
			};

			let drawingManager = new google.maps.drawing.DrawingManager(managerOptions);
			drawingManager.setMap(this.mapComponent.nativeMapInstance);

			let listener = google.maps.event.addListenerOnce(drawingManager, "polylinecomplete", (event: any) => {
				event.setMap(null);
				drawingManager.setMap(null);
				let coordinates: Coordinate[] = [];
				_.each(event.getPath().getArray(), (position: any) => {
					coordinates.push(new Coordinate(position.lat(), position.lng()));
				});
				resolve(coordinates);
			});

			if (token) {
				token.cancel = (): void => {
					drawingManager.setMap(null);
					google.maps.event.removeListener(listener);
					reject();
				};
			}
		});
	}

	private samplePolygon(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			let managerOptions: google.maps.drawing.DrawingManagerOptions = {
				drawingControl: false,
				drawingMode: google.maps.drawing.OverlayType.POLYGON,
			};

			let drawingManager = new google.maps.drawing.DrawingManager(managerOptions);
			drawingManager.setMap(this.mapComponent.nativeMapInstance);

			let listener = google.maps.event.addListenerOnce(drawingManager, "polygoncomplete", (event: any) => {
				event.setMap(null);
				drawingManager.setMap(null);
				let coordinates: Coordinate[] = [];
				_.each(event.getPath().getArray(), (position: any) => {
					coordinates.push(new Coordinate(position.lat(), position.lng()));
				});
				coordinates.push(_.first(coordinates));
				resolve(coordinates);
			});

			if (token) {
				token.cancel = (): void => {
					drawingManager.setMap(null);
					google.maps.event.removeListener(listener);
					reject();
				};
			}
		});
	}


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

	public drawRectangle(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon> {
		throw new Error("Method not implemented.");
	}
}