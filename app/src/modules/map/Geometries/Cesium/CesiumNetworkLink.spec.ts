import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { CesiumNetworkLink } from "./CesiumNetworkLink";
import { EventSimulator } from "../../../../test/EventSimulator";
import { NetworkLinkKMLGeometryCollection } from "../NetworkLinkKMLGeometryCollection";
import {
	KML_NETWORK_LINK,
	NETWORK_LINK_ROOT_BOUNDS,
	NETWORK_LINK_CHILDREN_BOUNDS, HOVER_COLOR_RGBA, ORIGINAL_COLOR_HEX
} from "../../../../test/TestConsts";
import { ScreenCoordinate } from "../../GraphicsUtils/ScreenCoordinate";
import { Coordinate } from "../Coordinate";

describe("Cesium Network link node", () => {

	let cesiumTestComponent: CesiumTestComponent;
	let eventSimulator: EventSimulator;
	let root: CesiumNetworkLink;
	let spyAdd;
	let spyRemove;

	describe("without hover", () => {

		beforeEach((done) => {
			cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
			cesiumTestComponent.initMapComponent().then(() => {

				spyAdd = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources;
				spyOn(spyAdd, "add").and
					.callFake(() => {
						return new Promise<void>(resolve => resolve());
					});
				spyRemove = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources;
				spyOn(spyRemove, "remove").and
					.callFake(() => {
						return;
					});

				$.get(KML_NETWORK_LINK, async (data) => {
					root = new CesiumNetworkLink(cesiumTestComponent.mapComponent, data, false, false);
					eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
					done();
				});
			});
		});

		afterEach(async () => {
			if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
				await root.stopListen();
				root = null;
				cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
				cesiumTestComponent = null;
			}
		});

		it("should add root kml only", async () => {
			await root.startListen();

			expect(spyAdd.add.calls.mostRecent().args[0]._entityCollection._entities.get("root_node")).toBeDefined();

			return;
		});

		it("should add children kmls", async () => {
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0], NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);

			await root.startListen();

			assertAllNodesKmlAdded();
			return;
		});

		it("should remove children kmls only", async () => {

			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0],
				NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);

			await root.startListen();

			assertAllNodesKmlAdded();

			let p = root.registerForNextRenderEnd();
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_ROOT_BOUNDS[0],
				NETWORK_LINK_ROOT_BOUNDS[1], 0, false);
			await p;

			assertAllNodesKmlRemovedExceptRoot();
		});

		it("should set visibility on and off", async () => {
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0],
				NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);

			await root.startListen();
			assertAllNodesKmlAdded();

			let kml: NetworkLinkKMLGeometryCollection =
				new NetworkLinkKMLGeometryCollection(cesiumTestComponent.mapComponent,
					root);

			await kml.setVisibility(false);
			assertAllNodesKmlRemoved();

			await kml.setVisibility(true);
			assertAllNodesKmlAdded();
			return;

		});

		it("should set visibility while in prepare state", async () => {
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_ROOT_BOUNDS[0],
				NETWORK_LINK_ROOT_BOUNDS[1], 0, false);
			await root.startListen();
			expect(spyAdd.add.calls.mostRecent().args[0]._entityCollection
				._entities.get("root_node")).toBeDefined();

			let kml: NetworkLinkKMLGeometryCollection =
				new NetworkLinkKMLGeometryCollection(cesiumTestComponent.mapComponent,
					root);
			let endPromise = root.registerForNextRenderEnd(async () => {
				await kml.setVisibility(false);
			});
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0],
				NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);
			await endPromise;
			assertAllNodesKmlRemoved();

			await kml.setVisibility(true);
			assertAllNodesKmlAdded();

		});

		it("should set visibility while in show state", async () => {
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0],
				NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);
			await root.startListen();
			assertAllNodesKmlAdded();

			let p = root.registerForNextRenderEnd();
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_ROOT_BOUNDS[0],
				NETWORK_LINK_ROOT_BOUNDS[1], 0, false);
			await p;
			assertAllNodesKmlRemovedExceptRoot();

			let kml: NetworkLinkKMLGeometryCollection =
				new NetworkLinkKMLGeometryCollection(cesiumTestComponent.mapComponent, root);
			let endPromise = root.registerForNextRenderEnd(async () => {
				await kml.setVisibility(false);
			});
			await cesiumTestComponent.mapComponent.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0],
				NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);
			await endPromise;
			assertAllNodesKmlRemoved();

			await kml.setVisibility(true);
			assertAllNodesKmlAdded();
		});
	});

	describe("with hover", () => {

		beforeEach((done) => {
			cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
			cesiumTestComponent.initMapComponent().then(() => {
				$.get(KML_NETWORK_LINK, async (data) => {
					root = new CesiumNetworkLink(cesiumTestComponent.mapComponent, data,
						false, false, null, true);
					eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
					done();
				});
			});
		});

		afterEach(async () => {
			if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
				await root.stopListen();
				root = null;
				cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
				cesiumTestComponent = null;
			}
		});

		it("should toggle on and off", async () => {
			await cesiumTestComponent.mapComponent
				.flyToBounds(NETWORK_LINK_CHILDREN_BOUNDS[0], NETWORK_LINK_CHILDREN_BOUNDS[1], 0, false);
			await root.startListen();
			let kml: NetworkLinkKMLGeometryCollection =
				new NetworkLinkKMLGeometryCollection(cesiumTestComponent.mapComponent,
					root);
			let pointEntity = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.get(3).entities.values[1];
			let pos: ScreenCoordinate =
				cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(new Coordinate(31.4, 34.5));
			spyOn(cesiumTestComponent.mapComponent.nativeMapInstance.scene, "pick")
				.and.callFake((args: { x: number, y: number }) => {
				return {id: pointEntity};
			});

			eventSimulator.simulate("move", pos.x, pos.y);

			cesiumTestComponent.assertHoverPoint(pointEntity);

			await kml.setVisibility(false);

			eventSimulator.simulate("move", pos.x, pos.y);

			cesiumTestComponent.assertHoverOutOfPoint(pointEntity);

			await kml.setVisibility(true);

			cesiumTestComponent.assertHoverOutOfPoint(pointEntity);

			eventSimulator.simulate("move", pos.x, pos.y);

			cesiumTestComponent.assertHoverPoint(pointEntity);
		});

	});

	function assertAllNodesKmlAdded() {
		expect(isFuncCalledWithDataSource(spyAdd.add, "root_node")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyAdd.add, "node00")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyAdd.add, "node01")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyAdd.add, "node02")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyAdd.add, "node03")).toBeTruthy();
	}

	function assertAllNodesKmlRemovedExceptRoot() {
		expect(isFuncCalledWithDataSource(spyRemove.remove, "root_node")).toBeFalsy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node00")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node01")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node02")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node03")).toBeTruthy();
	}

	function assertAllNodesKmlRemoved() {
		expect(isFuncCalledWithDataSource(spyRemove.remove, "root_node")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node00")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node01")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node02")).toBeTruthy();
		expect(isFuncCalledWithDataSource(spyRemove.remove, "node03")).toBeTruthy();
	}

	function isFuncCalledWithDataSource(spy, entityName: string) {
		for (let i = 0; i < spy.calls.count(); i++) {
			if (spy.calls.argsFor(i)[0]._entityCollection._entities.get(entityName)) {
				return true;
			}
		}
		return false;
	}
});