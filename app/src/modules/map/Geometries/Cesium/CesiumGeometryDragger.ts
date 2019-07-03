import { MapEventArgs } from "../../Events/MapEventArgs";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";

const Cesium = require("cesium/Source/Cesium");

export class CesiumGeometryDragger {
	private mapUtils: CesiumUtilities;

	constructor(private mapComponent: CesiumMapComponent) {
		this.mapUtils = this.mapComponent.utils;
	}

	/**
	 * enables dragging polygon with mouse dragging.
	 * @param {Cesium.Entity} polygonEntity entity polygon to drag
	 * @return {() => void} function to finish drag mode
	 */
	public enableDragPolygon(polygonEntity: Cesium.Entity) {
		let hierarchy: Cesium.PolygonHierarchy;
		const leftDownCallback = () => {
			const oldHierarchy = polygonEntity.polygon.hierarchy.getValue(Cesium.JulianDate.now());

			const positions = oldHierarchy.positions.map(pos => pos);
			const holes = oldHierarchy.holes.map(hole => hole);
			hierarchy = new Cesium.PolygonHierarchy(positions, holes);
			polygonEntity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
				return hierarchy;
			}, false);
		};

		const moveCallback = (cartesianStart: Cesium.Cartesian3, cartesianEnd: Cesium.Cartesian3) => {
			const cartesianDistance: Cesium.Cartesian3 = Cesium.Cartesian3.subtract(cartesianEnd, cartesianStart, {});
			hierarchy.positions = hierarchy.positions.map((pos) => Cesium.Cartesian3.add(pos, cartesianDistance, {}));
			hierarchy.holes.forEach(hole => {
				hole.positions = hole.positions.map((pos) => Cesium.Cartesian3.add(pos, cartesianDistance, {}));
			});
		};

		const leftUpCallback = () => {
			polygonEntity.polygon.hierarchy = new Cesium.ConstantProperty(hierarchy);
		};

		return this.dragGeometry(polygonEntity, leftDownCallback, moveCallback, leftUpCallback);
	}

	/**
	 * enables dragging polyline with mouse dragging.
	 * @param {Cesium.Entity} polylineEntity entity polyline to drag
	 * @return {() => void} function to finish drag mode
	 */
	public enableDragPolyline(polylineEntity: Cesium.Entity) {
		let positions: Cesium.Cartesian3[];

		const leftDownCallback = () => {
			const oldPositions = polylineEntity.polyline.positions.getValue(Cesium.JulianDate.now());

			positions = oldPositions.slice(0);

			polylineEntity.polyline.positions = new Cesium.CallbackProperty(() => {
				return positions;
			}, false);

			return positions;
		};

		const moveCallback = (cartesianStart: Cesium.Cartesian3, cartesianEnd: Cesium.Cartesian3) => {
			const cartesianDistance: Cesium.Cartesian3 = Cesium.Cartesian3.subtract(cartesianEnd, cartesianStart, {});
			positions.forEach((pos) => Cesium.Cartesian3.add(pos, cartesianDistance, pos));
		};

		const leftUpCallback = () => {
			polylineEntity.polyline.positions = new Cesium.ConstantProperty(positions);
		};

		return this.dragGeometry(polylineEntity, leftDownCallback, moveCallback, leftUpCallback);
	}

	/**
	 * enables dragging point with mouse dragging.
	 * @param {Cesium.Entity} pointEntity thr point entity to drag
	 * @param {(newPosition: Cesium.Cartesian3) => void} onDragCallback callback on mouse move event
	 * @param {() => void} onLeftDownCallback callback on start dragging
	 * @param {() => void} onLeftUpCallback callback on stop dragging
	 * @return {() => void} function to finish drag mode
	 */
	public enableDragPoint(pointEntity: Cesium.Entity,
		onDragCallback?: (newPosition: Cesium.Cartesian3) => void,
		onLeftDownCallback?: () => void,
		onLeftUpCallback?: () => void): () => void {

		let position: Cesium.Cartesian3;
		const leftDownCallback = () => {
			const oldPosition = pointEntity.position.getValue(Cesium.JulianDate.now());
			position = Cesium.Cartesian3.clone(oldPosition, new Cesium.Cartesian3());
			pointEntity.position = new Cesium.CallbackProperty(() => position, false);

			onLeftDownCallback && onLeftDownCallback();
		};

		const moveCallback = (cartesianStart: Cesium.Cartesian3, cartesianEnd: Cesium.Cartesian3) => {
			Cesium.Cartesian3.add(cartesianEnd, new Cesium.Cartesian3(0, 0, 0), position);
			onDragCallback && onDragCallback(position);
		};

		const leftUpCallback = () => {
			pointEntity.position = new Cesium.ConstantProperty(position);
			onLeftUpCallback && onLeftUpCallback();
		};

		return this.dragGeometry(pointEntity, leftDownCallback, moveCallback, leftUpCallback);
	}

	/**
	 * Handles the drag events for geometries dragging: register for the events, disable the camera motion while dragging, and cancel the events.
	 * The responsibility of changing the coordinates of the geometry is in the callbacks parameters
	 * @param {Cesium.Entity} entity the entity to drag
	 * @param {() => void} onLeftDownCallback callback function that will be invoked in drag start
	 * @param {(cartesianStart: Cesium.Cartesian3, cartesianEnd: Cesium.Cartesian3) => void} onMoveCallback callback function that will be invoked in drag move with the cartesian points of the start and and points
	 * @param {() => void} onLeftUpCallback callback function that will be invoked in drag end
	 * @return {() => void} function to finish drag mode
	 */
	private dragGeometry(entity: Cesium.Entity,
		onLeftDownCallback: () => void,
		onMoveCallback: (cartesianStart: Cesium.Cartesian3, cartesianEnd: Cesium.Cartesian3) => void,
		onLeftUpCallback: () => void
	): () => void {
		let startPosition: Cesium.Cartesian2;
		let isInDragProcess = false;
		const leftDownListener = (eventArgs: MapEventArgs) => {
			if (!isInDragProcess) {
				isInDragProcess = true;
				this.mapUtils.setCameraMotionState(false);
				startPosition = new Cesium.Cartesian2(eventArgs.clientX, eventArgs.clientY);
				onLeftDownCallback();
				this.mapComponent.on("mousemove", mouseMoveListener);
				this.mapComponent.on("mouseup", stopDrag);
			}
		};

		const mouseMoveListener = (eventArgs: MapEventArgs) => {
			// the logic: converts the start and end screen positions to 3d cartesian points and send them to the callback.
			// we use the end position from the eventArgs parameter, and the start position we don't use from this param,
			// because it has bugs, so we save in left down and in the end of this function the last position as the start position
			const movePosition = new Cesium.Cartesian2(eventArgs.endPosX, eventArgs.endPosY);
			const cartesianStart = this.mapUtils.toCartesianFromMousePosition(startPosition);
			const cartesianEnd = this.mapUtils.toCartesianFromMousePosition(movePosition);

			onMoveCallback(cartesianStart, cartesianEnd);
			this.mapUtils.requestRender();
			startPosition = movePosition;
		};

		// this is the entry point to the drag mode
		const leftDownCancelEvent = this.mapUtils.addEntityMouseEvent(leftDownListener, Cesium.ScreenSpaceEventType.LEFT_DOWN, entity);

		const stopDrag = () => {
			if (isInDragProcess) {
				isInDragProcess = false;
				onLeftUpCallback();
				this.mapComponent.off("mousemove", mouseMoveListener);
				this.mapComponent.off("mouseup", stopDrag);
				this.mapUtils.setCameraMotionState(true);
			}
		};

		const finishDragMode = () => {
			leftDownCancelEvent();
			stopDrag();
		};

		return finishDragMode;
	}
}
