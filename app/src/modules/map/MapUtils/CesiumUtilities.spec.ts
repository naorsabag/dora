import { Coordinate } from "../Geometries/Coordinate";
import { CesiumTestComponent } from "../../../test/CesiumTestComponent";
import { MapEventArgs } from "../Events/MapEventArgs";
import { CesiumUtilities } from "./CesiumUtilities";
import { MapUtils } from "./MapUtils";
import { EventSimulator } from "../../../test/EventSimulator";
import { END_SCREEN_POSITION, START_SCREEN_POSITION } from "../../../test/TestConsts";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium utilities", () => {

	let cesiumTestComponent: CesiumTestComponent;
	beforeEach((done) => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		cesiumTestComponent.initMapComponent().then(() => {
			done();
		});
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
		}
	});

	it("converts cartographic to coordinates", () => {

		let cartographic = new Cesium.Cartographic(0.60, 0.55, 500000);
		let coordinate: Coordinate = new Coordinate(Cesium.Math.toDegrees(cartographic.latitude),
			Cesium.Math.toDegrees(cartographic.longitude), cartographic.height);

		expect(coordinate).toEqual(
			CesiumUtilities.toCoordinateFromCartographic(cartographic));
	});

	it("converts coordinate to cartesian", () => {

		let coordinate: Coordinate = new Coordinate(34.3, 32.2, 500000);
		let cartesien = Cesium.Cartesian3.fromDegrees(coordinate.longitude,
			coordinate.latitude, coordinate.altitude);

		expect(cartesien).toEqual(
			CesiumUtilities.toCartesianFromCoordinate(coordinate));
	});

	it("converts coordinate to screen position", () => {
		const utils = cesiumTestComponent.mapComponent.utils;
		const coordinate: Coordinate = new Coordinate(31.75808824543252, 35.133326889131695);
		const pos = utils.toScreenPosFromCoordinate(coordinate);
		const coordinateFromPos = utils.toCoordinateFromScreenPosition(pos);
		expect(coordinateFromPos.latitude).toBeCloseTo(coordinate.latitude, 1);
		expect(coordinateFromPos.longitude).toBeCloseTo(coordinate.longitude, 1);
	});
	it("converts screen position to coordinate", () => {
		const utils = cesiumTestComponent.mapComponent.utils;
		const pos: Cesium.Cartesian2 = new Cesium.Cartesian2(50, 50);
		const coordinateFromPos = utils.toCoordinateFromScreenPosition(pos);
		const posFromCoordinate = utils.toScreenPosFromCoordinate(coordinateFromPos);
		expect(posFromCoordinate.x).toBeCloseTo(pos.x, -1);
		expect(posFromCoordinate.y).toBeCloseTo(pos.y, -1);
	});

	it("should not drag map when camera motion disabled", (done) => {
		const utils = cesiumTestComponent.mapComponent.utils;
		utils.setCameraMotionState(false);
		const cameraPositionBeforeDrag = cesiumTestComponent.mapComponent.nativeMapInstance.camera.position.clone();
		const boundsBefore = cesiumTestComponent.mapComponent.getViewBounds();
		let listener: (eventArgs: any) => void = (bounds) => {
			const cameraPositionAfterDrag = cesiumTestComponent.mapComponent.nativeMapInstance.camera.position.clone();
			expect(cameraPositionAfterDrag).toEqual(cameraPositionBeforeDrag);
			expect(bounds).toEqual(boundsBefore);
			cesiumTestComponent.mapComponent.off("viewChanged", listener);
			setTimeout(() => {
				done();
			}, 1);
		};
		cesiumTestComponent.mapComponent.on("viewChanged", listener);

		const eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.canvas);
		eventSimulator.simulateDrag(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y,
			END_SCREEN_POSITION.x, END_SCREEN_POSITION.y);
	});
	it("should drag map when camera motion enabled", (done) => {
		const utils = cesiumTestComponent.mapComponent.utils;
		utils.setCameraMotionState(true);
		const cameraPositionBeforeDrag = cesiumTestComponent.mapComponent.nativeMapInstance.camera.position.clone();
		const boundsBefore = cesiumTestComponent.mapComponent.getViewBounds();
		let listener: (eventArgs: any) => void = (bounds) => {
			const cameraPositionAfterDrag = cesiumTestComponent.mapComponent.nativeMapInstance.camera.position.clone();
			expect(cameraPositionAfterDrag).not.toEqual(cameraPositionBeforeDrag);
			expect(bounds).not.toEqual(boundsBefore);
			cesiumTestComponent.mapComponent.off("viewChanged", listener);
			setTimeout(() => {
				done();
			}, 1);
		};
		cesiumTestComponent.mapComponent.on("viewChanged", listener);

		const eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.canvas);
		eventSimulator.simulateDrag(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y,
			END_SCREEN_POSITION.x, END_SCREEN_POSITION.y);

	});


	it("compares entity amount in position", () => {
		let entityArrMock = [{id: "1"}, {id: "2"}];
		spyOn(cesiumTestComponent.mapComponent.nativeMapInstance.scene, "pick")
			.and.callFake(() => {
			return entityArrMock[0];
		});
		spyOn(cesiumTestComponent.mapComponent.nativeMapInstance.scene, "drillPick")
			.and.callFake(() => {
			return entityArrMock;
		});

		expect(cesiumTestComponent.mapComponent.utils
			.entitiesAmountInPositionGreaterThan(new MapEventArgs(null, null, null, null, null, null, null, 0, 0), 0))
			.toEqual(true);
		expect(cesiumTestComponent.mapComponent.utils
			.entitiesAmountInPositionGreaterThan(new MapEventArgs(null, null, null, null, null, null, null, 0, 0), 1))
			.toEqual(true);
		expect(cesiumTestComponent.mapComponent.utils
			.entitiesAmountInPositionGreaterThan(new MapEventArgs(null, null, null, null, null, null, null, 0, 0), 2))
			.toEqual(false);
		expect(cesiumTestComponent.mapComponent.utils
			.entitiesAmountInPositionGreaterThan(new MapEventArgs(null, null, null, null, null, null, null, 0, 0), 3))
			.toEqual(false);

	});

	it("should return altitude", async () => {
		const actual: number = await MapUtils
			.getAltitude(new Coordinate(32.825371870891324, 35.230941310263155));
		expect(actual).toEqual(309);
	});
});
