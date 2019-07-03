import * as turf from "@turf/helpers";
import midpoint from "@turf/midpoint";
import { CesiumGeometryDragger } from "./CesiumGeometryDragger";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { Coordinate } from "../Coordinate";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { Point } from "../Point";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";

const Cesium = require("cesium/Source/Cesium");

class EditedLineData {
	/**
	 * Points on the map representing the line's actual vertices.
	 */
	public vertexPoints: Point[];
	/**
	 * Points on the map representing the middle between every two vertices of the line.
	 * Dragging these points adds a new vertex to the line.
	 * The new vertex will replace the middle point at the end of the drag action.
	 */
	public middlePoints: Point[];
	/**
	 * The functions that cancel the drag event handlers of the vertex points.
	 */
	public vertexDragCancelers: (() => void)[];
	/**
	 * The functions that cancel the drag event handlers of the middle points.
	 */
	public middleDragCancelers: (() => void)[];

	public isLineCircular: boolean;

	public positions: Cesium.Cartesian3[];
	public coordinates: Coordinate[];

	constructor(public editedEntity: Cesium.Entity,
		public onDragCallback?: (newPositions: Cesium.Cartesian3[]) => void,
		public onLeftDownCallback?: () => void,
		public onLeftUpCallback?: () => void) {
		this.positions = editedEntity.polyline.positions.getValue(Cesium.JulianDate.now());
		this.coordinates = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(editedEntity.polyline);
		this.isLineCircular = Cesium.Cartesian3.equals(this.positions[0], this.positions[this.positions.length - 1]);
		this.vertexPoints = [];
		this.middlePoints = [];
		this.vertexDragCancelers = [];
		this.middleDragCancelers = [];
	}
}

/**
 * A Service for dragging geometries on cesium.
 */
export class CesiumLineEditor {
	private cesiumGeometryDragger: CesiumGeometryDragger;
	/**
	 * The current position of the middle point before the currently dragged vertex.
	 * Used by the callback property of the corresponding middle point.
	 */
	private previousMiddlePointUpdatedPosition: Cesium.Cartesian3;
	/**
	 * The current position of the middle point after the currently dragged vertex.
	 * Used by the callback property of the corresponding middle point.
	 */
	private nextMiddlePointUpdatedPosition: Cesium.Cartesian3;


	private readonly VERTEX_DESIGN: IGeometryDesign = {
		icons: [{
			image: {
				url: require("../../../../../../app/assets/editPoint.png"),
				size: {width: 20, height: 20},
			}
		}]
	};
	private readonly MIDDLE_DESIGN: IGeometryDesign = {
		icons: [{
			image: {
				url: require("../../../../../../app/assets/editPointTransparent.png"),
				size: {width: 20, height: 20},
			}
		}]
	};


	constructor(private mapComponent: CesiumMapComponent) {
		this.cesiumGeometryDragger = new CesiumGeometryDragger(this.mapComponent);
	}

	/**
	 * Starts an edit mode on a cesium line.
	 * @param line - The cesium line to be edited.
	 * @returns A finish function for the edit mode.
	 */
	public enableEditPolyline(line: Cesium.Entity,
		onDragCallback?: (newPositions: Cesium.Cartesian3[]) => void,
		onLeftDownCallback?: () => void,
		onLeftUpCallback?: () => void): () => void {
		const editedLineData = new EditedLineData(line, onDragCallback, onLeftDownCallback, onLeftUpCallback);
		this.addLinePointsToMap(editedLineData);

		return () => {
			this.finishEditMode(editedLineData);
		};
	}

	private addLinePointsToMap(editedLineData: EditedLineData): void {
		this.addVertexPointsToMap(editedLineData);
		this.addMiddlePointsToMap(editedLineData);
	}

	private addVertexPointsToMap(editedLineData: EditedLineData): void {
		// when the line is circular (like in polygon), the last coordinate won't have vertex point, because it has from the first point
		let endCoordinatesIndex = editedLineData.coordinates.length;
		endCoordinatesIndex = editedLineData.isLineCircular ? endCoordinatesIndex - 1 : endCoordinatesIndex;

		editedLineData.vertexPoints = editedLineData.coordinates.slice(0, endCoordinatesIndex).map(coordinate => {
				const point = this.mapComponent.geometryBuilder.buildPoint(coordinate, this.VERTEX_DESIGN);
				point.addToMap();
				return point;
			}
		);

		editedLineData.vertexDragCancelers = editedLineData.vertexPoints.map(point =>
			this.setVertexPointDragEvents(point, editedLineData)
		);
	}

	private addMiddlePointsToMap(editedLineData: EditedLineData): void {
		editedLineData.coordinates.reduce((previousCoordinate, currentCoordinate, currentIndex) => {
			this.addMiddlePointBetweenPoints(previousCoordinate, currentCoordinate, currentIndex, editedLineData);
			// the return value is for the previousCoordinate param of the next iteration
			return currentCoordinate;
		});
	}

	private addMiddlePointBetweenPoints(previousCoordinate: Coordinate, nextCoordinate: Coordinate, middleIndex: number, editedLineData: EditedLineData): void {
		const middlePoint = this.getMiddlePoint(previousCoordinate, nextCoordinate);
		middlePoint.addToMap();

		editedLineData.middlePoints.splice(middleIndex, 0, middlePoint);

		const cancelDragFn = this.setMiddlePointDragEvents(middlePoint, editedLineData);
		editedLineData.middleDragCancelers.splice(middleIndex, 0, cancelDragFn);
	}

	private setVertexPointDragEvents(point: Point, editedLineData: EditedLineData): () => void {
		const pointMouseLeftDownHandler = this.getVertexPointMouseLeftDownHandler(point, editedLineData);
		const pointDragHandler = this.getVertexPointDragHandler(point, editedLineData);
		const pointMouseLeftUpHandler = this.getVertexPointMouseLeftUpHandler(point, editedLineData);
		return this.cesiumGeometryDragger.enableDragPoint(point.getGeometryOnMap(),
			pointDragHandler, pointMouseLeftDownHandler, pointMouseLeftUpHandler);
	}

	private setMiddlePointDragEvents(middlePoint: Point, editedLineData: EditedLineData): () => void {
		const pointMouseLeftDownHandler = this.getMiddlePointMouseLeftDownHandler(middlePoint, editedLineData);
		const pointDragHandler = this.getMiddlePointDragHandler(middlePoint, editedLineData);
		const pointMouseLeftUpHandler = this.getMiddlePointMouseLeftUpHandler(middlePoint, editedLineData);
		return this.cesiumGeometryDragger.enableDragPoint(middlePoint.getGeometryOnMap(),
			pointDragHandler, pointMouseLeftDownHandler, pointMouseLeftUpHandler);
	}

	private getPreviousVertxIndex(vertexIndex: number, editedLineData: EditedLineData): number | undefined {
		if (vertexIndex > 0) {
			return vertexIndex - 1;
		}
		else if (editedLineData.isLineCircular) {
			return editedLineData.vertexPoints.length - 1;
		}
	}

	private getNextVertxIndex(vertexIndex: number, editedLineData: EditedLineData): number | undefined {
		if (vertexIndex < editedLineData.vertexPoints.length - 1) {
			return vertexIndex + 1;
		}
		else if (editedLineData.isLineCircular) {
			return 0;
		}
	}

	private getVertexPointMouseLeftDownHandler(point: Point, editedLineData: EditedLineData): () => void {
		const handleVertexPointMouseLeftDown = (vertexIndex: number) => {

			this.setCallbackPropertyOfLinePositions(editedLineData, true);

			// turn on previous middle point callback property
			const previousIndex = this.getPreviousVertxIndex(vertexIndex, editedLineData);
			if (previousIndex !== undefined) {
				this.previousMiddlePointUpdatedPosition = this.getMiddleBetweenVerticesIndexes(previousIndex, vertexIndex, editedLineData);
				const middlePointIndex = previousIndex;
				editedLineData.middlePoints[middlePointIndex].getGeometryOnMap().position =
					new Cesium.CallbackProperty(() => {
						return this.previousMiddlePointUpdatedPosition;
					}, false);
			}

			// turn on next middle point callback property
			const nextIndex = this.getNextVertxIndex(vertexIndex, editedLineData);
			if (nextIndex !== undefined) {
				this.nextMiddlePointUpdatedPosition = this.getMiddleBetweenVerticesIndexes(vertexIndex, nextIndex, editedLineData);
				const middlePointIndex = vertexIndex;
				editedLineData.middlePoints[middlePointIndex].getGeometryOnMap().position =
					new Cesium.CallbackProperty(() => {
						return this.nextMiddlePointUpdatedPosition;
					}, false);
			}
		};

		return () => {
			const pointIndex = editedLineData.vertexPoints.indexOf(point);
			handleVertexPointMouseLeftDown(pointIndex);
			editedLineData.onLeftDownCallback && editedLineData.onLeftDownCallback();
		};
	}

	private getVertexPointDragHandler(point: Point, editedLineData: EditedLineData): (newPosition: Cesium.Cartesian3) => void {
		const handleVertexPointDrag = (vertexIndex: number, newPosition: Cesium.Cartesian3) => {
			this.updatePoint(vertexIndex, newPosition, editedLineData);

			if (editedLineData.isLineCircular && vertexIndex === 0) {
				this.updatePoint(editedLineData.positions.length - 1, newPosition, editedLineData);
			}

			this.updateNeighboursMiddlePoints(vertexIndex, editedLineData);

			this.mapComponent.utils.requestRender();
		};

		return (newPosition: Cesium.Cartesian3) => {
			const pointIndex = editedLineData.vertexPoints.indexOf(point);
			handleVertexPointDrag(pointIndex, newPosition);
			editedLineData.onDragCallback && editedLineData.onDragCallback(editedLineData.positions);
		};
	}

	private getVertexPointMouseLeftUpHandler(point: Point, editedLineData: EditedLineData): () => void {
		const handleVertexPointMouseLeftUp = (vertexIndex: number) => {
			this.setCallbackPropertyOfLinePositions(editedLineData, false);

			// turn off previous middle point callback property
			const previousIndex = this.getPreviousVertxIndex(vertexIndex, editedLineData);
			if (previousIndex !== undefined) {
				editedLineData.middlePoints[previousIndex].getGeometryOnMap().position = this.previousMiddlePointUpdatedPosition;
			}

			// turn off next middle point callback property
			if (this.getNextVertxIndex(vertexIndex, editedLineData) !== undefined) {
				editedLineData.middlePoints[vertexIndex].getGeometryOnMap().position = this.nextMiddlePointUpdatedPosition;
			}
		};

		return () => {
			const pointIndex = editedLineData.vertexPoints.indexOf(point);
			handleVertexPointMouseLeftUp(pointIndex);
			editedLineData.onLeftUpCallback && editedLineData.onLeftUpCallback();
		};
	}

	private getMiddlePointMouseLeftDownHandler(point: Point, editedLineData: EditedLineData) {

		const handleMiddlePointMouseLeftDown = (middlePointIndex: number) => {
			const middlePosition = editedLineData.middlePoints[middlePointIndex].getGeometryOnMap().position.getValue(Cesium.JulianDate.now());
			const positions = editedLineData.editedEntity.polyline.positions.getValue(Cesium.JulianDate.now());
			positions.splice(middlePointIndex + 1, 0, middlePosition);

			this.setCallbackPropertyOfLinePositions(editedLineData, true);

			this.mapComponent.utils.requestRender();
		};

		return () => {
			const middlePointIndex = editedLineData.middlePoints.indexOf(point);
			handleMiddlePointMouseLeftDown(middlePointIndex);
			editedLineData.onLeftDownCallback && editedLineData.onLeftDownCallback();
		};
	}

	private getMiddlePointDragHandler(point: Point, editedLineData: EditedLineData): (newPosition: Cesium.Cartesian3) => void {

		const handleMiddlePointDrag = (middlePointIndex: number, newPosition: Cesium.Cartesian3) => {
			this.updatePoint(middlePointIndex + 1, newPosition, editedLineData);
			this.mapComponent.utils.requestRender();
		};

		return (newPosition: Cesium.Cartesian3) => {
			const middlePointIndex = editedLineData.middlePoints.indexOf(point);
			handleMiddlePointDrag(middlePointIndex, newPosition);
			editedLineData.onDragCallback && editedLineData.onDragCallback(editedLineData.positions);
		};
	}

	private getMiddlePointMouseLeftUpHandler(point: Point, editedLineData: EditedLineData): () => void {
		return () => {
			const middlePointIndex = editedLineData.middlePoints.indexOf(point);

			const previousCoordinate = CesiumUtilities.toCoordinateFromCartesian(editedLineData.positions[middlePointIndex]);
			const newVertexCoordinate = CesiumUtilities.toCoordinateFromCartesian(editedLineData.positions[middlePointIndex + 1]);
			const nextCoordinate = CesiumUtilities.toCoordinateFromCartesian(editedLineData.positions[middlePointIndex + 2]);

			// insert 2 middle points.
			this.addMiddlePointBetweenPoints(previousCoordinate, newVertexCoordinate, middlePointIndex, editedLineData);
			this.addMiddlePointBetweenPoints(newVertexCoordinate, nextCoordinate, middlePointIndex + 1, editedLineData);

			// remove old middle.
			const indexOfOldMiddle = middlePointIndex + 2;
			const oldMiddlePointCanceler = editedLineData.middleDragCancelers.splice(indexOfOldMiddle, 1)[0];
			oldMiddlePointCanceler();
			editedLineData.middlePoints[indexOfOldMiddle].remove();
			editedLineData.middlePoints.splice(indexOfOldMiddle, 1);

			// add new vertex point (not line position)
			const newVertex = this.mapComponent.geometryBuilder.buildPoint(newVertexCoordinate, this.VERTEX_DESIGN);
			editedLineData.vertexPoints.splice(middlePointIndex + 1, 0, newVertex);
			newVertex.addToMap();
			const cancelDragFn = this.setVertexPointDragEvents(newVertex, editedLineData);
			editedLineData.vertexDragCancelers.splice(middlePointIndex + 1, 0, cancelDragFn);

			this.setCallbackPropertyOfLinePositions(editedLineData, false);
			editedLineData.onLeftUpCallback && editedLineData.onLeftUpCallback();
		};
	}

	private getMiddlePoint(coordinate1: Coordinate, coordinate2: Coordinate): Point {
		const middleCoordinate = this.getMiddleCoordinate(coordinate1, coordinate2);
		const middlePoint = this.mapComponent.geometryBuilder.buildPoint(middleCoordinate, this.MIDDLE_DESIGN);
		return middlePoint;
	}

	private getMiddleCoordinate(coordinate1: Coordinate, coordinate2: Coordinate): Coordinate {
		const point1 = turf.point(coordinate1.getGeoJSON());
		const point2 = turf.point(coordinate2.getGeoJSON());
		const middlePointCoordinates = midpoint(point1, point2).geometry.coordinates;
		return Coordinate.fromGeoJSON(middlePointCoordinates);
	}

	/**
	 * Initializes the cesium's CallbackProperties on the line's positions.
	 * Required for a smooth change of the line's position on the map.
	 * @param line - The line to add the position's callback properties to.
	 * @param isCallbackProperty - Whether to set callback property on or off.
	 */
	private setCallbackPropertyOfLinePositions(editedLineData: EditedLineData, isCallbackProperty: boolean): void {
		const currentPositions = editedLineData.editedEntity.polyline.positions.getValue(Cesium.JulianDate.now());
		if (isCallbackProperty) {
			editedLineData.positions = currentPositions;
			editedLineData.editedEntity.polyline.positions = new Cesium.CallbackProperty(() => {
				return editedLineData.positions;
			}, false);
		} else {
			editedLineData.editedEntity.polyline.positions = new Cesium.ConstantProperty(currentPositions);
		}
	}

	private updatePoint(vertexIndex: number, newPosition: Cesium.Cartesian3, editedLineData: EditedLineData): void {
		const lineVertex = editedLineData.positions[vertexIndex];

		if (!lineVertex) {
			console.error(`Could not find the vertex in the geometry. Vertex index: ${vertexIndex}.`);
			return;
		}

		lineVertex.x = newPosition.x;
		lineVertex.y = newPosition.y;
		lineVertex.z = newPosition.z;
	}

	private updateNeighboursMiddlePoints(vertexIndex: number, editedLineData: EditedLineData): void {
		// update previous middle point
		const previousIndex = this.getPreviousVertxIndex(vertexIndex, editedLineData);
		if (previousIndex !== undefined) {
			this.previousMiddlePointUpdatedPosition = this.getMiddleBetweenVerticesIndexes(previousIndex, vertexIndex, editedLineData);
		}
		// update next middle point
		const nextIndex = this.getNextVertxIndex(vertexIndex, editedLineData);
		if (nextIndex !== undefined) {
			this.nextMiddlePointUpdatedPosition = this.getMiddleBetweenVerticesIndexes(vertexIndex, nextIndex, editedLineData);
		}
	}

	private getMiddleBetweenVerticesIndexes(firstVertexIndex: number, secondVertexIndex: number, editedLineData: EditedLineData): Cesium.Cartesian3 {
		const firstCoordinate = CesiumUtilities.toCoordinateFromCartesian(editedLineData.positions[firstVertexIndex]);
		const secondCoordinate = CesiumUtilities.toCoordinateFromCartesian(editedLineData.positions[secondVertexIndex]);
		const newMiddleCoordinate = this.getMiddleCoordinate(firstCoordinate, secondCoordinate);
		return CesiumUtilities.toCartesianFromCoordinate(newMiddleCoordinate);
	}

	private finishEditMode(editedLineData: EditedLineData): void {
		this.setCallbackPropertyOfLinePositions(editedLineData, false);
		this.removePointDragListeners(editedLineData);
		this.removePoints(editedLineData);
	}

	private removePointDragListeners(editedLineData: EditedLineData): void {
		[...editedLineData.vertexDragCancelers, ...editedLineData.middleDragCancelers].forEach(pointCancelDragFn => pointCancelDragFn());
	}

	private removePoints(editedLineData: EditedLineData): void {
		editedLineData.vertexPoints.forEach(point => point.remove());
		editedLineData.middlePoints.forEach(point => point.remove());
	}
}
