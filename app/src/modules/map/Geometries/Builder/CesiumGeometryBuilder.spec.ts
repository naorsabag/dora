import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { DEFAULT_GEOMETRY_DESIGN, POLY_COORDINATES, POLYGON_WITH_HOLES_COORDINATES } from "../../../../test/TestConsts";
import { CesiumLine } from "../Cesium/CesiumLine";
import { CesiumPoint } from "../Cesium/CesiumPoint";
import { CesiumPolygon } from "../Cesium/CesiumPolygon";
import { Geometry } from "../Geometry";
import { GEOMETRY_TYPES } from "../GeometryTypes";
import { LinePatternName } from "../../GeometryDesign/Enums/LinePatternName";
import { FillPatternName } from "../../GeometryDesign/Enums/FillPatternName";
import { Polygon } from "../Polygon";
import { SmoothingType } from "../../GeometryDesign/Enums/SmoothingType";
import { Line } from "../Line";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Geometry Builder", () => {

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

	describe("build geometry from native entity", () => {
		describe("build polygon", () => {

			let expectGeometry: CesiumPolygon;
			beforeEach((done) => {
				let geometry: Polygon = cesiumTestComponent.mapComponent
					.geometryBuilder.buildPolygon(POLY_COORDINATES, DEFAULT_GEOMETRY_DESIGN);
				geometry.addToMap();
				expectGeometry = <CesiumPolygon>cesiumTestComponent.mapComponent
					.geometryBuilder.buildFromNativeEntity(geometry.getGeometryOnMap().getFlattedGeometries()[0]);
				expectGeometry.addToMap();
				done();
			});

			afterEach(() => {
				expectGeometry.remove();
				expectGeometry = null;
			});

			it("creates polygon", (done) => {
				expect(expectGeometry).toBeDefined();
				expect(expectGeometry.geometryType).toEqual(GEOMETRY_TYPES.POLYGON);
				done();
			});

			it("removes polygon from map", () => {
				const oneOfGeometriesOnMap = expectGeometry.getGeometryOnMap().getFlattedGeometries()[0];
				expectGeometry.remove();
				expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).not.toContain(oneOfGeometriesOnMap);
				expect(expectGeometry.getGeometryOnMap()).toBeNull();
			});

			it("has the right coordinates", () => {
				cesiumTestComponent.expectGeometry(expectGeometry, [...POLY_COORDINATES, POLY_COORDINATES[0]]);
			});

			it("sets visibility", () => {
				expectGeometry.setVisibility(false);
				expect(expectGeometry.getGeometryOnMap().isShowing).toBeFalsy();
				expectGeometry.setVisibility(true);
				expect(expectGeometry.getGeometryOnMap().isShowing).toBeTruthy();
			});

			it("sets description", () => {
				expectGeometry.openBalloonHtml("abc");
				expect(expectGeometry.getGeometryOnMap().getFlattedGeometries()[0].description.getValue()).toEqual("abc");
			});

			it("sets fill color", () => {
				expectGeometry.mark();
				const expectedColor = Cesium.Color.fromCssColorString("#5ec4ff").withAlpha(expectGeometry.getDesign().fill.opacity);
				expect(expectGeometry.getGeometryOnMap().getFlattedGeometries()[0].polygon.material.color.getValue(Cesium.JulianDate.now()))
					.toEqual(expectedColor);
			});
		});

		describe("build polygon with holes", () => {

			let expectGeometry: CesiumPolygon;
			beforeEach(() => {
				let geometry: Geometry = cesiumTestComponent.mapComponent
					.geometryBuilder.buildPolygon(POLYGON_WITH_HOLES_COORDINATES, DEFAULT_GEOMETRY_DESIGN);
				geometry.addToMap();
				expectGeometry = <CesiumPolygon>cesiumTestComponent.mapComponent.geometryBuilder.buildFromNativeEntity(geometry.getGeometryOnMap().getFlattedGeometries()[0]);
			});

			afterEach(() => {
				expectGeometry.remove();
				expectGeometry = null;
			});

			it("has the right coordinates", () => {
				cesiumTestComponent.expectGeometry(expectGeometry, POLYGON_WITH_HOLES_COORDINATES);
			});
		});

		describe("build line", () => {

			let expectGeometry: CesiumLine;
			beforeEach((done) => {
				let geometry: Geometry = cesiumTestComponent.mapComponent
					.geometryBuilder.buildLine(POLY_COORDINATES, DEFAULT_GEOMETRY_DESIGN);
				geometry.addToMap();
				expectGeometry = <CesiumLine>cesiumTestComponent.mapComponent
					.geometryBuilder.buildFromNativeEntity(geometry.getGeometryOnMap().getFlattedGeometries()[0]);
				expectGeometry.addToMap();
				done();
			});

			afterEach(() => {
				expectGeometry.remove();
				expectGeometry = null;
			});

			it("creates line", (done) => {
				expect(expectGeometry).toBeDefined();
				expect(expectGeometry.geometryType).toEqual(GEOMETRY_TYPES.LINE);
				done();
			});

			it("removes line from map", () => {
				const entityOnMap = expectGeometry.getGeometryOnMap().getFlattedGeometries()[0];
				expectGeometry.remove();
				expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).not.toContain(entityOnMap);
				expect(expectGeometry.getGeometryOnMap()).toBeNull();
			});

			it("has the right coordinates", () => {
				cesiumTestComponent.expectGeometry(expectGeometry, POLY_COORDINATES);
			});

			it("sets visibility", () => {
				expectGeometry.setVisibility(false);
				expect(expectGeometry.getGeometryOnMap().isShowing).toBeFalsy();
				expectGeometry.setVisibility(true);
				expect(expectGeometry.getGeometryOnMap().isShowing).toBeTruthy();
			});

			it("sets description", () => {
				expectGeometry.openBalloonHtml("abc");
				expectGeometry.getGeometryOnMap().getFlattedGeometries().forEach(entity => {
					expect(entity.description.getValue(Cesium.JulianDate.now())).toEqual("abc");
				});
			});

			it("sets line color", () => {
				expectGeometry.mark();
				const expectedColor = Cesium.Color.fromCssColorString("#5ec4ff").withAlpha(expectGeometry.getDesign().line.opacity);
				expect(expectGeometry.getGeometryOnMap().getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
					.toEqual(expectedColor);
			});
		});
		describe("build from geometries with patterns", () => {
			it("should build polygon from polygon with fill and outline patterns", () => {
				let sourceGeometry: Polygon = cesiumTestComponent.mapComponent
					.geometryBuilder.buildPolygon(POLY_COORDINATES, {
						line: {pattern: LinePatternName.Dashed},
						fill: {pattern: FillPatternName.Squares}
					});
				sourceGeometry.addToMap();
				let expectGeometry: CesiumPolygon = <CesiumPolygon>cesiumTestComponent.mapComponent
					.geometryBuilder.buildFromNativeEntity(sourceGeometry.getGeometryOnMap().getFlattedGeometries()[0]);

				expect(expectGeometry).toBeDefined();
				expect(expectGeometry.geometryType).toBe(GEOMETRY_TYPES.POLYGON);
				expect(expectGeometry.getCoordinates()).toEqual(sourceGeometry.getCoordinates());
				expect(expectGeometry.getDesign()).toEqual(sourceGeometry.getDesign());
			});

			it("should build polygon from smoothed polygon", () => {
				let sourceGeometry: Polygon = cesiumTestComponent.mapComponent
					.geometryBuilder.buildPolygon(POLY_COORDINATES, {
						line: {smoothing: SmoothingType.Round}
					});
				sourceGeometry.addToMap();
				let expectGeometry = <CesiumPolygon>cesiumTestComponent.mapComponent
					.geometryBuilder.buildFromNativeEntity(sourceGeometry.getGeometryOnMap().getFlattedGeometries()[0]);

				expect(expectGeometry).toBeDefined();
				expect(expectGeometry.geometryType).toBe(GEOMETRY_TYPES.POLYGON);
				expect(expectGeometry.getCoordinates()).toEqual(sourceGeometry.getCoordinates());
				expect(expectGeometry.getDesign()).toEqual(sourceGeometry.getDesign());
			});

			it("should build polyline from polyline with pattern", () => {
				let sourceGeometry: Line = cesiumTestComponent.mapComponent
					.geometryBuilder.buildLine(POLY_COORDINATES, {
						line: {pattern: LinePatternName.Dashed}
					});
				sourceGeometry.addToMap();
				let expectGeometry = <CesiumPolygon>cesiumTestComponent.mapComponent
					.geometryBuilder.buildFromNativeEntity(sourceGeometry.getGeometryOnMap().getFlattedGeometries()[0]);

				expect(expectGeometry).toBeDefined();
				expect(expectGeometry.geometryType).toBe(GEOMETRY_TYPES.LINE);
				expect(expectGeometry.getCoordinates()).toEqual(sourceGeometry.getCoordinates());
				expect(expectGeometry.getDesign()).toEqual(sourceGeometry.getDesign());
			});
		});

		describe("build point", () => {

			let expectGeometry: CesiumPoint;
			beforeEach((done) => {
				let geometry: Geometry = cesiumTestComponent.mapComponent
					.geometryBuilder.buildPoint(POLY_COORDINATES[0], DEFAULT_GEOMETRY_DESIGN);
				geometry.addToMap();
				expectGeometry = <CesiumPoint>cesiumTestComponent.mapComponent
					.geometryBuilder.buildFromNativeEntity(geometry.getGeometryOnMap());
				expectGeometry.addToMap();
				done();
			});

			afterEach(() => {
				expectGeometry.remove();
				expectGeometry = null;
			});

			it("creates point", (done) => {
				expect(expectGeometry).toBeDefined();
				expect(expectGeometry.geometryType).toEqual(GEOMETRY_TYPES.POINT);
				done();
			});

			it("removes point from map", () => {
				const entityOnMap = expectGeometry.getGeometryOnMap();
				expectGeometry.remove();
				expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).not.toContain(entityOnMap);
				expect(expectGeometry.getGeometryOnMap()).toBeNull();
			});

			it("has the right coordinates", () => {
				cesiumTestComponent.expectGeometry(expectGeometry, [POLY_COORDINATES[0]]);
			});

			it("sets visibility", () => {
				expectGeometry.setVisibility(false);
				expect(expectGeometry.getGeometryOnMap().show).toBeFalsy();
				expectGeometry.setVisibility(true);
				expect(expectGeometry.getGeometryOnMap().show).toBeTruthy();
			});

			it("sets description", () => {
				expectGeometry.openBalloonHtml("abc");
				expect(expectGeometry.getGeometryOnMap().description.getValue()).toEqual("abc");
			});

			it("sets fill color", () => {
				expectGeometry.mark();
				expect(expectGeometry.getGeometryOnMap().billboard.color.getValue(Cesium.JulianDate.now()))
					.toEqual(Cesium.Color.fromCssColorString("#5ec4ff").withAlpha(expectGeometry.getDesign().fill.opacity));
			});
		});
	});
});