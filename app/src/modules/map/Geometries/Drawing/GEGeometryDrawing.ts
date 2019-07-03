import { IActionToken } from "../../Common/IActionToken";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { XXXMapUtils } from "../../MapUtils/XXXMapUtils";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { DoubleLine } from "../DoubleLine";
import { IGeometryDrawing } from "./IGeometryDrawing";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";

export class GEGeometryDrawing implements IGeometryDrawing {
	private mapComponent: GoogleEarthMapComponent;

	constructor(mapComponent: GoogleEarthMapComponent) {
		this.mapComponent = mapComponent;
	}

	private samplePoint(token?: IActionToken): Promise<Coordinate> {
		return new Promise<Coordinate>((resolve, reject) => {
			let listener = (eventArgs: MapEventArgs) => {
				eventArgs.preventDefault();
				const coordinate = new Coordinate(eventArgs.latitude, eventArgs.longitude);
				this.mapComponent.off("click", listener);
				resolve(coordinate);
			};
			this.mapComponent.on("click", listener);

			if (token) {
				token.cancel = (): void => {
					this.mapComponent.off("click", listener);
					reject();
				};
			}
		});
	}

	private sampleLine(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			const path = XXXMapUtils.getNewPath();
			path.startDrawing();
			path.setDoneDrawingEvent(() => {
				const points = path.getPoints();
				const coordinates = [];

				for (let i = 0; i < points.length; i++) {
					coordinates.push(new Coordinate(points[i].y, points[i].x));
				}

				this.mapComponent.nativeMapInstance.getFeatures().removeChild(path.getOriginalObject());
				resolve(coordinates);
			});

			if (token) {
				token.cancel = (): void => {
					path.stopDrawing();
					path.clearPoints();
					this.mapComponent.nativeMapInstance.getFeatures().removeChild(path.getOriginalObject());
					reject();
				};
			}
		});
	}

	private samplePolygon(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			const path = XXXMapUtils.getNewPolygon();
			path.startDrawing();
			path.setDoneDrawingEvent(() => {
				const points = path.getPoints();
				const coordinates = [];

				for (let i = 0; i < points.length; i++) {
					coordinates.push(new Coordinate(points[i].y, points[i].x));
				}

				this.mapComponent.nativeMapInstance.getFeatures().removeChild(path.getOriginalObject());
				resolve(coordinates);
			});


			if (token) {
				token.cancel = (): void => {
					path.stopDrawing();
					path.clearPoints();
					this.mapComponent.nativeMapInstance.getFeatures().removeChild(path.getOriginalObject());
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
