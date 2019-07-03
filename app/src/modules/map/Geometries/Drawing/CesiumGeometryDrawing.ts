import { IActionToken } from "../../Common/IActionToken";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GeometryDesign } from "../../GeometryDesign/GeometryDesign";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapUtils } from "../../MapUtils/MapUtils";
import { Arrow } from "../Arrow";
import { CesiumLine } from "../Cesium/CesiumLine";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { GEOMETRY_TYPES } from "../GeometryTypes";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { IGeometryDrawing } from "./IGeometryDrawing";
import { CesiumEntitiesCreator } from "../Cesium/CesiumEntities/CesiumEntitiesCreator";

const Cesium = require("cesium/Source/Cesium");

export class CesiumGeometryDrawing implements IGeometryDrawing {
	private mapComponent: CesiumMapComponent;
	private readonly iconUrl: string;
	private readonly defaultDrawingDesign: GeometryDesign;
	private readonly defaultRectangleDrawingDesign: GeometryDesign;

	constructor(mapComponent: CesiumMapComponent) {
		this.mapComponent = mapComponent;
		this.iconUrl = require("../../../../../assets/editPoint.png");
		this.defaultDrawingDesign = new GeometryDesign({
			icons: [
				{
					image: {
						url: this.iconUrl,
						size: {width: 15, height: 15}
					}
				}
			]
		});
		this.defaultRectangleDrawingDesign = new GeometryDesign({
			fill: {
				color: "#999999",
				opacity: 0.4
			}
		});
	}

	private samplePoint(token?: IActionToken): Promise<Coordinate> {
		return new Promise<Coordinate>((resolve, reject) => {
			let listener = (eventArgs: MapEventArgs) => {
				eventArgs.preventDefault();
				const coordinate = new Coordinate(eventArgs.latitude, eventArgs.longitude, eventArgs.altitude);
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
			let coordinates: Coordinate[] = [];
			let points: Point[] = [];
			let lines: Line[] = [];

			const finishDrawingCallback = () => {
				points.forEach((p: Point) => {
					p.remove();
				});
				lines.forEach((l: Line) => {
					l.remove();
				});
				this.mapComponent.off("click", clickListener);
				resolve(coordinates);
			};

			const clickListener = (eventArgsA: MapEventArgs) => {
				const pickedEntity = this.mapComponent.utils.pickNativeEntity(eventArgsA);
				if (!!pickedEntity &&
					points.length > 1 &&
					pickedEntity.id === points[points.length - 1].getId()
				) {
					finishDrawingCallback();
				} else {
					const coordinate = new Coordinate(eventArgsA.latitude, eventArgsA.longitude, eventArgsA.altitude);
					coordinates.push(coordinate);
					const point = this.mapComponent.geometryBuilder.buildPoint(coordinate, this.defaultDrawingDesign);
					point.addToMap();
					points.push(point);

					if (points.length > 1) {
						const line: Line = this.mapComponent.geometryBuilder.buildLine([coordinates[coordinates.length - 1],
							coordinates[coordinates.length - 2]]);
						line.addToMap();
						lines.push(line);
					}
				}
			};
			this.mapComponent.on("click", clickListener);

			if (token) {
				token.cancel = (): void => {
					if (points.length > 0) {
						points.forEach((p: Point) => {
							p.remove();
						});
					}
					if (lines.length > 0) {
						lines.forEach((l: Line) => {
							l.remove();
						});
					}
					this.mapComponent.off("click", clickListener);
					reject();
				};
			}
		});
	}

	private samplePolygon(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			let coordinates: Coordinate[] = [];
			let points: Point[] = [];
			let lines: Line[] = [];
			let polygon: Polygon = null;

			const finishDrawingCallback = () => {

				points.forEach((p: Point) => {
					p.remove();
				});
				lines.forEach((l: Line) => {
					l.remove();
				});
				polygon && polygon.remove();

				this.mapComponent.off("click", clickListener);
				if (coordinates.length < 3) {
					reject("polygon must have more than two points");
				}
				else {
					resolve(coordinates);
				}
			};

			const clickListener = (eventArgsA: MapEventArgs) => {
				const pickedEntity = this.mapComponent.utils.pickNativeEntity(eventArgsA);
				if (!!pickedEntity &&
					points.length > 1 &&
					(pickedEntity.id === points[0].getId() ||
						pickedEntity.id === points[points.length - 1].getId())
				) {
					finishDrawingCallback();
				} else {
					const coordinate = new Coordinate(eventArgsA.latitude, eventArgsA.longitude, eventArgsA.altitude);
					coordinates.push(coordinate);
					const point = this.mapComponent.geometryBuilder.buildPoint(coordinate, this.defaultDrawingDesign);
					point.addToMap();
					points.push(point);

					if (points.length > 1) {
						const line: Line = this.mapComponent.geometryBuilder.buildLine([coordinates[coordinates.length - 1],
							coordinates[coordinates.length - 2]]);
						line.addToMap();
						lines.push(line);
					}

					if (points.length > 2) {
						polygon && polygon.remove();
						polygon = this.mapComponent.geometryBuilder.buildPolygon(coordinates.slice());
						polygon.addToMap();
					}
				}
			};

			this.mapComponent.on("click", clickListener);

			if (token) {
				token.cancel = (): void => {
					if (points.length > 0) {
						points.forEach((p: Point) => {
							p.remove();
						});
					}
					if (lines.length > 0) {
						lines.forEach((l: Line) => {
							l.remove();
						});
					}
					polygon && polygon.remove();

					this.mapComponent.off("click", clickListener);
					reject();
				};
			}
		});
	}

	private sampleRectangle(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			let coordinates: Coordinate[] = [];
			let cartesianArray: number[] = [];
			let hierarchy: { x: number, y: number, z: number }[] = [];
			let line: CesiumLine;
			let rectangle: Cesium.Entity;

			let mouseMoveListener: (eventArgs: any) => void;
			let mouseUpListener: (eventArgs: any) => void = null;
			let mouseDownListener: (eventArgs: any) => void = (eventArgsA: MapEventArgs) => {
				this.mapComponent.utils.setCameraMotionState(false);

				//TODO: Add altitude
				let coordinate = new Coordinate(eventArgsA.latitude, eventArgsA.longitude);
				coordinates.push(coordinate);
				mouseMoveListener = (eventArgsC: MapEventArgs) => {
					//TODO: Needs to add altitude to the coordinates
					coordinates = [coordinate,
						new Coordinate(eventArgsC.latitude,
							coordinate.longitude),
						new Coordinate(eventArgsC.latitude,
							eventArgsC.longitude),
						new Coordinate(coordinate.latitude,
							eventArgsC.longitude)
					];

					if (!rectangle) {
						rectangle = CesiumEntitiesCreator.createPolygonEntity(coordinates, this.defaultRectangleDrawingDesign);
						this.mapComponent.nativeMapInstance.entities.add(rectangle);

						rectangle.polygon.hierarchy = new Cesium.CallbackProperty(() => {
							return { positions: hierarchy };
						}, false);

						line = <CesiumLine>this.mapComponent.geometryBuilder
							.buildLine(coordinates, this.defaultRectangleDrawingDesign);
						line.addToMap();

						let lineEntity = line.getGeometryOnMap().getFlattedGeometries()[0].polyline;
						lineEntity.positions = new Cesium.CallbackProperty(() => {
							return hierarchy;
						}, false);

						mouseUpListener = (eventArgsB: MapEventArgs) => {
							if (!rectangle) {
								reject("You should hold the click while drawing the Rectangle");
								return;
							} else {
								this.mapComponent.nativeMapInstance.entities.remove(rectangle);
								line.remove();
							}

							this.mapComponent.off("mousemove", mouseMoveListener);
							this.mapComponent.off("mouseup", mouseUpListener);
							this.mapComponent.utils.setCameraMotionState(true);

							resolve(coordinates);
						};
						this.mapComponent.on("mouseup", mouseUpListener);
					}
					else {
						cartesianArray = [];

						//TODO: Needs to add altitude to the array
						coordinates.forEach((coordinate: Coordinate) => {
							cartesianArray.push(coordinate.longitude);
							cartesianArray.push(coordinate.latitude);
						});
						cartesianArray.push(coordinate.longitude);
						cartesianArray.push(coordinate.latitude);
						hierarchy = Cesium.Cartesian3.fromDegreesArray(cartesianArray);
					}
				};

				this.mapComponent.off("mousedown", mouseDownListener);
				this.mapComponent.on("mousemove", mouseMoveListener);
			};
			this.mapComponent.on("mousedown", mouseDownListener);

			if (token) {
				token.cancel = (): void => {

					rectangle && this.mapComponent.nativeMapInstance.entities.remove(rectangle);
					line && line.remove();

					this.mapComponent.off("mousemove", mouseMoveListener);
					this.mapComponent.off("mouseup", mouseUpListener);
					this.mapComponent.off("mousedown", mouseDownListener);
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

	public async drawRectangle(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon> {
		const coordinates: Coordinate[] = await this.sampleRectangle(token);
		let poly: Polygon = this.mapComponent.geometryBuilder.buildPolygon(coordinates, design);
		poly.geometryType = GEOMETRY_TYPES.RECTANGLE;
		return poly;
	}

	public drawDoubleLine(design?: IDoubleLineGeometryDesign, token?: IActionToken): Promise<DoubleLine> {
		return undefined;
	}

	public sampleDistance(onSectionAdded: (total: number, currentSection: number) => void, customDesign?: IGeometryDesign, token?: IActionToken): void {
		let design: IGeometryDesign = customDesign || this.defaultDrawingDesign;

		let coordinates: Coordinate[] = [];
		let points: Point[] = [];
		let lines: Line[] = [];
		let sum: number = 0;

		let clickListener = (eventArgsA: MapEventArgs) => {
			if (eventArgsA.ctrlPressed) {
				let coordinate = new Coordinate(eventArgsA.latitude, eventArgsA.longitude, eventArgsA.altitude);
				coordinates.push(coordinate);
				let point = this.mapComponent.geometryBuilder.buildPoint(coordinate, design);
				point.addToMap();
				points.push(point);

				if (points.length > 1) {
					let newLineCoordinate: Coordinate[] = [coordinates[coordinates.length - 1],
						coordinates[coordinates.length - 2]];
					let line: Line = this.mapComponent.geometryBuilder.buildLine(newLineCoordinate, design);
					line.addToMap();
					lines.push(line);
					let newDistance = +(MapUtils.getLineLength(newLineCoordinate, "meters").toFixed(2));
					sum += newDistance;
					sum = +sum.toFixed(2);
					point.setLabel(newDistance + " m");
					onSectionAdded(sum, newDistance);
				}
			}
		};
		this.mapComponent.on("click", clickListener);


		if (token) {
			token.cancel = (): void => {
				points.forEach((p: Point) => {
					p.remove();
				});
				lines.forEach((l: Line) => {
					l.remove();
				});
				sum = 0;
				this.mapComponent.off("click", clickListener);
			};
		}
	}
}