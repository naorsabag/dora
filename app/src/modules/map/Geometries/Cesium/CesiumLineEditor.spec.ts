import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { EventSimulator } from "../../../../test/EventSimulator";
import { CesiumLineEditor } from "./CesiumLineEditor";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { POLY_COORDINATES } from "../../../../test/TestConsts";
import { Coordinate } from "../Coordinate";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Line Editor Service", () => {

	let cesiumTestComponent: CesiumTestComponent;

	let cesiumLineEditor: CesiumLineEditor;
	let line: Cesium.Entity;

	const createAndAddOpenPolyline = () => {
		createAndAddLine(POLY_COORDINATES);
	};
	const createAndAddClosedPolyline = () => {
		const coordinates = [...POLY_COORDINATES, POLY_COORDINATES[0]];
		createAndAddLine(coordinates);
	};
	const createAndAddLine = (coordinates: Coordinate[]) => {
		line = CesiumEntitiesCreator.createPolylineEntity(coordinates, {});
		cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(line);
	};

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();


		cesiumLineEditor = new CesiumLineEditor(cesiumTestComponent.mapComponent);
	});

	afterEach(() => {
		if (cesiumTestComponent.mapComponent && !cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			cesiumLineEditor = null;
			line = null;
		}
	});

	describe("- enable edit polyline", () => {
		const expectPointToBeInMiddleOfTwoPoints = (middlePoint: Cesium.Entity, coordinateBefore: Coordinate, coordinateAfter: Coordinate) => {
			const actualCoordinate = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
			const expectedCoordinate = new Coordinate((coordinateBefore.latitude + coordinateAfter.latitude) / 2, (coordinateBefore.longitude + coordinateAfter.longitude) / 2);
			cesiumTestComponent.expectCoordinateToBeCloseToCoordinate(actualCoordinate, expectedCoordinate, 2);
		};
		describe("- edit points appearance", () => {
			const expectEditPointsToBe = (entities: Cesium.EntityCollection,
				lineCoordinates: Coordinate[],
				amountOfEntitiesBeforeEdit: number,
				vertexPointsAmount: number,
				middlePointsAmount: number) => {

				expect(entities.values.length).toBe(amountOfEntitiesBeforeEdit + vertexPointsAmount + middlePointsAmount);
				entities.values.slice(amountOfEntitiesBeforeEdit, amountOfEntitiesBeforeEdit + vertexPointsAmount).forEach((entity, index) => {
					expect(entity.billboard).toBeDefined();
					expect(entity.position).toBeDefined();
					const coordinate = CesiumEntitiesResolver.buildPointCoordinateFromEntity(entity);
					cesiumTestComponent.expectCoordinateToBeCloseToCoordinate(coordinate, lineCoordinates[index]);
				});

				entities.values.slice(amountOfEntitiesBeforeEdit + vertexPointsAmount).forEach((entity, index) => {
					expect(entity.billboard).toBeDefined();
					expect(entity.position).toBeDefined();
					const vertexBefore = lineCoordinates[index];
					const vertexAfter = lineCoordinates[index + 1];
					expectPointToBeInMiddleOfTwoPoints(entity, vertexBefore, vertexAfter);
				});
			};

			it("- should add points on line vertices and in the middle between them (open line)", () => {
				createAndAddOpenPolyline();
				const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
				const amountOfEntitiesBeforeEdit = entities.values.length;
				cesiumLineEditor.enableEditPolyline(line);
				const linePositions = line.polyline.positions.getValue(Cesium.JulianDate.now());
				const expectedVertexPointsAmount = linePositions.length;
				const expectedMiddlePointsAmount = linePositions.length - 1;

				expectEditPointsToBe(entities, POLY_COORDINATES, amountOfEntitiesBeforeEdit, expectedVertexPointsAmount, expectedMiddlePointsAmount);
			});
			it("- should add points on line vertices and in the middle between them (closed line)", () => {
				createAndAddClosedPolyline();
				const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
				const amountOfEntitiesBeforeEdit = entities.values.length;
				cesiumLineEditor.enableEditPolyline(line);
				const linePositions = line.polyline.positions.getValue(Cesium.JulianDate.now());
				const expectedVertexPointsAmount = linePositions.length - 1;
				const expectedMiddlePointsAmount = linePositions.length - 1;

				expectEditPointsToBe(entities, [...POLY_COORDINATES, POLY_COORDINATES[0]], amountOfEntitiesBeforeEdit, expectedVertexPointsAmount, expectedMiddlePointsAmount);
			});

			it("- should remove edit points after finish", () => {
				createAndAddOpenPolyline();
				const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
				const amountOfEntitiesBeforeEdit = entities.values.length;
				const finishFn = cesiumLineEditor.enableEditPolyline(line);
				finishFn();

				expect(entities.values.length).toBe(amountOfEntitiesBeforeEdit);
			});
		});

		describe("- drag", () => {
			const dragOffset: number = 50;
			let eventSimulator: EventSimulator;
			const prepareSimulateDrag = async (coordinateToStartDrag: Coordinate) => {
				const startDragScreenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(coordinateToStartDrag);
				const endDragScreenPosition = new Cesium.Cartesian2(startDragScreenPosition.x + dragOffset, startDragScreenPosition.y + dragOffset);
				await cesiumTestComponent.entityInCoordinateRendered(coordinateToStartDrag);
				return {startDragScreenPosition, endDragScreenPosition};
			};
			const simulateDrag = async (coordinateToStartDrag: Coordinate): Promise<Cesium.Cartesian3> => {
				const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(coordinateToStartDrag);
				eventSimulator.simulateDrag(startDragScreenPosition.x, startDragScreenPosition.y, endDragScreenPosition.x, endDragScreenPosition.y);
				return cesiumTestComponent.mapComponent.utils.toCartesianFromMousePosition(endDragScreenPosition);
			};

			beforeEach(() => {
				eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.canvas);
			});

			describe("- vertex point", () => {
				let endDragPosition: Cesium.Cartesian3;
				beforeEach(() => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
				});

				it("- should update line's vertex position", async () => {
					endDragPosition = await simulateDrag(POLY_COORDINATES[1]);

					const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now());
					const actualDragedPointPosition = linePositions[1];
					expect(actualDragedPointPosition).toEqual(endDragPosition);
				});
				it("- should make line positions changeable while draging", async () => {
					const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(POLY_COORDINATES[1]);
					expect(line.polyline.positions.isConstant).toBeTruthy();
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
					expect(line.polyline.positions.isConstant).toBeFalsy();
					eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(line.polyline.positions.isConstant).toBeFalsy();
					eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(line.polyline.positions.isConstant).toBeTruthy();
				});
				it("- should update vertex point's position", async () => {
					endDragPosition = await simulateDrag(POLY_COORDINATES[1]);

					const draggedVertexPoint = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[2];
					const actualVertexPointPosition: Cesium.Cartesian3 = draggedVertexPoint.position.getValue(Cesium.JulianDate.now());
					expect(actualVertexPointPosition).toEqual(endDragPosition);

				});
				it("- should update 2 neighbour middle points' positions", async () => {
					await simulateDrag(POLY_COORDINATES[1]);

					const lineCoordinates: Coordinate[] = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(line.polyline);
					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[6];
					expectPointToBeInMiddleOfTwoPoints(middlePointBefore, lineCoordinates[0], lineCoordinates[1]);
					expectPointToBeInMiddleOfTwoPoints(middlePointAfter, lineCoordinates[1], lineCoordinates[2]);
				});
				it("- should make neighbour middle points' positions changeable while dragging", async () => {
					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[6];

					const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(POLY_COORDINATES[1]);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					expect(middlePointAfter.position.isConstant).toBeTruthy();
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					expect(middlePointAfter.position.isConstant).toBeTruthy();
				});
			});

			describe("- vertex point invoke callbacks", () => {
				beforeEach(() => {
					createAndAddOpenPolyline();
				});
				it("- should invoke mouse down callback when start drag", async () => {
					const leftDownCallback = () => {
					};
					const leftDownCallbackObject = {leftDownCallback};
					const leftDownSpy = spyOn(leftDownCallbackObject, "leftDownCallback");
					cesiumLineEditor.enableEditPolyline(line, undefined, leftDownCallbackObject.leftDownCallback);

					const {startDragScreenPosition} = await prepareSimulateDrag(POLY_COORDINATES[1]);
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);

					expect(leftDownSpy).toHaveBeenCalledTimes(1);
				});
				it("- should invoke mouse move callback when mouse move", async () => {
					const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now()).slice(0);
					let screenPositionsOfDrag;
					const dragCallback = (newPositions: Cesium.Cartesian3[]) => {
						const newPosition = cesiumTestComponent.mapComponent.utils.toCartesianFromMousePosition(screenPositionsOfDrag.endDragScreenPosition);
						linePositions[1] = newPosition;

						newPositions.forEach((position, index) => {
							expect(position).toEqual(linePositions[index]);
						});
					};

					const dragCallbackObject = {dragCallback};
					const dragSpy = spyOn(dragCallbackObject, "dragCallback").and.callThrough();
					cesiumLineEditor.enableEditPolyline(line, dragCallbackObject.dragCallback);

					screenPositionsOfDrag = await prepareSimulateDrag(POLY_COORDINATES[1]);
					eventSimulator.simulate("down", screenPositionsOfDrag.startDragScreenPosition.x, screenPositionsOfDrag.startDragScreenPosition.y);
					eventSimulator.simulate("move", screenPositionsOfDrag.endDragScreenPosition.x, screenPositionsOfDrag.endDragScreenPosition.y);
					expect(dragSpy).toHaveBeenCalledTimes(1);
				});
				it("- should invoke mouse up callback when drag is finished", async () => {
					const leftUpCallback = () => {
					};
					const leftUpCallbackObject = {leftUpCallback};
					const leftUpSpy = spyOn(leftUpCallbackObject, "leftUpCallback");
					cesiumLineEditor.enableEditPolyline(line, undefined, undefined, leftUpCallbackObject.leftUpCallback);

					await simulateDrag(POLY_COORDINATES[1]);

					expect(leftUpSpy).toHaveBeenCalledTimes(1);
				});
			});

			describe("- start edge vertex point", () => {
				const draggedCoordinate = POLY_COORDINATES[0];
				it("- should update next neighbour middle point's position", async () => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					await simulateDrag(draggedCoordinate);

					const lineCoordinates: Coordinate[] = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(line.polyline);
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
					expectPointToBeInMiddleOfTwoPoints(middlePointAfter, lineCoordinates[0], lineCoordinates[1]);
				});
				it("- should make next neighbour middle points' position changeable while dragging", async () => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
					const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(draggedCoordinate);
					expect(middlePointAfter.position.isConstant).toBeTruthy();
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointAfter.position.isConstant).toBeTruthy();
				});
				it("- should update next neighbour middle point's position and last middle point in closed polyline", async () => {
					createAndAddClosedPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					await simulateDrag(draggedCoordinate);

					const lineCoordinates: Coordinate[] = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(line.polyline);
					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[8];
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
					expectPointToBeInMiddleOfTwoPoints(middlePointBefore, lineCoordinates[3], lineCoordinates[0]);
					expectPointToBeInMiddleOfTwoPoints(middlePointAfter, lineCoordinates[0], lineCoordinates[1]);
				});
				it("- should make next neighbour middle point and last middle point positions changeable while dragging in closed polyline", async () => {
					createAndAddClosedPolyline();
					cesiumLineEditor.enableEditPolyline(line);

					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[8];
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];

					const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(draggedCoordinate);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					expect(middlePointAfter.position.isConstant).toBeTruthy();
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					expect(middlePointAfter.position.isConstant).toBeTruthy();
				});
				it("- should update line's vertex positions", async () => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					const endDragPosition = await simulateDrag(draggedCoordinate);

					const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now());
					const actualDragedPointPosition = linePositions[0];
					expect(actualDragedPointPosition).toEqual(endDragPosition);
				});
				it("- should update line's vertex positions in closed polyline", async () => {
					createAndAddClosedPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					const endDragPosition = await simulateDrag(draggedCoordinate);

					const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now());
					const actualDragedPointPosition = linePositions[0];
					const actualLastPointPosition = linePositions[4];
					expect(actualDragedPointPosition).toEqual(endDragPosition);
					expect(actualLastPointPosition).toEqual(endDragPosition);
				});
			});

			describe("- last edge vertex point previous", () => {
				const draggedCoordinate = POLY_COORDINATES[3];
				it("- should update previous neighbour middle point's position", async () => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					await simulateDrag(draggedCoordinate);

					const lineCoordinates: Coordinate[] = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(line.polyline);
					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[7];
					expectPointToBeInMiddleOfTwoPoints(middlePointBefore, lineCoordinates[2], lineCoordinates[3]);
				});
				it("- should make previous neighbour middle points' position changeable while dragging", async () => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[7];
					const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(draggedCoordinate);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
				});
				it("- should update neighbours middle point positions in closed polyline", async () => {
					createAndAddClosedPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					await simulateDrag(draggedCoordinate);

					const lineCoordinates: Coordinate[] = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(line.polyline);
					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[7];
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[8];
					expectPointToBeInMiddleOfTwoPoints(middlePointBefore, lineCoordinates[2], lineCoordinates[3]);
					expectPointToBeInMiddleOfTwoPoints(middlePointAfter, lineCoordinates[3], lineCoordinates[4]);
				});
				it("- should make neighbours middle point positions changeable while dragging in closed polyline", async () => {
					createAndAddClosedPolyline();
					cesiumLineEditor.enableEditPolyline(line);

					const middlePointBefore = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[7];
					const middlePointAfter = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[8];

					const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(draggedCoordinate);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					expect(middlePointAfter.position.isConstant).toBeTruthy();
					eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeFalsy();
					expect(middlePointAfter.position.isConstant).toBeFalsy();
					eventSimulator.simulate("up", endDragScreenPosition.x, endDragScreenPosition.y);
					expect(middlePointBefore.position.isConstant).toBeTruthy();
					expect(middlePointAfter.position.isConstant).toBeTruthy();
				});
				it("- should update line's vertex positions", async () => {
					createAndAddOpenPolyline();
					cesiumLineEditor.enableEditPolyline(line);
					const endDragPosition = await simulateDrag(draggedCoordinate);

					const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now());
					const actualDragedPointPosition = linePositions[3];
					expect(actualDragedPointPosition).toEqual(endDragPosition);
				});
			});

			describe("- middle point", () => {
				describe("- at the start of drag (mouse left down)", () => {
					it("- should add a position to the line in the place of the middle point", async () => {
						createAndAddOpenPolyline();
						cesiumLineEditor.enableEditPolyline(line);
						const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now());
						const linePositionsAmount = linePositions.length;

						const middlePoint = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						const {startDragScreenPosition} = await prepareSimulateDrag(coordinateOfMiddlePoint);
						eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
						expect(linePositions.length).toEqual(linePositionsAmount + 1);
						expect(linePositions[1]).toEqual(middlePoint.position.getValue(Cesium.JulianDate.now()));
					});
					it("- should invoke mouse down callback when start drag", async () => {
						createAndAddOpenPolyline();
						const leftDownCallback = () => {
						};
						const leftDownCallbackObject = {leftDownCallback};
						const leftDownSpy = spyOn(leftDownCallbackObject, "leftDownCallback");
						cesiumLineEditor.enableEditPolyline(line, undefined, leftDownCallbackObject.leftDownCallback);

						const middlePoint = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						const {startDragScreenPosition} = await prepareSimulateDrag(coordinateOfMiddlePoint);
						eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);

						expect(leftDownSpy).toHaveBeenCalledTimes(1);
					});
				});

				describe("- while dragging (mouse move)", () => {
					it("- should update the newly added vertex point position", async () => {
						createAndAddOpenPolyline();
						cesiumLineEditor.enableEditPolyline(line);
						const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now());

						const middlePoint = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						const {startDragScreenPosition, endDragScreenPosition} = await prepareSimulateDrag(coordinateOfMiddlePoint);
						eventSimulator.simulate("down", startDragScreenPosition.x, startDragScreenPosition.y);
						eventSimulator.simulate("move", endDragScreenPosition.x, endDragScreenPosition.y);
						const endDragPosition = cesiumTestComponent.mapComponent.utils.toCartesianFromMousePosition(endDragScreenPosition);
						const middlePointPosition = middlePoint.position.getValue(Cesium.JulianDate.now());
						expect(middlePointPosition).toEqual(endDragPosition);
						expect(linePositions[1]).toEqual(middlePointPosition);
					});
					it("- should invoke mouse move callback when mouse move", async () => {
						createAndAddOpenPolyline();
						const linePositions: Cesium.Cartesian3[] = line.polyline.positions.getValue(Cesium.JulianDate.now()).slice(0);
						let screenPositionsOfDrag;
						const dragCallback = (newPositions: Cesium.Cartesian3[]) => {
							const newPosition = cesiumTestComponent.mapComponent.utils.toCartesianFromMousePosition(screenPositionsOfDrag.endDragScreenPosition);
							linePositions.splice(1, 0, newPosition);

							newPositions.forEach((position, index) => {
								expect(position).toEqual(linePositions[index]);
							});
						};
						const dragCallbackObject = {dragCallback};
						const dragSpy = spyOn(dragCallbackObject, "dragCallback").and.callThrough();
						cesiumLineEditor.enableEditPolyline(line, dragCallbackObject.dragCallback);

						const middlePoint = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						screenPositionsOfDrag = await prepareSimulateDrag(coordinateOfMiddlePoint);
						eventSimulator.simulate("down", screenPositionsOfDrag.startDragScreenPosition.x, screenPositionsOfDrag.startDragScreenPosition.y);
						eventSimulator.simulate("move", screenPositionsOfDrag.endDragScreenPosition.x, screenPositionsOfDrag.endDragScreenPosition.y);
						expect(dragSpy).toHaveBeenCalledTimes(1);
					});
				});

				describe("- at the end of drag (mouse left up)", () => {
					it("- should add a vertex point instead of the middle point", async () => {
						createAndAddOpenPolyline();
						cesiumLineEditor.enableEditPolyline(line);
						const mapEntities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
						const middlePoint = mapEntities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						const endDragPosition = await simulateDrag(coordinateOfMiddlePoint);
						const newVertexPoint = mapEntities.values[9];
						expect(mapEntities.values).not.toContain(middlePoint);
						expect(Cesium.Cartesian3.equalsEpsilon(newVertexPoint.position.getValue(Cesium.JulianDate.now()), endDragPosition, 5)).toBeTruthy();
						expect(newVertexPoint.billboard.image.getValue(Cesium.JulianDate.now())).not.toEqual(middlePoint.billboard.image.getValue(Cesium.JulianDate.now()));
					});
					it("- should add 2 new neighbour middle points to the new vertex", async () => {
						createAndAddOpenPolyline();
						cesiumLineEditor.enableEditPolyline(line);
						const mapEntities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
						const entitiesCountBeforeDrag = mapEntities.values.length;
						const middlePoint = mapEntities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						const endDragPosition = await simulateDrag(coordinateOfMiddlePoint);
						const coordinateOfNewVertex = CesiumUtilities.toCoordinateFromCartesian(endDragPosition);
						const newPriviousMiddlePoint = mapEntities.values[7];
						const newNextMiddlePoint = mapEntities.values[8];
						expect(mapEntities.values.length).toEqual(entitiesCountBeforeDrag + 2);
						expectPointToBeInMiddleOfTwoPoints(newPriviousMiddlePoint, POLY_COORDINATES[0], coordinateOfNewVertex);
						expectPointToBeInMiddleOfTwoPoints(newNextMiddlePoint, coordinateOfNewVertex, POLY_COORDINATES[1]);
						expect(newPriviousMiddlePoint.billboard.image.getValue(Cesium.JulianDate.now())).toEqual(middlePoint.billboard.image.getValue(Cesium.JulianDate.now()));
						expect(newNextMiddlePoint.billboard.image.getValue(Cesium.JulianDate.now())).toEqual(middlePoint.billboard.image.getValue(Cesium.JulianDate.now()));
					});
					it("- should invoke mouse up callback when drag is finished", async () => {
						createAndAddOpenPolyline();
						const leftUpCallback = () => {
						};
						const leftUpCallbackObject = {leftUpCallback};
						const leftUpSpy = spyOn(leftUpCallbackObject, "leftUpCallback");
						cesiumLineEditor.enableEditPolyline(line, undefined, undefined, leftUpCallbackObject.leftUpCallback);
						const mapEntities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
						const middlePoint = mapEntities.values[5];
						const coordinateOfMiddlePoint = CesiumEntitiesResolver.buildPointCoordinateFromEntity(middlePoint);
						await simulateDrag(coordinateOfMiddlePoint);

						expect(leftUpSpy).toHaveBeenCalledTimes(1);
					});
				});
			});

			describe("- multiple dragging", () => {
				it("- should drag vertex point after dragging vertex point", () => {
				});
				it("- should drag vertex point after dragging this point before as middle point", () => {
				});
				it("- should drag middle point that created after dragging middle point ", () => {
				});
				it("- should drag middle point after dragging vertex point", () => {
				});
			});
			describe("- finish editing mode", () => {
				it("- should cancel edit points drag events after finishing edit mode", () => {
					createAndAddOpenPolyline();
					const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
					const amountOfEntitiesBeforeEdit = entities.values.length;
					const finishFn = cesiumLineEditor.enableEditPolyline(line);
					const amountOfEntitiesAfterEdit = entities.values.length;
					const amountOfEditPoints = amountOfEntitiesAfterEdit - amountOfEntitiesBeforeEdit;

					const removeEventSpy = spyOn(Cesium.ScreenSpaceEventHandler.prototype, "destroy");
					finishFn();
					expect(removeEventSpy).toHaveBeenCalledTimes(amountOfEditPoints);
				});
				it("- should cancel edit points drag events after finishing edit mode and first edit", async () => {
					createAndAddOpenPolyline();
					const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities;
					const amountOfEntitiesBeforeEdit = entities.values.length;
					const finishFn = cesiumLineEditor.enableEditPolyline(line);
					const amountOfEntitiesAfterEdit = entities.values.length;
					const amountOfEditPoints = amountOfEntitiesAfterEdit - amountOfEntitiesBeforeEdit;
					await simulateDrag(POLY_COORDINATES[1]);
					const removeEventSpy = spyOn(Cesium.ScreenSpaceEventHandler.prototype, "destroy");
					finishFn();
					expect(removeEventSpy).toHaveBeenCalledTimes(amountOfEditPoints);
				});
			});
		});
	});
});