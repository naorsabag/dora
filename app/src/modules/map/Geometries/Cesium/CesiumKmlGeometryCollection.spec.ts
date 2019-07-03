import {
	KML_HOVER_STR,
	KML_POINT_COORDINATE,
	KML_STR,
	KML_TIMESTAMP_STR,
} from "../../../../test/TestConsts";
import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { IKMLGeometryCollection } from "../IKMLGeometryCollection";
import { Geometry } from "../Geometry";
import { EventSimulator } from "../../../../test/EventSimulator";
import { ScreenCoordinate } from "../../GraphicsUtils/ScreenCoordinate";

describe("Cesium KML Geometry Collection", () => {

	let cesiumTestComponent: CesiumTestComponent;
	let kmlDoc: Document;
	let kmlGeometry: IKMLGeometryCollection;

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();
		kmlDoc = $.parseXML(KML_STR);
	});

	afterEach(async () => {
		if (kmlGeometry) {
			await kmlGeometry.setVisibility(false);
		}
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
		}
	});

	it("sets visibility", async () => {
		kmlGeometry = await cesiumTestComponent.mapComponent.loadKML(kmlDoc);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeDefined();

		await kmlGeometry.setVisibility(false);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeUndefined();

		await kmlGeometry.setVisibility(true);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeDefined();
	});

	it("sets visibility with polygons as lines", async () => {
		kmlGeometry = await cesiumTestComponent.mapComponent.loadKML(kmlDoc, true);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeDefined();

		await kmlGeometry.setVisibility(false);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeUndefined();

		await kmlGeometry.setVisibility(true);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeDefined();
	});

	it("sets visibility with timelineOn", async () => {
		kmlGeometry =
			await cesiumTestComponent.mapComponent.loadKML($.parseXML(KML_TIMESTAMP_STR), false);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeDefined();

		spyOn(cesiumTestComponent.mapComponent, "toggleTimeline");
		await kmlGeometry.setVisibility(false);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeUndefined();
		expect(cesiumTestComponent.mapComponent.toggleTimeline).toHaveBeenCalledWith(false);

		await kmlGeometry.setVisibility(true);
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeDefined();
		expect(cesiumTestComponent.mapComponent.toggleTimeline).toHaveBeenCalledWith(true);
	});

	it("get the right id", async () => {
		kmlGeometry = await cesiumTestComponent.mapComponent.loadKML(kmlDoc);

		const geometryOnMap: Geometry = cesiumTestComponent.mapComponent.geometryBuilder
			.buildFromNativeEntity(cesiumTestComponent.mapComponent
				.nativeMapInstance.dataSources.get(0).entities.values[0]);
		expect(kmlGeometry.getId()).toEqual(geometryOnMap.getCollectionContainerId());
	});

	it("should toggle hover on and off", async () => {
		kmlDoc = $.parseXML(KML_HOVER_STR);
		kmlGeometry = await cesiumTestComponent.mapComponent.loadKML(kmlDoc);
		let eventSimulator: EventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
		let pointEntity = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0).entities.values[1];
		let pos: ScreenCoordinate =
			cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(KML_POINT_COORDINATE);
		spyOn(cesiumTestComponent.mapComponent.nativeMapInstance.scene, "pick")
			.and.callFake((args: { x: number, y: number }) => {
			return {id: pointEntity};
		});

		await cesiumTestComponent.mapComponent
			.flyTo(KML_POINT_COORDINATE, 0);
		eventSimulator.simulate("move", pos.x, pos.y);
		cesiumTestComponent.assertHoverPoint(pointEntity);
		await kmlGeometry.setVisibility(false);
		eventSimulator.simulate("move", pos.x, pos.y);
		cesiumTestComponent.assertHoverOutOfPoint(pointEntity);
		await kmlGeometry.setVisibility(true);
		cesiumTestComponent.assertHoverOutOfPoint(pointEntity);
		eventSimulator.simulate("move", pos.x, pos.y);
		cesiumTestComponent.assertHoverPoint(pointEntity);
	});
});