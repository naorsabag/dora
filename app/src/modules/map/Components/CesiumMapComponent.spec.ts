import { CesiumTestComponent } from "../../../test/CesiumTestComponent";
import { EventSimulator } from "../../../test/EventSimulator";
import {
	END_SCREEN_POSITION,
	FLY_TO_COORDINATES,
	FLY_TO_COORDINATES_BOUNDS,
	KeyboardButton,
	KML_NETWORK_LINK,
	KML_STR,
	KML_TIMESPAN_STR,
	KML_TIMESTAMP_STR,
	MouseButton,
	START_SCREEN_POSITION,
	VIEW_BOUNDS,
	ZOOM
} from "../../../test/TestConsts";
import { MapEventArgs } from "../Events/MapEventArgs";
import { CesiumKMLGeometryCollection } from "../Geometries/Cesium/CesiumKmlGeometryCollection";
import { Coordinate } from "../Geometries/Coordinate";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { NetworkLinkKMLGeometryCollection } from "../Geometries/NetworkLinkKMLGeometryCollection";
import { CesiumUtilities } from "../MapUtils/CesiumUtilities";
import { ViewBounds } from "./View/ViewBounds";
import { MapType } from "@dora/map-types";

const Cesium = require("cesium/Source/Cesium");

describe("CesiumMapComponent ==>", () => {
	let cesiumTestComponent: CesiumTestComponent;
	let eventSimulator: EventSimulator;
	beforeEach((done) => {
		cesiumTestComponent = new CesiumTestComponent({ mapDivId: "map" });
		cesiumTestComponent.initMapComponent().then(() => {
			eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
			done();
		});
	});

	afterEach(() => {

		try {
			if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
				cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
				cesiumTestComponent = null;
				eventSimulator = null;
			}
		} catch (error) {
			throw new Error(`The error accord in the afterEach's cleanup, error: ${error}`);
		}
	});

	describe("initNativeMapInstance ==>", () => {
		it("should throw an error, init with invalid-value", () => {
			expect(() => cesiumTestComponent.mapComponent.initNativeMapInstance(undefined))
				.toThrowError("Invalid type for cesium's map-instance.");
			expect(() => cesiumTestComponent.mapComponent.initNativeMapInstance(null))
				.toThrowError("Invalid type for cesium's map-instance.");
			// expect(() => cesiumTestComponent.mapComponent.initNativeMapInstance({} as Cesium.Viewer))
			// 	.toThrowError("Invalid type for cesium's map-instance.");
		});

		it("should throw and error, map-instance has already initialized", () => {
			// 'map' string is known id of a DOM Element, which is necessary to init new cesium.viewer.
			expect(() => cesiumTestComponent.mapComponent.initNativeMapInstance(new Cesium.Viewer("map")))
				.toThrowError("Cesium map-instance already initialized");
		});

		it("should init again, map has destroyed but object still exist", async () => {
			// Destroy test map instance initialize
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();

			// 'map' string is known id of a DOM Element, which is necessary to init new cesium.viewer.
			cesiumTestComponent.mapComponent.initNativeMapInstance(new Cesium.Viewer("map"));
			expect(cesiumTestComponent.mapComponent.nativeMapInstance instanceof Cesium.Viewer)
				.toBeTruthy();
		});
	});

	describe("nativeMapInstance ==>", () => {

		it("should return map instance", () => {
			expect(cesiumTestComponent.mapComponent.nativeMapInstance).toBeDefined();
		});
	});

	describe("nativeMapType ==>", () => {
		it("should return map type", () => {
			expect(cesiumTestComponent.mapComponent.nativeMapType).toBe(MapType.CESIUM);
		});
	});

	describe("mapLibraryObject ==>", () => {
		it("should return map library object", () => {
			const LO = cesiumTestComponent.mapComponent.mapLibraryObject;
			// Check random properties known on cesium library object
			expect(LO).toBeDefined();
			expect(LO.Viewer).toBeDefined();
			expect(LO.Billboard).toBeDefined();
			expect(LO.Cesium3DTile).toBeDefined();
			expect(LO.Camera).toBeDefined();
		});
	});

	it("creates map element inside the map div", () => {
		expect($("#" + cesiumTestComponent.mapComponent.getConfig().mapDivId))
			.toContainElement("div.cesium-widget");
	});

	it("doesn't create new map if called twice", (done) => {
		let oldMap = cesiumTestComponent.mapComponent.nativeMapInstance;
		cesiumTestComponent.mapComponent.load().then(() => {
			expect(cesiumTestComponent.mapComponent.nativeMapInstance).toEqual(oldMap);
			done();
		});
	});

	it("hides credits", () => {
		expect($("#" + cesiumTestComponent.mapComponent.getConfig().creditContainer))
			.toContainElement("div.cesium-widget-credits");
	});

	it("sets default view in center", () => {
		let coordinate: Coordinate = CesiumUtilities.toCoordinateFromCartographic(
			cesiumTestComponent.mapComponent.nativeMapInstance.camera.positionCartographic);

		expect(coordinate.latitude)
			.toBeCloseTo(cesiumTestComponent.mapComponent.getConfig().center.latitude, 5);
		expect(coordinate.longitude)
			.toBeCloseTo(cesiumTestComponent.mapComponent.getConfig().center.longitude, 5);
		expect(coordinate.altitude)
			.toBeCloseTo(cesiumTestComponent.mapComponent.getConfig().center.altitude, 5);
	});

	it("returns correct view bounds", (done) => {
		let rec = Cesium.Rectangle.fromDegrees(...VIEW_BOUNDS);

		cesiumTestComponent.mapComponent.nativeMapInstance.camera.flyTo({
			destination: rec,
			duration: 0,
			complete: () => {
				let north = Cesium.Math.toDegrees(rec.north);
				let south = Cesium.Math.toDegrees(rec.south);
				let west = Cesium.Math.toDegrees(rec.west);
				let east = Cesium.Math.toDegrees(rec.east);

				const actualBounds: ViewBounds = cesiumTestComponent.mapComponent.getViewBounds();
				expect(actualBounds.north).toBeGreaterThanOrEqual(north);
				expect(actualBounds.east).toBeGreaterThanOrEqual(east);
				expect(actualBounds.south).toBeLessThanOrEqual(south);
				expect(actualBounds.west).toBeLessThanOrEqual(west);
				done();
			}
		});
	});

	it("returns correct center", () => {

		const coord = cesiumTestComponent.mapComponent.getViewCenter();

		expect(coord.latitude).toBeCloseTo(cesiumTestComponent.mapComponent.getConfig().center.latitude, 5);
		expect(coord.longitude).toBeCloseTo(cesiumTestComponent.mapComponent.getConfig().center.longitude, 5);
		expect(coord.altitude).toBeCloseTo(cesiumTestComponent.mapComponent.getConfig().center.altitude, 5);
	});

	it("flies to to the right coordinate", (done) => {

		cesiumTestComponent.mapComponent.flyTo(FLY_TO_COORDINATES).then(() => {
			const coord: Coordinate = cesiumTestComponent.mapComponent.getViewCenter();

			expect(Math.abs(FLY_TO_COORDINATES.latitude - coord.latitude)).toBeLessThanOrEqual(0.001);
			expect(Math.abs(FLY_TO_COORDINATES.longitude - coord.longitude)).toBeLessThanOrEqual(0.001);
			expect(Math.abs(FLY_TO_COORDINATES.altitude - coord.altitude)).toBeLessThanOrEqual(0.001);
			done();
		});
	});

	it("flies to to the right bounds", async () => {
		const southWest: Coordinate = new Coordinate(FLY_TO_COORDINATES_BOUNDS.south,
			FLY_TO_COORDINATES_BOUNDS.west);
		const northEast: Coordinate = new Coordinate(FLY_TO_COORDINATES_BOUNDS.north,
			FLY_TO_COORDINATES_BOUNDS.east);

		await cesiumTestComponent.mapComponent.flyToBounds(southWest, northEast, 0.5, false);
		assertViewBounds(cesiumTestComponent.mapComponent.getViewBounds());
		await cesiumTestComponent.mapComponent.flyToBounds(southWest, northEast, 0.5, true);
		assertViewBounds(cesiumTestComponent.mapComponent.getViewBounds());
	});

	it("sets zoom", (done) => {
		cesiumTestComponent.mapComponent.setZoom(ZOOM).then(() => {
			expect(cesiumTestComponent.mapComponent.getViewCenter().altitude).toBeCloseTo(ZOOM, 5);
			done();
		});
	});

	it("returns correct heading", () => {
		expect(cesiumTestComponent.mapComponent.getHeading())
			.toBeCloseTo(Cesium.Math.toDegrees(cesiumTestComponent.mapComponent.nativeMapInstance.camera.heading), 5);
	});

	it("sets heading", () => {
		cesiumTestComponent.mapComponent.setHeading(50);
		expect(cesiumTestComponent.mapComponent.getHeading()).toBeCloseTo(50, 5);
	});

	it("orient map north", () => {
		const oldBounds = cesiumTestComponent.mapComponent.getViewBounds();
		cesiumTestComponent.mapComponent.nativeMapInstance.camera.setView({
			orientation: {
				pitch: -Cesium.Math.PI
			}
		});
		cesiumTestComponent.mapComponent.orientMapNorth(true);
		const newBounds = cesiumTestComponent.mapComponent.getViewBounds();
		expect(newBounds.east).toEqual(oldBounds.east);
		expect(newBounds.west).toEqual(oldBounds.west);
		expect(newBounds.north).toEqual(oldBounds.north);
		expect(newBounds.south).toEqual(oldBounds.south);

	});

	it("adds navigation-mixin", () => {
		expect($("#" + cesiumTestComponent.mapComponent.getConfig().mapDivId))
			.toContainElement("div#distanceLegendDiv");
	});

	it("listens for clicks", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs: MapEventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			expect(eventArgs.altPressed).toEqual(false);
			expect(eventArgs.ctrlPressed).toEqual(false);
			expect(eventArgs.shiftPressed).toEqual(false);
			cesiumTestComponent.mapComponent.off("click", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("click", listener);
		eventSimulator.simulateLeftClick(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y);
	});

	it("listens for clicks with ctrl", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs: MapEventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			expect(eventArgs.altPressed).toEqual(false);
			expect(eventArgs.ctrlPressed).toEqual(true);
			expect(eventArgs.shiftPressed).toEqual(false);
			cesiumTestComponent.mapComponent.off("click", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("click", listener);
		eventSimulator.simulateLeftClick(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y, KeyboardButton.CTRL);
	});

	it("listens for clicks with alt", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs: MapEventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			expect(eventArgs.altPressed).toEqual(true);
			expect(eventArgs.ctrlPressed).toEqual(false);
			expect(eventArgs.shiftPressed).toEqual(false);
			cesiumTestComponent.mapComponent.off("click", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("click", listener);
		eventSimulator.simulateLeftClick(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y, KeyboardButton.ALT);
	});

	it("listens for clicks with shift", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs: MapEventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			expect(eventArgs.altPressed).toEqual(false);
			expect(eventArgs.ctrlPressed).toEqual(false);
			expect(eventArgs.shiftPressed).toEqual(true);
			cesiumTestComponent.mapComponent.off("click", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("click", listener);
		eventSimulator.simulateLeftClick(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y, KeyboardButton.SHIFT);
	});

	it("listens for double clicks", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			cesiumTestComponent.mapComponent.off("dblclick", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("dblclick", listener);
		eventSimulator.simulate("dblclick", START_SCREEN_POSITION.x, START_SCREEN_POSITION.y);
	});

	it("listens for right click", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			cesiumTestComponent.mapComponent.off("rightclick", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("rightclick", listener);
		eventSimulator.simulateRightClick(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y, MouseButton.RIGHT);
	});

	it("listens for mouse move", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs) => {
			expect(eventArgs.endPosX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.endPosY).toEqual(START_SCREEN_POSITION.y);
			cesiumTestComponent.mapComponent.off("mousemove", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("mousemove", listener);
		eventSimulator.simulate("move", START_SCREEN_POSITION.x, START_SCREEN_POSITION.y);
	});

	it("listens for left down", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			cesiumTestComponent.mapComponent.off("mousedown", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("mousedown", listener);
		eventSimulator.simulate("down", START_SCREEN_POSITION.x, START_SCREEN_POSITION.y);
	});

	it("listens for left up", (done) => {
		let listener: (eventArgs: any) => void = (eventArgs) => {
			expect(eventArgs.clientX).toEqual(START_SCREEN_POSITION.x);
			expect(eventArgs.clientY).toEqual(START_SCREEN_POSITION.y);
			cesiumTestComponent.mapComponent.off("mouseup", listener);
			done();
		};
		cesiumTestComponent.mapComponent.on("mouseup", listener);
		eventSimulator.simulate("up", START_SCREEN_POSITION.x, START_SCREEN_POSITION.y);
	});

	it("listens for zoom changes", (done) => {
		let listener: (eventArgs: any) => void = (zoom: number) => {
			let expectedZoom: number = 508180.7259;
			let diff = Math.abs(expectedZoom - zoom);
			expect(diff).toBeLessThanOrEqual(0.01);
			cesiumTestComponent.mapComponent.off("zoomChanged", listener);
			setTimeout(() => {
				done();
			}, 1);
		};
		cesiumTestComponent.mapComponent.on("zoomChanged", listener);
		eventSimulator.simulate("move", START_SCREEN_POSITION.x, START_SCREEN_POSITION.y);
		eventSimulator.simulate("wheel", START_SCREEN_POSITION.x, START_SCREEN_POSITION.y, 10);
	});

	it("listens for view changes", (done) => {
		let listener: (eventArgs: any) => void = (bounds) => {
			expect(cesiumTestComponent.mapComponent.getViewBounds()).toEqual(bounds);
			cesiumTestComponent.mapComponent.off("viewChanged", listener);
			setTimeout(() => {
				done();
			}, 1);
		};
		cesiumTestComponent.mapComponent.on("viewChanged", listener);
		eventSimulator.simulateDrag(START_SCREEN_POSITION.x, START_SCREEN_POSITION.y,
			END_SCREEN_POSITION.x, END_SCREEN_POSITION.y);
	});

	describe("loadKML", () => {
		it("add KML", (done) => {
			let kmlDoc: Document = $.parseXML(KML_STR);
			cesiumTestComponent.mapComponent.loadKML(kmlDoc).then((kmlGeomtry: CesiumKMLGeometryCollection) => {
				expect(kmlGeomtry).toBeDefined();
				done();
			});
		});

		it("add KML and replace polygons with polylines", (done) => {
			let kmlDoc: Document = $.parseXML(KML_STR);
			cesiumTestComponent.mapComponent.loadKML(kmlDoc, true).then((kmlGeomtry: CesiumKMLGeometryCollection) => {
				expect(kmlGeomtry).toBeDefined();
				const dataSourceEntities = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0).entities.values;
				for (let entity of dataSourceEntities) {
					expect(entity.polyline).toBeDefined();
				}
				done();
			});
		});

		it("add KML with timeline", async () => {
			spyOn(cesiumTestComponent.mapComponent, "toggleTimeline");

			let kmlDocSpan: Document = $.parseXML(KML_TIMESPAN_STR);
			let kmlGeometrySpan: IKMLGeometryCollection = await cesiumTestComponent.mapComponent.loadKML(kmlDocSpan, false);
			expect(kmlGeometrySpan).toBeDefined();
			expect(cesiumTestComponent.mapComponent.toggleTimeline).toHaveBeenCalledWith(true);

			let kmlDocStamp: Document = $.parseXML(KML_TIMESTAMP_STR);
			let kmlGeometryStamp: IKMLGeometryCollection = await cesiumTestComponent.mapComponent.loadKML(kmlDocStamp, false);
			expect(kmlGeometryStamp).toBeDefined();
			expect(cesiumTestComponent.mapComponent.toggleTimeline).toHaveBeenCalledWith(true);
		});

		it("add networklink KML", async () => {
			let kmlGeometry: IKMLGeometryCollection = await cesiumTestComponent.mapComponent
				.loadKML(KML_NETWORK_LINK);

			expect(kmlGeometry).toBeDefined();
			expect(kmlGeometry instanceof NetworkLinkKMLGeometryCollection).toBeTruthy();
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)
				.entities.getById("root_node")).toBeDefined();

			await kmlGeometry.setVisibility(false);
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(0)).toBeUndefined();
		});
	});

	it("should toggle timeline", () => {
		assertTimelineVisibility(cesiumTestComponent, false);

		cesiumTestComponent.mapComponent.toggleTimeline(true);

		assertTimelineVisibility(cesiumTestComponent, true);

		cesiumTestComponent.mapComponent.toggleTimeline(false);

		assertTimelineVisibility(cesiumTestComponent, false);

		cesiumTestComponent.mapComponent.toggleTimeline(true);

		assertTimelineVisibility(cesiumTestComponent, true);

		cesiumTestComponent.mapComponent.toggleTimeline(true);

		assertTimelineVisibility(cesiumTestComponent, true);

		cesiumTestComponent.mapComponent.toggleTimeline(false);

		assertTimelineVisibility(cesiumTestComponent, true);

		cesiumTestComponent.mapComponent.toggleTimeline(false);

		assertTimelineVisibility(cesiumTestComponent, false);
	});

	it("return dimension", () => {
		expect(cesiumTestComponent.mapComponent.getConfig().is2D)
			.toEqual(cesiumTestComponent.mapComponent.getIs2D());
	});

	it("change dimension", () => {
		let configIs2D: boolean = cesiumTestComponent.mapComponent.getConfig().is2D;
		let configTerrainType =
			configIs2D ? "EllipsoidTerrainProvider" : "GoogleEarthEnterpriseTerrainProvider";
		let oppositeConfigTerrainType =
			!configIs2D ? "EllipsoidTerrainProvider" : "GoogleEarthEnterpriseTerrainProvider";

		cesiumTestComponent.mapComponent.changeDimension();

		expect(!configIs2D)
			.toEqual(cesiumTestComponent.mapComponent.getIs2D());
		expect((cesiumTestComponent.mapComponent.nativeMapInstance.terrainProvider.constructor as any).name)
			.toEqual(oppositeConfigTerrainType);

		cesiumTestComponent.mapComponent.changeDimension();

		expect(configIs2D)
			.toEqual(cesiumTestComponent.mapComponent.getIs2D());
		expect((cesiumTestComponent.mapComponent.nativeMapInstance.terrainProvider.constructor as any).name)
			.toEqual(configTerrainType);
	});
});

function assertTimelineVisibility(cesiumTestComponent: CesiumTestComponent, shouldBeVisible: boolean): void {
	let maximumRenderTimeChange = shouldBeVisible ? 0 : Infinity;
	let visibility = shouldBeVisible ? "visible" : "hidden";
	expect((cesiumTestComponent.mapComponent.nativeMapInstance as any)._automaticallyTrackDataSourceClocks).toEqual(shouldBeVisible);
	expect(cesiumTestComponent.mapComponent.nativeMapInstance.scene.requestRenderMode).toEqual(!shouldBeVisible);
	expect(cesiumTestComponent.mapComponent.nativeMapInstance.scene.maximumRenderTimeChange).toEqual(maximumRenderTimeChange);
	expect((cesiumTestComponent.mapComponent.nativeMapInstance.animation.container as HTMLElement).style.visibility).toEqual(visibility);
	expect((cesiumTestComponent.mapComponent.nativeMapInstance.timeline.container as HTMLElement).style.visibility).toEqual(visibility);
}

function assertViewBounds(actualBounds: ViewBounds): void {
	expect(actualBounds.north)
		.toBeGreaterThanOrEqual(FLY_TO_COORDINATES_BOUNDS.north);
	expect(actualBounds.east)
		.toBeGreaterThanOrEqual(FLY_TO_COORDINATES_BOUNDS.east);
	expect(actualBounds.south)
		.toBeLessThanOrEqual(FLY_TO_COORDINATES_BOUNDS.south);
	expect(actualBounds.west)
		.toBeLessThanOrEqual(FLY_TO_COORDINATES_BOUNDS.west);
}