import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { CesiumHoverService } from "./CesiumHoverService";
import {
	HOVER_COLOR_RGBA,
	KML_HOVER_STR,
	KML_HOVER_STR_2,
	KML_POINT_COORDINATE, ORIGINAL_COLOR_HEX,
	POLY_COORDINATES,
} from "../../../../test/TestConsts";
import { ScreenCoordinate } from "../../GraphicsUtils/ScreenCoordinate";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { Coordinate } from "../Coordinate";
import { EventSimulator } from "../../../../test/EventSimulator";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Hover Service", () => {

	let cesiumTestComponent: CesiumTestComponent;
	let hoverService_1: CesiumHoverService;
	let dataSource_1;
	let eventSimulator: EventSimulator;

	const ORIGINAL_SIZE: number = 32;
	let NOT_ON_ENTITY_COORDINATE = new Coordinate(KML_POINT_COORDINATE.latitude + 10,
		KML_POINT_COORDINATE.longitude + 10);

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();

		eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
		hoverService_1 = new CesiumHoverService(cesiumTestComponent.mapComponent);

		let kmlDoc = $.parseXML(KML_HOVER_STR);
		const KmlDataSource = new Cesium.KmlDataSource({
			camera: cesiumTestComponent.mapComponent.nativeMapInstance.camera,
			canvas: cesiumTestComponent.mapComponent.nativeMapInstance.canvas
		});
		dataSource_1 = await KmlDataSource.load(kmlDoc, {clampToGround: !cesiumTestComponent.mapComponent.getIs2D()});
	});

	afterEach(() => {
		do {
			hoverService_1.toggleHover(false, dataSource_1);
		} while (CesiumHoverService.isHoverOn());

		hoverService_1 = null;

		dataSource_1 = null;

		if (cesiumTestComponent.mapComponent && !cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
		}
	});

	describe("when toggle on", () => {

		describe("single datasource", () => {
			it("should'nt change design when mouse is'nt on any entity", () => {
				let eventArgs = getEventArgs(NOT_ON_ENTITY_COORDINATE);

				arrangeTestMoveToEntity(eventArgs);

				actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

				assert(dataSource_1, null);
			});

			it("should change design when mouse on line entity", () => {
				let lineEntity = dataSource_1.entities.values[0];
				let eventArgs: MapEventArgs = getEventArgs(POLY_COORDINATES[0]);

				arrangeTestMoveToEntity(eventArgs, lineEntity);

				actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

				assert(dataSource_1, [lineEntity]);
			});

			it("should change design when mouse on point entity", () => {
				let pointEntity = dataSource_1.entities.values[1];
				let eventArgs: MapEventArgs = getEventArgs(KML_POINT_COORDINATE);

				arrangeTestMoveToEntity(eventArgs, pointEntity);

				actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

				assert(dataSource_1, [pointEntity]);
			});

			it("should change both entities design when mouse on multigeometry", () => {
				let lineEntity = dataSource_1.entities.values[4];
				let pointEntity = dataSource_1.entities.values[3];
				let eventArgs: MapEventArgs = getEventArgs(KML_POINT_COORDINATE);

				arrangeTestMoveToEntity(eventArgs, pointEntity);

				actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

				assert(dataSource_1, [pointEntity, lineEntity]);
			});

			it("should change design back when mouse out of line entity", () => {
				let lineEntity = dataSource_1.entities.values[0];
				let eventArgsIn: MapEventArgs = getEventArgs(POLY_COORDINATES[0]);
				let eventArgsOut: MapEventArgs = getEventArgs(NOT_ON_ENTITY_COORDINATE);

				arrangeTestMoveOutFromEntity(eventArgsIn, eventArgsOut, lineEntity);

				actMoveInAndOutSimulation(hoverService_1, dataSource_1, eventArgsIn, eventArgsOut);

				assert(dataSource_1, null);
			});

			it("should change design back when mouse out of point entity", () => {
				let pointEntity = dataSource_1.entities.values[1];
				let eventArgsIn: MapEventArgs = getEventArgs(POLY_COORDINATES[0]);
				let eventArgsOut: MapEventArgs = getEventArgs(NOT_ON_ENTITY_COORDINATE);

				arrangeTestMoveOutFromEntity(eventArgsIn, eventArgsOut, pointEntity);

				actMoveInAndOutSimulation(hoverService_1, dataSource_1, eventArgsIn, eventArgsOut);

				assert(dataSource_1, null);
			});

			it("should change design back when mouse out of multigeometry entity", () => {
				let lineEntity = dataSource_1.entities.values[4];
				let eventArgsIn: MapEventArgs = getEventArgs(POLY_COORDINATES[0]);
				let eventArgsOut: MapEventArgs = getEventArgs(NOT_ON_ENTITY_COORDINATE);

				arrangeTestMoveOutFromEntity(eventArgsIn, eventArgsOut, lineEntity);

				actMoveInAndOutSimulation(hoverService_1, dataSource_1, eventArgsIn, eventArgsOut);

				assert(dataSource_1, null);
			});
		});

		describe("multiple datasources", () => {

			let hoverService_2: CesiumHoverService;
			let dataSource_2;

			beforeEach(async () => {

				hoverService_2 = new CesiumHoverService(cesiumTestComponent.mapComponent);

				hoverService_1.toggleHover(true, dataSource_1);

				let kmlDoc = $.parseXML(KML_HOVER_STR_2);
				const KmlDataSource = new Cesium.KmlDataSource({
					camera: cesiumTestComponent.mapComponent.nativeMapInstance.camera,
					canvas: cesiumTestComponent.mapComponent.nativeMapInstance.canvas
				});
				dataSource_2 = await KmlDataSource.load(kmlDoc, {clampToGround: !cesiumTestComponent.mapComponent.getIs2D()});
			});

			afterEach(() => {
				do {
					hoverService_2.toggleHover(false, dataSource_2);
				} while (CesiumHoverService.isHoverOn());

				hoverService_2 = null;

				dataSource_2 = null;
			});

			it("should change design of entity from first datasource when mouse on it", () => {
				let pointEntity = dataSource_1.entities.values[1];
				let eventArgs: MapEventArgs = getEventArgs(KML_POINT_COORDINATE);

				arrangeTestMoveToEntity(eventArgs, pointEntity);

				hoverService_2.toggleHover(true, dataSource_2);
				actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

				assert(dataSource_1, [pointEntity]);
			});

			it("should change design of entity from second datasource when mouse on it", () => {
				let pointEntity = dataSource_2.entities.values[1];
				let eventArgs: MapEventArgs = getEventArgs(new Coordinate(KML_POINT_COORDINATE.latitude,
					KML_POINT_COORDINATE.longitude + 1));

				arrangeTestMoveToEntity(eventArgs, pointEntity);

				actMoveInSimulation(hoverService_2, dataSource_2, eventArgs);

				assert(dataSource_2, [pointEntity]);
			});

			it("should'nt change design of entity from other datasources when mouse on it", () => {
				let pointEntity = dataSource_1.entities.values[1];
				let eventArgs: MapEventArgs = getEventArgs(new Coordinate(KML_POINT_COORDINATE.latitude,
					KML_POINT_COORDINATE.longitude));

				arrangeTestMoveToEntity(eventArgs, pointEntity);

				actMoveInSimulation(hoverService_2, dataSource_2, eventArgs);

				assert(dataSource_2, null);
			});

			it("should change design of entity from first datasource even if second datasource toggle off", async () => {
				let pointEntity = dataSource_1.entities.values[1];
				let eventArgs: MapEventArgs = getEventArgs(KML_POINT_COORDINATE);

				arrangeTestMoveToEntity(eventArgs, pointEntity);

				hoverService_2.toggleHover(true, dataSource_2);
				hoverService_2.toggleHover(false, dataSource_2);

				simulateHover(eventArgs);

				assert(dataSource_1, [pointEntity]);
			});
		});
	});

	describe("when toggle off", () => {
		it("should revert changes on all entities", () => {
			let pointEntity = dataSource_1.entities.values[1];
			let eventArgs: MapEventArgs = getEventArgs(KML_POINT_COORDINATE);

			arrangeTestMoveToEntity(eventArgs, pointEntity);

			actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

			assert(dataSource_1, [pointEntity]);

			hoverService_1.toggleHover(false, dataSource_1);

			assert(dataSource_1, null);
		});

		it("should'nt change design when mouse is on entity", () => {
			let pointEntity = dataSource_1.entities.values[1];
			let eventArgs: MapEventArgs = getEventArgs(KML_POINT_COORDINATE);

			arrangeTestMoveToEntity(eventArgs, pointEntity);

			actMoveInSimulation(hoverService_1, dataSource_1, eventArgs);

			assert(dataSource_1, [pointEntity]);

			hoverService_1.toggleHover(false, dataSource_1);

			simulateHover(eventArgs);

			assert(dataSource_1, null);
		});
	});

	function getEventArgs(coordinate: Coordinate): MapEventArgs {
		let pos: ScreenCoordinate =
			cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(coordinate);
		return new MapEventArgs(coordinate.longitude,
			coordinate.latitude, null, null, null, null,
			null, pos.x, pos.y);
	}

	function getPickSpyCallbackForMoveInAndOut(eventArgsIn: MapEventArgs, eventArgsOut: MapEventArgs, retVal?: any)
		: (args: { x: number, y: number }) => any {
		return getPickCallback(null, (args: { x: number, y: number }) => {
			if (args.x === eventArgsIn.clientX && args.y === eventArgsIn.clientY) {
				return getPickCallback(retVal, (args: { x: number, y: number }) => {
					assertPickPosition(args, eventArgsIn);
				});
			}
			assertPickPosition(args, eventArgsOut);
		});
	}

	function getPickSpyCallbackForMoveIn(eventArgs: MapEventArgs, retVal?: any): (args: { x: number, y: number }) => any {
		return getPickCallback(retVal, (args: { x: number, y: number }) => {
			assertPickPosition(args, eventArgs);
		});
	}

	function getPickCallback(retVal: any, body: (args: { x: number, y: number }) => any): (args: { x: number, y: number }) => any {
		return (args: { x: number, y: number }) => {
			let val: any = body(args);
			if (val) {
				return val;
			}

			if (!retVal) {
				return;
			}
			return {id: retVal};
		};
	}

	function addPickSpy(onPick: (args: { x: number, y: number }) => any): void {
		spyOn(cesiumTestComponent.mapComponent.nativeMapInstance.scene, "pick")
			.and.callFake((args: { x: number, y: number }) => {
			return onPick(args);
		});
	}

	function arrangeTestMoveToEntity(eventArgs: MapEventArgs, entity?: any): void {
		let spyCallback: (args: { x: number, y: number }) => any = getPickSpyCallbackForMoveIn(eventArgs, entity);
		addPickSpy(spyCallback);
	}

	function arrangeTestMoveOutFromEntity(eventArgsIn: MapEventArgs, eventArgsOut: MapEventArgs, entity?: any): void {
		let spyCallback: (args: { x: number, y: number }) => any =
			getPickSpyCallbackForMoveInAndOut(eventArgsIn, eventArgsOut, entity);
		addPickSpy(spyCallback);
	}

	function simulateHover(eventArgs: MapEventArgs) {
		cesiumTestComponent.mapComponent
			.flyTo(new Coordinate(eventArgs.latitude, eventArgs.longitude), 0);
		eventSimulator.simulate("move", eventArgs.clientX, eventArgs.clientY);
	}

	function actMoveInSimulation(hoverService: CesiumHoverService, dataSource, eventArgs: MapEventArgs): void {
		hoverService.toggleHover(true, dataSource);

		simulateHover(eventArgs);
	}

	function actMoveInAndOutSimulation(hoverService: CesiumHoverService, dataSource: any
		, eventArgsIn: any, eventArgsOut: any): void {
		hoverService.toggleHover(true, dataSource);

		simulateHover(eventArgsIn);
		simulateHover(eventArgsOut);
	}

	function assertPickPosition(expectedArgs: { x: number, y: number }, assertEventArgs: MapEventArgs) {
		expect(expectedArgs.x).toEqual(assertEventArgs.clientX);
		expect(expectedArgs.y).toEqual(assertEventArgs.clientY);
	}

	function assertHoverOnEntities(entities: any[]): void {
		if (!entities) {
			return;
		}

		for (let entity of entities) {
			entity.billboard ? cesiumTestComponent.assertHoverPoint(entity) : cesiumTestComponent.assertHoverLine(entity);
		}
	}

	function isEntityInArray(entity: any): (e: any) => boolean {
		return (function (e) {
			return e.id === entity.id;
		});
	}

	function assertNoChangeOnOtherEntities(dataSource, changedEntity: any[]) {
		for (let entity of dataSource.entities.values) {
			if ((!entity.billboard && !entity.polyline) ||
				(changedEntity && changedEntity.some(isEntityInArray(entity)))) {
				return;
			}

			let expectedColor;
			if (entity.billboard) {
				expectedColor = entity.billboard.color.getValue();
			}
			if (entity.polyline) {
				expectedColor = entity.polyline.material.color.getValue();
			}

			let assertColor = Cesium.Color.fromCssColorString(ORIGINAL_COLOR_HEX);
			expect(expectedColor.alpha).toBeCloseTo(assertColor.alpha, 8);
			expect(expectedColor.red).toBeCloseTo(assertColor.red, 8);
			expect(expectedColor.green).toBeCloseTo(assertColor.green, 8);
			expect(expectedColor.blue).toBeCloseTo(assertColor.blue, 8);

			if (entity.billboard) {
				expect(entity.billboard.width.getValue()).toEqual(ORIGINAL_SIZE);
				expect(entity.billboard.height.getValue()).toEqual(ORIGINAL_SIZE);
			}
		}
	}

	function assert(dataSource, entityToAssert: any): void {
		assertHoverOnEntities(entityToAssert);
		assertNoChangeOnOtherEntities(dataSource, entityToAssert);
	}
});