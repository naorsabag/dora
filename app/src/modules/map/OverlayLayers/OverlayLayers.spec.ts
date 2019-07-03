import { CesiumTestComponent } from "../../../test/CesiumTestComponent";
import { RasterLayer } from "./RasterLayer";
import { VectorLayer } from "./VectorLayer";
import { CesiumLayerViewer } from "./LayerViewers/CesiumLayerViewer";
import { CesiumRasterImageryProvider } from "../Config/CesiumRasterImageryProvider";
import { HttpUtils } from "../Utilities/HttpUtils";
import { VectorSource } from "./Enums/VectorSource";
import { LayerType } from "./Enums/LayerType";
import { CesiumVectorImageryProvider } from "../Config/CesiumVectorImageryProvider";
import { Cesium3DBuildingViewer } from "./LayerViewers/Cesium3DBuildingViewer";

const Cesium = require("cesium/Source/Cesium");

describe("Rasters Layers", () => {
	let cesiumTestComponent: CesiumTestComponent;
	let rasterJson: string = "var mapServerDefs = {\"dbType\":\"gemap\",\"isAuthenticated\":false,\"layers\":[{\"icon\":\"icons/773_l.png\",\"id\":1011,\"initialState\":true,\"isPng\":false,\"label\":\"Imagery\",\"lookAt\":\"none\",\"opacity\":1,\"projection\":\"flat\",\"requestType\":\"ImageryMaps\",\"version\":1}],\"projection\":\"flat\",\"serverUrl\":\"LINK";
	let rasterLayer: RasterLayer;
	let spyOnHttpGet;
	let spyRaster;

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();

		spyOnHttpGet = spyOn(HttpUtils, "get");
		spyOnHttpGet.and.returnValue(Promise.resolve(rasterJson));

		rasterLayer = new RasterLayer("rasterToTest", "rasterGlobe", 5,
			"!!!!! !!!", "!!!! !!!!");

		let cesiumRasterImageryProvider = new CesiumRasterImageryProvider({url: "Wow.. what a url"});
		let cesiumLayerViewer: CesiumLayerViewer = new CesiumLayerViewer(cesiumTestComponent.mapComponent,
			cesiumRasterImageryProvider);

		rasterLayer.setViewer(cesiumLayerViewer);

		spyRaster = cesiumTestComponent.mapComponent.nativeMapInstance.scene.imageryLayers;
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			rasterLayer = null;
		}
	});

	it("should add raster to map", async () => {
		try {
			spyOn(spyRaster, "addImageryProvider");

			await rasterLayer.addToMap();

			let assertArgs = spyRaster.addImageryProvider.calls.first().args[0];
			assertCheck(assertArgs);

		} catch {
			throw new Error("Failed loading raster layer");
		}
	});

	it("should remove raster from map", async () => {
		await rasterLayer.addToMap();

		spyOn(spyRaster, "remove");

		await rasterLayer.remove();

		let assertArgs = spyRaster.remove.calls.first().args[0].imageryProvider;
		assertCheck(assertArgs);
	});

	it("should fail add raster if failed initialization from server", async () => {
		spyOnHttpGet.and.returnValue(Promise.reject());

		try {
			await rasterLayer.addToMap();
		} catch {
			return;
		}

		throw new Error("Failed loading raster layer");
	});

	function assertCheck(providerArgs) {
		expect(providerArgs.url)
			.toEqual("LINK");
		expect(Object.getPrototypeOf(providerArgs))
			.toEqual(Cesium.UrlTemplateImageryProvider.prototype);
	}
});

describe("Vectors Layers", () => {
	let cesiumTestComponent: CesiumTestComponent;
	let vectorLayer: VectorLayer;
	let spyVector;

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();

		vectorLayer = new VectorLayer(1, VectorSource.XXX, "!!!! !!!!!", LayerType.Layer, 2);
		let cesiumVectorImageryProvider = new CesiumVectorImageryProvider({url: "LINK"});
		let cesiumLayerViewer = new CesiumLayerViewer(cesiumTestComponent.mapComponent, cesiumVectorImageryProvider);
		vectorLayer.setViewer(cesiumLayerViewer);

		spyVector = cesiumTestComponent.mapComponent.nativeMapInstance.scene.imageryLayers;
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			vectorLayer = null;
		}
	});

	it("should add vector to map", async () => {
		try {
			spyOn(spyVector, "addImageryProvider");

			await vectorLayer.addToMap();

			let assertArgs = spyVector.addImageryProvider.calls.first().args[0];
			assertCheck(assertArgs);

		} catch {
			throw new Error("Failed loading vector layer");
		}
	});

	it("should add 3d building vector", async () => {
		let is2D: boolean = cesiumTestComponent.mapComponent.getIs2D();
		let buildingsKmlPath: string = is2D ?
			"LINK" :
			"LINK";
		let spyBuildingVector;
		let buildingVector = new VectorLayer(0, VectorSource.XXX, "!!!!!!ם !!!!!!ם", LayerType.Layer, 1);
		let cesiumBuildingVectorViewer = new Cesium3DBuildingViewer(cesiumTestComponent.mapComponent);
		buildingVector.setViewer(cesiumBuildingVectorViewer);
		spyBuildingVector = cesiumTestComponent.mapComponent;

		try {
			spyOn(spyBuildingVector, "loadKML");

			await buildingVector.addToMap();

			expect(spyBuildingVector.loadKML.calls.first().args[0]).toEqual(buildingsKmlPath);
		} catch {
			throw new Error("Failed loading 3d building vector");
		}
	});

	it("should fail add vector with bad url", async () => {
		let badVectorLayer = new VectorLayer(0, VectorSource.XXX, "!!! !!!!!", LayerType.Layer, 1);
		let cesiumVectorBadImageryProvider = new CesiumVectorImageryProvider({url: "Such a bad url.. wow"});
		let cesiumLayerBadViewer = new CesiumLayerViewer(cesiumTestComponent.mapComponent, cesiumVectorBadImageryProvider);
		badVectorLayer.setViewer(cesiumLayerBadViewer);

		try {
			await badVectorLayer.addToMap();
		} catch {
			return;
		}

		throw new Error("Promise shouldn't be resolved");
	});

	it("should remove vector from map", async () => {
		await vectorLayer.addToMap();

		spyOn(spyVector, "remove");

		await vectorLayer.remove();

		let assertArgs = spyVector.remove.calls.first().args[0].imageryProvider;
		assertCheck(assertArgs);
	});

	function assertCheck(providerArgs) {
		expect(providerArgs.url)
			.toEqual("LINK");
		expect(Object.getPrototypeOf(providerArgs))
			.toEqual(Cesium.ArcGisMapServerImageryProvider.prototype);
	}
});