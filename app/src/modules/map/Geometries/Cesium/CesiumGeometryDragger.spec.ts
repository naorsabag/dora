import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { EventSimulator } from "../../../../test/EventSimulator";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { POLY_COORDINATES } from "../../../../test/TestConsts";
import { CesiumGeometryDragger } from "./CesiumGeometryDragger";
import { Coordinate } from "../Coordinate";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Hover Service", () => {
	let dragOffset: number;
	let cesiumTestComponent: CesiumTestComponent;
	let eventSimulator: EventSimulator;
	let geometryDragger: CesiumGeometryDragger;

	const waitRenderTime = async (fictiveCordinate: Coordinate) => {
		const fictivePoint = CesiumEntitiesCreator.createPointEntity(fictiveCordinate, {});
		cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(fictivePoint);
		await cesiumTestComponent.entityInCoordinateRendered(fictiveCordinate);
		cesiumTestComponent.mapComponent.nativeMapInstance.entities.remove(fictivePoint);
	};

	const expectMapNavigationToBeEnabled = (state: boolean) => {
		const cameraCtrl = cesiumTestComponent.mapComponent.nativeMapInstance.scene.screenSpaceCameraController;
		expect(cameraCtrl.enableInputs).toBe(state);
	};

	const expectDraggedCoordinateToBeCloseToSourceCoordinateWithDragOffset = (draggedCoordinate: Coordinate, sourceCoordinate: Coordinate, dragOffset: number) => {
		const actualScreenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(draggedCoordinate);
		const sourceScreenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(sourceCoordinate);
		const expectedScreenPosition = new Cesium.Cartesian2(sourceScreenPosition.x + dragOffset, sourceScreenPosition.y + dragOffset);
		expect(actualScreenPosition.x).toBeCloseTo(expectedScreenPosition.x, -1);
		expect(actualScreenPosition.y).toBeCloseTo(expectedScreenPosition.y, -1);
	};

	const prepareSimulateDrag = async (coordinateToStartDrag: Coordinate, dragOffset: number, waitForRenderFn: () => Promise<void>) => {
		const startDragScreenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(coordinateToStartDrag);
		const endDragScreenPosition = new Cesium.Cartesian2(startDragScreenPosition.x + dragOffset, startDragScreenPosition.y + dragOffset);
		await waitForRenderFn();
		return {startDragScreenPosition, endDragScreenPosition};
	};
	const simulateDrag = async (coordinateToStartDrag: Coordinate, dragOffset: number, waitForRenderFn: () => Promise<void>): Promise<Cesium.Cartesian2> => {
		const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(coordinateToStartDrag, dragOffset, waitForRenderFn);
		eventSimulator.simulateDrag(startDragScreenPosition.x, startDragScreenPosition.y, endDragScreenPosition.x, endDragScreenPosition.y);
		return endDragScreenPosition;
	};

	beforeEach(async () => {
		dragOffset = 50;
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();

		eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.canvas);
		geometryDragger = new CesiumGeometryDragger(cesiumTestComponent.mapComponent);
	});

	afterEach(() => {
		if (cesiumTestComponent.mapComponent && !cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			geometryDragger = null;
			eventSimulator = null;
		}
	});

	describe("- enableDragPolygon", () => {
		const polygonWithHolesCoordinates = [POLY_COORDINATES, [
			new Coordinate(32.25, 35.25, 0),
			new Coordinate(32.75, 35.25, 0),
			new Coordinate(32.75, 35.75, 0),
			new Coordinate(32.25, 35.75, 0)
		]];
		let polygon: Cesium.Entity;
		let pointInsidePolygon: Coordinate;
		let waitForRender: () => Promise<void>;

		const expectPolygonCoordinatesToBeInRightPlaceAfterDrag = (polygonEntity: Cesium.Entity, sourceCoordinate: Coordinate[][], dragOffset: number) => {
			const draggedCoordinates = CesiumEntitiesResolver.buildPolygonCoordinatesFromEntity(polygonEntity.polygon);
			draggedCoordinates.forEach((coordinates, i) => coordinates.forEach((coordinate, j) => {
				expectDraggedCoordinateToBeCloseToSourceCoordinateWithDragOffset(coordinate, sourceCoordinate[i][j], dragOffset);
			}));
		};
		beforeEach(() => {
			pointInsidePolygon = new Coordinate(32.1, 35.1);
			waitForRender = async () => {
				await cesiumTestComponent.entityInCoordinateRendered(pointInsidePolygon);
			};
		});

		it("- should drag simple polygon left and down", async () => {
			polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			geometryDragger.enableDragPolygon(polygon);
			await simulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], dragOffset);
		});
		it("- should drag polygon with holes left and down", async () => {
			polygon = CesiumEntitiesCreator.createPolygonEntity(polygonWithHolesCoordinates, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			geometryDragger.enableDragPolygon(polygon);
			await simulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, polygonWithHolesCoordinates, dragOffset);
		});
		it("- should not drag polygon when the polygon not added to map", async () => {
			polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			const waitForRender = async () => {
				// here, the polygon don't added to map, therefore we wait in the test for fictive point to render
				await waitRenderTime(pointInsidePolygon);
			};
			geometryDragger.enableDragPolygon(polygon);
			await simulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], 0);
		});
		it("- should not drag polygon with holes when start drag from hole", async () => {
			polygon = CesiumEntitiesCreator.createPolygonEntity(polygonWithHolesCoordinates, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			const pointInHoleToStartDrag = new Coordinate(32.5, 35.5);
			geometryDragger.enableDragPolygon(polygon);
			await simulateDrag(pointInHoleToStartDrag, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, polygonWithHolesCoordinates, 0);
		});
		it("- should not drag polygon when start drag from outside", async () => {
			polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			const pointOutsidePolygonToStartDrag = new Coordinate(31, 34);
			geometryDragger.enableDragPolygon(polygon);
			await simulateDrag(pointOutsidePolygonToStartDrag, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], 0);
		});
		it("- should drag polygon left and down and then right and up", async () => {
			polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			geometryDragger.enableDragPolygon(polygon);
			const endDragPoint = await simulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], dragOffset);
			pointInsidePolygon = cesiumTestComponent.mapComponent.utils.toCoordinateFromScreenPosition(endDragPoint);
			dragOffset = -dragOffset;
			await waitRenderTime(pointInsidePolygon);
			await simulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], 0);
		});
		it("- should disable mouse dragging for map while dragging geometry", async () => {
			const polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			geometryDragger.enableDragPolygon(polygon);

			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectMapNavigationToBeEnabled(true);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function before start dragging", async () => {
			const polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			const cancelDrag = geometryDragger.enableDragPolygon(polygon);
			cancelDrag();
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
			expect(polygon.polygon.hierarchy.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], 0);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function after mouse down before mouse move", async () => {
			const polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			const cancelDrag = geometryDragger.enableDragPolygon(polygon);
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			expect(polygon.polygon.hierarchy.isConstant).toBeFalsy();
			cancelDrag();
			expectMapNavigationToBeEnabled(true);
			expect(polygon.polygon.hierarchy.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], 0);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function after mouse move before end dragging", async () => {
			const polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			const cancelDrag = geometryDragger.enableDragPolygon(polygon);
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			expect(polygon.polygon.hierarchy.isConstant).toBeFalsy();
			cancelDrag();
			expectMapNavigationToBeEnabled(true);
			expect(polygon.polygon.hierarchy.isConstant).toBeTruthy();
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], dragOffset);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function after dragging once", async () => {
			const polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
			const cancelDrag = geometryDragger.enableDragPolygon(polygon);
			const endDragPoint = await simulateDrag(pointInsidePolygon, dragOffset, waitForRender);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], dragOffset);
			pointInsidePolygon = cesiumTestComponent.mapComponent.utils.toCoordinateFromScreenPosition(endDragPoint);
			const secondDragOffset = -dragOffset;

			cancelDrag();
			await waitRenderTime(pointInsidePolygon);
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolygon, secondDragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
			expect(polygon.polygon.hierarchy.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolygonCoordinatesToBeInRightPlaceAfterDrag(polygon, [POLY_COORDINATES], dragOffset);
			expectMapNavigationToBeEnabled(true);
		});
	});
	describe("- enableDragPolyline", () => {
		let polyline: Cesium.Entity;
		let pointInsidePolyline: Coordinate;
		let waitForRender: () => Promise<void>;

		const expectPolylineCoordinatesToBeInRightPlaceAfterDrag = (polylineEntity: Cesium.Entity, sourceCoordinate: Coordinate[], dragOffset: number) => {
			const draggedCoordinates = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(polylineEntity.polyline);
			draggedCoordinates.forEach((coordinate, i) => {
				expectDraggedCoordinateToBeCloseToSourceCoordinateWithDragOffset(coordinate, sourceCoordinate[i], dragOffset);
			});
		};

		beforeEach(() => {
			polyline = CesiumEntitiesCreator.createPolylineEntity(POLY_COORDINATES, {line: {width: 10}});
			pointInsidePolyline = POLY_COORDINATES[1];
			waitForRender = async () => {
				await cesiumTestComponent.entityInCoordinateRendered(pointInsidePolyline);
			};
		});
		it("- should drag polyline left and down", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			geometryDragger.enableDragPolyline(polyline);
			await simulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, dragOffset);
		});
		it("- should not drag polyline when the polyline not added to map", async () => {
			const waitForRender = async () => {
				// here, the polygon don't added to map, therefore we wait in the test for fictive point to render
				await waitRenderTime(pointInsidePolyline);
			};
			geometryDragger.enableDragPolyline(polyline);
			await simulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, 0);
		});
		it("- should not drag polyline when start drag from outside", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			const pointOutsidePolylineToStartDrag = new Coordinate(31, 34);

			geometryDragger.enableDragPolyline(polyline);
			await simulateDrag(pointOutsidePolylineToStartDrag, dragOffset, waitForRender);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, 0);
		});
		it("- should drag polyline left and down and then right and up", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			geometryDragger.enableDragPolyline(polyline);
			await simulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, dragOffset);
			const draggedCoordinates = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(polyline.polyline);
			pointInsidePolyline = draggedCoordinates[1];
			await waitRenderTime(pointInsidePolyline);
			dragOffset = -dragOffset;
			await simulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, 0);
		});
		it("- should disable mouse dragging for map while dragging geometry", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			geometryDragger.enableDragPolyline(polyline);

			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			expectMapNavigationToBeEnabled(true);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function before start dragging", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			const cancelDrag = geometryDragger.enableDragPolyline(polyline);
			cancelDrag();
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
			expect(polyline.polyline.positions.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, 0);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function after mouse down before mouse move", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			const cancelDrag = geometryDragger.enableDragPolyline(polyline);

			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			expect(polyline.polyline.positions.isConstant).toBeFalsy();
			cancelDrag();
			expectMapNavigationToBeEnabled(true);
			expect(polyline.polyline.positions.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, 0);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function after mouse move before end dragging", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			const cancelDrag = geometryDragger.enableDragPolyline(polyline);
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			expect(polyline.polyline.positions.isConstant).toBeFalsy();
			cancelDrag();
			expectMapNavigationToBeEnabled(true);
			expect(polyline.polyline.positions.isConstant).toBeTruthy();
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, dragOffset);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function after dragging once", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polyline);
			const cancelDrag = geometryDragger.enableDragPolyline(polyline);
			const endDragPoint = await simulateDrag(pointInsidePolyline, dragOffset, waitForRender);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, dragOffset);
			pointInsidePolyline = cesiumTestComponent.mapComponent.utils.toCoordinateFromScreenPosition(endDragPoint);
			const secondDragOffset = -dragOffset;

			cancelDrag();
			await waitRenderTime(pointInsidePolyline);
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointInsidePolyline, secondDragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
			expect(polyline.polyline.positions.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPolylineCoordinatesToBeInRightPlaceAfterDrag(polyline, POLY_COORDINATES, dragOffset);
			expectMapNavigationToBeEnabled(true);
		});
	});
	describe("- enableDragPoint", () => {
		let point: Cesium.Entity;
		let pointCoordinate: Coordinate;
		let waitForRender: () => Promise<void>;
		let lastCartesianMove: Cesium.Cartesian3;

		const dragCallbacks = {
			mouseDownCallback: () => {
			},
			mouseMoveCallback: (cartesian: Cesium.Cartesian3) => {
			},
			mouseUpCallback: () => {
			}
		};
		let mouseDownSpy: jasmine.Spy;
		let mouseMoveSpy: jasmine.Spy;
		let mouseUpSpy: jasmine.Spy;

		const initializeSpies = () => {
			mouseDownSpy = spyOn(dragCallbacks, "mouseDownCallback");
			mouseMoveSpy = spyOn(dragCallbacks, "mouseMoveCallback").and.callFake((cartesian: Cesium.Cartesian3) => {
				lastCartesianMove = cartesian;
			});
			mouseUpSpy = spyOn(dragCallbacks, "mouseUpCallback");
		};

		const expectPointCoordinatesToBeInRightPlaceAfterDrag = (pointEntity: Cesium.Entity, sourceCoordinate: Coordinate, dragOffset: number) => {
			const draggedCoordinate = CesiumEntitiesResolver.buildPointCoordinateFromEntity(pointEntity);
			expectDraggedCoordinateToBeCloseToSourceCoordinateWithDragOffset(draggedCoordinate, sourceCoordinate, dragOffset);
		};

		const expectCallbacksToHaveBeenCalled = (mouseEndPosition: Cesium.Cartesian2, times = 1) => {
			expect(mouseDownSpy).toHaveBeenCalledTimes(times);
			expectMouseMoveToHaveBeenCalled(mouseEndPosition, times);
			expect(mouseUpSpy).toHaveBeenCalledTimes(times);
		};
		const expectMouseMoveToHaveBeenCalled = (mouseEndPosition: Cesium.Cartesian2, times = 1) => {
			expect(mouseMoveSpy).toHaveBeenCalledTimes(times);
			const cartesian = cesiumTestComponent.mapComponent.utils.toCartesianFromMousePosition(mouseEndPosition);
			expect(lastCartesianMove).toEqual(cartesian);
		};
		const expectCallbacksToNotHaveBeenCalled = () => {
			expect(mouseDownSpy).not.toHaveBeenCalled();
			expect(mouseMoveSpy).not.toHaveBeenCalled();
			expect(mouseUpSpy).not.toHaveBeenCalled();
		};

		beforeEach(() => {
			pointCoordinate = POLY_COORDINATES[0];
			point = CesiumEntitiesCreator.createPointEntity(pointCoordinate, {});
			waitForRender = async () => {
				await cesiumTestComponent.entityInCoordinateRendered(pointCoordinate);
			};

			initializeSpies();
		});

		it("- should drag point left and down", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			const dragEnd = await simulateDrag(pointCoordinate, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, dragOffset);
			expectCallbacksToHaveBeenCalled(dragEnd);
		});
		it("- should drag point left and down without callbacks", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			geometryDragger.enableDragPoint(point);
			await simulateDrag(pointCoordinate, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, dragOffset);
			expectCallbacksToNotHaveBeenCalled();
		});
		it("- should not drag point when the point not added to map", async () => {
			waitForRender = async () => {
				// here, the polygon don't added to map, therefore we wait in the test for fictive point to render
				await waitRenderTime(pointCoordinate);
			};
			geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			await simulateDrag(pointCoordinate, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, 0);
			expectCallbacksToNotHaveBeenCalled();
		});
		it("- should not drag point when start drag from outside", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			const pointOutsidePointToStartDrag = new Coordinate(31, 34);
			geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			await simulateDrag(pointOutsidePointToStartDrag, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, 0);
			expectCallbacksToNotHaveBeenCalled();
		});
		it("- should drag point left and down and then right and up", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			let dragEnd = await simulateDrag(pointCoordinate, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, dragOffset);
			expectCallbacksToHaveBeenCalled(dragEnd);
			const draggedCoordinate = CesiumEntitiesResolver.buildPointCoordinateFromEntity(point);
			await waitRenderTime(pointCoordinate);
			dragOffset = -dragOffset;
			waitForRender = async () => {
				await cesiumTestComponent.entityInCoordinateRendered(draggedCoordinate);
			};
			dragEnd = await simulateDrag(draggedCoordinate, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, 0);
			expectCallbacksToHaveBeenCalled(dragEnd, 2);
		});
		it("- should disable mouse dragging for map while dragging geometry", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			geometryDragger.enableDragPoint(point);

			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointCoordinate, dragOffset, waitForRender);
			expectMapNavigationToBeEnabled(true);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
		});
		it("- should stop dragging mode when calling the finish function before start dragging", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			const cancelDrag = geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			cancelDrag();
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointCoordinate, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
			expect(point.position.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, 0);
			expectMapNavigationToBeEnabled(true);
			expectCallbacksToNotHaveBeenCalled();
		});
		it("- should stop dragging mode when calling the finish function after mouse down before mouse move", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			const cancelDrag = geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);

			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointCoordinate, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			expect(point.position.isConstant).toBeFalsy();
			cancelDrag();
			expectMapNavigationToBeEnabled(true);
			expect(point.position.isConstant).toBeTruthy();
			expect(mouseDownSpy).toHaveBeenCalledTimes(1);
			expect(mouseUpSpy).toHaveBeenCalled();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, 0);
			expectMapNavigationToBeEnabled(true);
			expect(mouseMoveSpy).not.toHaveBeenCalled();
			// check that it don't been called again
			expect(mouseUpSpy).toHaveBeenCalledTimes(1);

		});
		it("- should stop dragging mode when calling the finish function after mouse move before end dragging", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			const cancelDrag = geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(pointCoordinate, dragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			expectMapNavigationToBeEnabled(false);
			expect(point.position.isConstant).toBeFalsy();
			cancelDrag();
			expectMapNavigationToBeEnabled(true);
			expect(point.position.isConstant).toBeTruthy();
			expectCallbacksToHaveBeenCalled(endDragScreenPosition);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, dragOffset);
			expectMapNavigationToBeEnabled(true);
			// check that it don't been called again
			expect(mouseUpSpy).toHaveBeenCalledTimes(1);
		});
		it("- should stop dragging mode when calling the finish function after dragging once", async () => {
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(point);
			const cancelDrag = geometryDragger.enableDragPoint(point, dragCallbacks.mouseMoveCallback, dragCallbacks.mouseDownCallback, dragCallbacks.mouseUpCallback);
			const endDragPoint = await simulateDrag(pointCoordinate, dragOffset, waitForRender);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, dragOffset);
			cancelDrag();
			expectCallbacksToHaveBeenCalled(endDragPoint);
			const draggedPoint = cesiumTestComponent.mapComponent.utils.toCoordinateFromScreenPosition(endDragPoint);
			const secondDragOffset = -dragOffset;
			await waitRenderTime(draggedPoint);
			waitForRender = async () => {
				await cesiumTestComponent.entityInCoordinateRendered(draggedPoint);
			};
			const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(draggedPoint, secondDragOffset, waitForRender);
			eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
			expectMapNavigationToBeEnabled(true);
			expect(point.position.isConstant).toBeTruthy();
			eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
			eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
			expectPointCoordinatesToBeInRightPlaceAfterDrag(point, pointCoordinate, dragOffset);
			expectMapNavigationToBeEnabled(true);

			// checks that the callbacks hadn't been called again
			expect(mouseDownSpy).toHaveBeenCalledTimes(1);
			expect(mouseMoveSpy).toHaveBeenCalledTimes(1);
			expect(mouseUpSpy).toHaveBeenCalledTimes(1);
		});
	});
});