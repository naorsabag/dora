import { CesiumTestComponent } from "../../../test/CesiumTestComponent";
import { CesiumLayer } from "./CesiumLayer";
import { CesiumPoint } from "../Geometries/Cesium/CesiumPoint";
import { POLY_COORDINATES, DEFAULT_GEOMETRY_DESIGN } from "../../../test/TestConsts";


const Cesium = require("cesium/Source/Cesium");

describe("Cesium Layer", () => {
	let layer: CesiumLayer;
	let cesiumTestComponent: CesiumTestComponent;
	beforeEach((done) => {
		cesiumTestComponent = new CesiumTestComponent({ mapDivId: "map" });
		cesiumTestComponent.initMapComponent().then(() => {
			layer = new CesiumLayer(cesiumTestComponent.mapComponent);
			layer.show();
			done();
		});
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			layer = null;
		}
	});

	it("creates layer", () => {
		expect(layer).toBeDefined();
	});

	it("adds the layer to the map", () => {
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.contains((<any>layer).customDataSource)).toBeTruthy();
	});

	it("hides the layer from the map", () => {
		layer.hide();
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.contains((<any>layer).customDataSource)).toBeTruthy();
		expect((<any>layer).customDataSource.show).toBeFalsy();
	});

	it("removes the layer from the map", () => {
		layer.remove();
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.dataSources.contains((<any>layer).customDataSource)).toBeFalsy();
	});

	it("adds and removes a geometry from the layer (also adds and removes the entity from the dataSource)", () => {
		let point = new CesiumPoint(cesiumTestComponent.mapComponent, POLY_COORDINATES[0], DEFAULT_GEOMETRY_DESIGN, "pointid");
		layer.addGeometry(point);
		let entity = point.getGeometryOnMap();
		expect(layer.getGeometries().indexOf(point)).not.toBe(-1);
		expect((<any>layer).customDataSource.entities.contains(entity)).toBeTruthy();
		layer.removeGeometry(point);
		expect(layer.getGeometries().indexOf(point)).toBe(-1);
		expect((<any>layer).customDataSource.entities.contains(entity)).toBeFalsy();
	});
});