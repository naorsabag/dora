import { GEOMETRY_TYPES } from "../GeometryTypes";
import { CesiumPolygon } from "./CesiumPolygon";
import {
	DEFAULT_GEOMETRY_DESIGN,
	DEFAULT_GEOMETRY_ID,
	GEOJSON_POLYGON,
	GEOJSON_POLYGON_WITH_HOLES,
	NON_DEFAULT_DESIGN,
	POLY_COORDINATES,
	POLYGON_WITH_HOLES_COORDINATES,
	WKT_POLYGON,
	WKT_POLYGON_WITH_HOLES
} from "../../../../test/TestConsts";
import { Coordinate } from "../Coordinate";
import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { LinePatternName } from "../../GeometryDesign/Enums/LinePatternName";
import { FillPatternName } from "../../GeometryDesign/Enums/FillPatternName";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { EventSimulator } from "../../../../test/EventSimulator";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { IActionToken } from "../../Common/IActionToken";
import { CesiumMultiGeometry } from "./CesiumEntities/CesiumMultiGeometry";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Polygon", () => {
	const simplePolygonId: string = "simplePolygonId";
	const hierarchicalPolygonId: string = "simplePolygonId";
	const simplePolygonCoordinates = [...POLY_COORDINATES, POLY_COORDINATES[0]];

	let simplePolygon: CesiumPolygon;
	let hierarchicalPolygon: CesiumPolygon;

	let cesiumTestComponent: CesiumTestComponent;

	const createAndAddPolygon = (coordinates: Coordinate[] | Coordinate[][], id: string) => {
		const polygon = new CesiumPolygon(cesiumTestComponent.mapComponent, coordinates, DEFAULT_GEOMETRY_DESIGN, id);
		polygon.addToMap();

		return polygon;
	};

	const createAndAddSimplePolygon = () => {
		simplePolygon = createAndAddPolygon(POLY_COORDINATES, simplePolygonId);
	};
	const createAndAddHierarchicalPolygon = () => {
		hierarchicalPolygon = createAndAddPolygon(POLYGON_WITH_HOLES_COORDINATES, hierarchicalPolygonId);
	};

	beforeEach((done) => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		cesiumTestComponent.initMapComponent().then(done);
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			simplePolygon = null;
			hierarchicalPolygon = null;
		}
	});

	describe("constructor - ", () => {
		it("creates simple polygon", () => {
			createAndAddSimplePolygon();
			expect(simplePolygon).toBeDefined();
		});

		it("creates hierarchical polygon", () => {
			createAndAddHierarchicalPolygon();
			expect(hierarchicalPolygon).toBeDefined();
		});

		it("should save design", () => {
			createAndAddSimplePolygon();
			expect(DEFAULT_GEOMETRY_DESIGN as IGeometryDesign)
				.toEqual(CesiumEntitiesResolver.extractSavedDesign(simplePolygon.getGeometryOnMap().getFlattedGeometries()[0]));

			let polygonWithNonDefaultDesign: CesiumPolygon = new CesiumPolygon(cesiumTestComponent.mapComponent,
				POLY_COORDINATES, NON_DEFAULT_DESIGN, "non_default");
			polygonWithNonDefaultDesign.addToMap();

			expect(NON_DEFAULT_DESIGN)
				.toEqual(CesiumEntitiesResolver.extractSavedDesign(polygonWithNonDefaultDesign.getGeometryOnMap().getFlattedGeometries()[0]));
		});
	});

	describe("geometryType - ", () => {
		it("check correct type of simple polygon", () => {
			createAndAddSimplePolygon();
			expect(simplePolygon.geometryType).toBe(GEOMETRY_TYPES.POLYGON);
		});

		it("check correct type of hierarchical polygon", () => {
			createAndAddHierarchicalPolygon();
			expect(hierarchicalPolygon.geometryType).toBe(GEOMETRY_TYPES.POLYGON);
		});
	});

	describe("addToMap - ", () => {
		it("simple polygon is in the map", () => {

			const entitiesAmountBeforeAdding = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values.length;
			createAndAddSimplePolygon();
			// 3 entities added, one for polygon fill, one for outline and one for icon
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values.length).toBe(entitiesAmountBeforeAdding + 3);
		});
		it("hierarchical polygon is in the map", () => {
			const entitiesAmountBeforeAdding = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values.length;
			createAndAddHierarchicalPolygon();
			// 4 entities added, one for polygon fill, two for outline and one for icon
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values.length).toBe(entitiesAmountBeforeAdding + 4);
		});
	});

	describe("remove - ", () => {
		it("removes simple polygon from map", () => {
			createAndAddSimplePolygon();
			const geometry = simplePolygon.getGeometryOnMap().getFlattedGeometries()[0];
			simplePolygon.remove();
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).not.toContain(geometry);
			expect(simplePolygon.getGeometryOnMap()).toBeNull();
		});

		it("removes hierarchical polygon from map", () => {
			createAndAddHierarchicalPolygon();
			hierarchicalPolygon.remove();
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.getById(hierarchicalPolygonId)).toBeUndefined();
			expect(hierarchicalPolygon.getGeometryOnMap()).toBeNull();
		});
	});

	describe("getCoordinates - ", () => {
		it("simple polygon matches the source coordinates", () => {
			createAndAddSimplePolygon();
			cesiumTestComponent.expectGeometry(simplePolygon, simplePolygonCoordinates);
		});

		it("hierarchical polygon matches the source coordinates", () => {
			createAndAddHierarchicalPolygon();
			cesiumTestComponent.expectGeometry(hierarchicalPolygon, POLYGON_WITH_HOLES_COORDINATES);
		});
	});

	describe("setsCoordinates - ", () => {
		describe("set valid coordinates (closed ring)", () => {
			let newCoordinates: Coordinate[];
			beforeAll(() => {
				newCoordinates = simplePolygonCoordinates.slice(1);
				newCoordinates.push(newCoordinates[0]);
			});

			it("change the coordinates of simple polygon", () => {
				createAndAddSimplePolygon();
				simplePolygon.setCoordinates(newCoordinates);
				cesiumTestComponent.expectGeometry(simplePolygon, newCoordinates);
			});

			it("change the coordinates of hierarchical polygon", () => {
				createAndAddHierarchicalPolygon();
				hierarchicalPolygon.setCoordinates(newCoordinates);
				cesiumTestComponent.expectGeometry(hierarchicalPolygon, newCoordinates);
			});
		});

		it("change to unclosed ring coordinates", () => {
			const newCoordinates = simplePolygonCoordinates.slice(1);
			const exceptedCoordinates = [...newCoordinates, newCoordinates[0]];
			createAndAddSimplePolygon();
			simplePolygon.setCoordinates(newCoordinates);
			cesiumTestComponent.expectGeometry(simplePolygon, exceptedCoordinates);
		});
		it("change to 2 coordinates - invalid", () => {
			const newCoordinates = simplePolygonCoordinates.slice(0, 2);
			createAndAddSimplePolygon();
			expect(() => {
				simplePolygon.setCoordinates(newCoordinates);
			}).toThrowError();
		});

		it("change to null - invalid", () => {
			createAndAddSimplePolygon();
			expect(() => {
				simplePolygon.setCoordinates(null);
			}).toThrowError();
		});
	});

	describe("getWKT - ", () => {
		it("gets the right wkt of simple polygon", () => {
			createAndAddSimplePolygon();
			expect(simplePolygon.getWKT()).toBe(WKT_POLYGON);
		});
		it("gets the right wkt of hierarchical polygon", () => {
			createAndAddHierarchicalPolygon();
			expect(hierarchicalPolygon.getWKT()).toBe(WKT_POLYGON_WITH_HOLES);
		});
	});

	describe("getGeoJSON - ", () => {
		it("gets the right geo json of simple polygon", () => {
			createAndAddSimplePolygon();
			expect(simplePolygon.getGeoJSON()).toEqual(GEOJSON_POLYGON);
		});
		it("gets the right geo json of hierarchical polygon", () => {
			createAndAddHierarchicalPolygon();
			expect(hierarchicalPolygon.getGeoJSON()).toEqual(GEOJSON_POLYGON_WITH_HOLES);
		});
	});

	describe("setGeoJSON - ", () => {
		it("sets hierarchical polygon with simple polygon geoJson", () => {
			createAndAddHierarchicalPolygon();
			const geoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
				type: "Feature",
				properties: {},
				geometry: GEOJSON_POLYGON
			};
			hierarchicalPolygon.setGeoJSON(geoJsonFeature);
			expect(hierarchicalPolygon.getGeoJSON()).toEqual(GEOJSON_POLYGON);
			const coordinatesOfGeometryInMap = CesiumEntitiesResolver.buildPolygonCoordinatesFromEntity(hierarchicalPolygon.getGeometryOnMap().getFlattedGeometries()[0].polygon);
			cesiumTestComponent.expectGeometry(hierarchicalPolygon, coordinatesOfGeometryInMap);
		});

		it("sets simple polygon with hierarchical polygon geoJson", () => {
			createAndAddSimplePolygon();
			const geoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
				type: "Feature",
				properties: {},
				geometry: GEOJSON_POLYGON_WITH_HOLES
			};
			simplePolygon.setGeoJSON(geoJsonFeature);
			expect(simplePolygon.getGeoJSON()).toEqual(GEOJSON_POLYGON_WITH_HOLES);
			const coordinatesOfGeometryInMap = CesiumEntitiesResolver.buildPolygonCoordinatesFromEntity(simplePolygon.getGeometryOnMap().getFlattedGeometries()[0].polygon);
			cesiumTestComponent.expectGeometry(simplePolygon, coordinatesOfGeometryInMap);
		});

		it("sets to geoJson which is not polygon", () => {
			createAndAddSimplePolygon();
			const geoJsonFeature: GeoJSON.Feature<GeoJSON.Geometry> = {
				type: "Feature",
				properties: {},
				geometry: GEOJSON_POLYGON
			};
			geoJsonFeature.geometry.type = "polyline";
			expect(() => {
				simplePolygon.setGeoJSON(geoJsonFeature);
			}).toThrowError();
		});
	});

	describe("containsPoint - ", () => {
		it("should return if point inside simple polygon", () => {
			createAndAddSimplePolygon();
			let pointIn: Coordinate = new Coordinate(32.23478161490659, 35.167452841706944);
			let pointOut: Coordinate = new Coordinate(33.23478161490659, 36.167452841706944);
			expect(simplePolygon.containsPoint(pointIn)).toEqual(true);
			expect(simplePolygon.containsPoint(pointOut)).toEqual(false);
		});

		it("should return false to point that in hole and true to coordinate that not in hole", () => {
			createAndAddHierarchicalPolygon();
			let pointInHole: Coordinate = new Coordinate(34.79164123535156, 31.51153564453125);
			let pointInPolygon: Coordinate = new Coordinate(34.727783203125, 31.48406982421875);
			expect(hierarchicalPolygon.containsPoint(pointInPolygon)).toEqual(true);
			expect(hierarchicalPolygon.containsPoint(pointInHole)).toEqual(false);
		});
	});

	describe("setVisibility - ", () => {
		it("sets visibility of polygon", () => {
			createAndAddSimplePolygon();
			simplePolygon.setVisibility(false);
			expect(simplePolygon.getGeometryOnMap().isShowing).toBeFalsy();
			simplePolygon.setVisibility(true);
			expect(simplePolygon.getGeometryOnMap().isShowing).toBeTruthy();
		});
	});

	describe("openBalloonHtml - ", () => {
		it("sets description of polygon", () => {
			createAndAddSimplePolygon();
			simplePolygon.openBalloonHtml("abc");
			simplePolygon.getGeometryOnMap().getFlattedGeometries().forEach(entity => {
				expect(entity.description.getValue(Cesium.JulianDate.now())).toEqual("abc");
			});
		});
	});

	describe("setDesign - ", () => {
		const waitRenderTime = async (fictiveCordinates: Coordinate[]) => {
			const fictivePoint = CesiumEntitiesCreator.createPolylineEntity(fictiveCordinates, {});
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(fictivePoint);
			await cesiumTestComponent.entityInCoordinateRendered(fictiveCordinates[0]);
			cesiumTestComponent.mapComponent.nativeMapInstance.entities.remove(fictivePoint);
		};

		beforeEach(() => {
			createAndAddSimplePolygon();
		});
		it("sets fill color of polygon", () => {
			const color = "BLUE";
			simplePolygon.setDesign({fill: {color}});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(simplePolygon.getDesign().fill.opacity);

			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];

			expect(simplePolygon.getDesign().fill.color).toBe(color);
			expect(fillGeometry.getFlattedGeometries().length).toBe(1);
			expect(fillGeometry.getFlattedGeometries()[0].polygon.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});

		it("sets fill opacity of polygon", () => {
			const opacity = 0.5;
			simplePolygon.setDesign({fill: {opacity}});

			const expectedColor = Cesium.Color.fromCssColorString(simplePolygon.getDesign().fill.color).withAlpha(opacity);
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			expect(simplePolygon.getDesign().fill.opacity).toBe(opacity);
			expect(fillGeometry.getFlattedGeometries().length).toBe(1);
			expect(fillGeometry.getFlattedGeometries()[0].polygon.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});

		it("sets fill opacity and color of polygon", () => {
			const opacity = 0.5;
			const color = "BLUE";
			simplePolygon.setDesign({fill: {opacity, color}});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			expect(simplePolygon.getDesign().fill.opacity).toBe(opacity);
			expect(simplePolygon.getDesign().fill.color).toBe(color);
			expect(fillGeometry.getFlattedGeometries().length).toBe(1);
			expect(fillGeometry.getFlattedGeometries()[0].polygon.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});

		it("sets outline color of polygon", () => {
			const color = "BLUE";
			simplePolygon.setDesign({line: {color}});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(simplePolygon.getDesign().line.opacity);
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().line.color).toBe(color);
			expect(outlineGeometry.getFlattedGeometries().length).toBe(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});
		it("sets outline opacity of polygon", () => {
			const opacity = 0.5;
			simplePolygon.setDesign({line: {opacity}});

			const expectedColor = Cesium.Color.fromCssColorString(simplePolygon.getDesign().line.color).withAlpha(opacity);
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().line.opacity).toBe(opacity);
			expect(outlineGeometry.getFlattedGeometries().length).toBe(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});
		it("sets outline color and opacity of polygon", () => {
			const opacity = 0.5;
			const color = "BLUE";
			simplePolygon.setDesign({line: {opacity, color}});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().line.opacity).toBe(opacity);
			expect(simplePolygon.getDesign().line.color).toBe(color);
			expect(outlineGeometry.getFlattedGeometries().length).toBe(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});
		it("sets outline width of polygon", () => {
			const width = 3;
			simplePolygon.setDesign({line: {width}});
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().line.width).toBe(width);
			expect(outlineGeometry.getFlattedGeometries().length).toBe(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline.width.getValue(Cesium.JulianDate.now()))
				.toEqual(width * CesiumEntitiesCreator.WIDTH_SCALAR);
		});
		it("sets both outline and fill design of polygon as solid design", () => {
			const lineOpacity = 0.3;
			const fillOpacity = 0.7;
			const width = 3;
			const lineColor = "BLUE";
			const fillColor = "GREEN";
			simplePolygon.setDesign({
				fill: {
					pattern: FillPatternName.Solid,
					opacity: fillOpacity,
					color: fillColor
				},
				line: {
					pattern: LinePatternName.Solid,
					opacity: lineOpacity,
					color: lineColor,
					width
				}
			});
			const expectedFillColor = Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity);
			const expectedOutlineColor = Cesium.Color.fromCssColorString(lineColor).withAlpha(lineOpacity);

			expect(simplePolygon.getDesign().fill.pattern).toBe(FillPatternName.Solid);
			expect(simplePolygon.getDesign().fill.color).toBe(fillColor);
			expect(simplePolygon.getDesign().fill.opacity).toBe(fillOpacity);
			expect(simplePolygon.getDesign().line.pattern).toBe(LinePatternName.Solid);
			expect(simplePolygon.getDesign().line.color).toBe(lineColor);
			expect(simplePolygon.getDesign().line.opacity).toBe(lineOpacity);
			expect(simplePolygon.getDesign().line.width).toBe(width);

			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];

			expect(outlineGeometry.getFlattedGeometries().length).toBe(1);
			expect(fillGeometry.getFlattedGeometries().length).toBe(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline.width.getValue(Cesium.JulianDate.now()))
				.toEqual(width * CesiumEntitiesCreator.WIDTH_SCALAR);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedOutlineColor);
			expect(fillGeometry.getFlattedGeometries()[0].polygon.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedFillColor);
		});
		it("sets polygon outline with pattern design of filled shapes", () => {
			const color = "BLUE";
			const opacity = 0.5;
			simplePolygon.setDesign({
				line: {
					pattern: LinePatternName.Dotted,
					color,
					opacity
				}
			});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().line.pattern).toBe(LinePatternName.Dotted);
			expect(fillGeometry.getFlattedGeometries().length).toEqual(1);
			expect(fillGeometry.getFlattedGeometries()[0].polygon).toBeDefined();
			let dotsCount = 0;
			outlineGeometry.iterateOverPolygons(polygon => {
				dotsCount++;
				expect(polygon.material.color.getValue(Cesium.JulianDate.now())).toEqual(expectedColor);
			});
			expect(dotsCount).toBeGreaterThan(1);
		});
		it("sets polygon outline with pattern design of line shapes", () => {
			const color = "BLUE";
			const opacity = 0.5;
			simplePolygon.setDesign({
				line: {
					pattern: LinePatternName.Dashed,
					color,
					opacity
				}
			});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().line.pattern).toBe(LinePatternName.Dashed);
			expect(fillGeometry.getFlattedGeometries().length).toEqual(1);
			expect(fillGeometry.getFlattedGeometries()[0].polygon).toBeDefined();
			let linesCount = 0;
			outlineGeometry.iterateOverPolylines(polyline => {
				linesCount++;
				expect(polyline.material.color.getValue(Cesium.JulianDate.now())).toEqual(expectedColor);
			});
			expect(linesCount).toBeGreaterThan(1);
		});
		it("sets polygon fill with pattern design", () => {
			const color = "BLUE";
			const opacity = 0.5;
			simplePolygon.setDesign({
				fill: {
					pattern: FillPatternName.Squares,
					color,
					opacity
				}
			});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
			const backgroundGeometry = simplePolygon.getGeometryOnMap().getGeometries()[0];
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];
			expect(simplePolygon.getDesign().fill.pattern).toBe(FillPatternName.Squares);
			expect(outlineGeometry.getFlattedGeometries().length).toEqual(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline).toBeDefined();
			expect(backgroundGeometry.getFlattedGeometries().length).toEqual(1);
			expect(backgroundGeometry.getFlattedGeometries()[0].polygon).toBeDefined();
			let linesCount = 0;
			fillGeometry.iterateOverPolylines(polyline => {
				linesCount++;
				expect(polyline.material.color.getValue(Cesium.JulianDate.now())).toEqual(expectedColor);
			});
			expect(linesCount).toBeGreaterThan(1);
		});
		it("click event inside polygon should trigger even if the pointer is in empty place between pattern design shapes", async () => {
			const coordinateInsidePolygon = new Coordinate(32.5, 35.5);
			await cesiumTestComponent.entityInCoordinateRendered(coordinateInsidePolygon);

			simplePolygon.setDesign({
				fill: {
					pattern: FillPatternName.Squares
				}
			});

			await waitRenderTime(POLY_COORDINATES);
			const screenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(coordinateInsidePolygon);
			const entity = cesiumTestComponent.mapComponent.nativeMapInstance.scene.pick(screenPosition);
			expect(entity).toBeDefined();
		});

		it("sets polygon fill with empty design", () => {
			simplePolygon.setDesign({
				fill: {
					pattern: FillPatternName.Empty
				}
			});

			const backgroundGeometry = simplePolygon.getGeometryOnMap().getGeometries()[0];
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];

			expect(simplePolygon.getDesign().fill.pattern).toBe(FillPatternName.Empty);
			expect(backgroundGeometry.getFlattedGeometries().length).toEqual(0);
			expect(fillGeometry.getFlattedGeometries().length).toEqual(0);
			expect(outlineGeometry.getFlattedGeometries().length).toEqual(1);
			expect(outlineGeometry.getFlattedGeometries()[0].polyline).toBeDefined();
		});
		it("click event inside polygon should not trigger when the fill is empty", async () => {
			const coordinateInsidePolygon = new Coordinate(32.5, 35.5);
			await cesiumTestComponent.entityInCoordinateRendered(coordinateInsidePolygon);

			simplePolygon.setDesign({
				fill: {
					pattern: FillPatternName.Empty
				}
			});

			await waitRenderTime(POLY_COORDINATES);
			const screenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(coordinateInsidePolygon);
			const entity = cesiumTestComponent.mapComponent.nativeMapInstance.scene.pick(screenPosition);
			expect(entity).toBeUndefined();


		});
		it("sets polygon fill and outline with pattern design", () => {
			const lineOpacity = 0.3;
			const fillOpacity = 0.7;
			const lineColor = "BLUE";
			const fillColor = "GREEN";
			simplePolygon.setDesign({
				fill: {
					pattern: FillPatternName.DiagonalSquares,
					opacity: fillOpacity,
					color: fillColor
				},
				line: {
					pattern: LinePatternName.Dashed,
					opacity: lineOpacity,
					color: lineColor,
				}
			});
			const expectedFillColor = Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity);
			const expectedOutlineColor = Cesium.Color.fromCssColorString(lineColor).withAlpha(lineOpacity);

			const backgroundGeometry = simplePolygon.getGeometryOnMap().getGeometries()[0];
			const fillGeometry = simplePolygon.getGeometryOnMap().getGeometries()[1];
			const outlineGeometry = simplePolygon.getGeometryOnMap().getGeometries()[2];

			expect(simplePolygon.getDesign().fill.pattern).toBe(FillPatternName.DiagonalSquares);
			expect(simplePolygon.getDesign().fill.color).toBe(fillColor);
			expect(simplePolygon.getDesign().fill.opacity).toBe(fillOpacity);
			expect(simplePolygon.getDesign().line.pattern).toBe(LinePatternName.Dashed);
			expect(simplePolygon.getDesign().line.color).toBe(lineColor);
			expect(simplePolygon.getDesign().line.opacity).toBe(lineOpacity);

			expect(backgroundGeometry.getFlattedGeometries().length).toEqual(1);
			expect(backgroundGeometry.getFlattedGeometries()[0].polygon).toBeDefined();

			let fillLinesCount = 0;
			fillGeometry.iterateOverPolylines(polyline => {
				fillLinesCount++;
				expect(polyline.material.color.getValue(Cesium.JulianDate.now())).toEqual(expectedFillColor);
			});
			expect(fillLinesCount).toBeGreaterThan(1);

			let outlineLinesCount = 0;
			outlineGeometry.iterateOverPolylines(polyline => {
				outlineLinesCount++;
				expect(polyline.material.color.getValue(Cesium.JulianDate.now())).toEqual(expectedOutlineColor);
			});
			expect(outlineLinesCount).toBeGreaterThan(1);
		});

		it("setDesign should save design", () => {
			simplePolygon.setDesign(NON_DEFAULT_DESIGN);
			expect(NON_DEFAULT_DESIGN)
				.toEqual(CesiumEntitiesResolver.extractSavedDesign(simplePolygon.getGeometryOnMap().getFlattedGeometries()[0]));
		});
	});

	describe("setId - ", () => {
		it("sets id of polygon", () => {
			createAndAddSimplePolygon();
			expect(simplePolygon.getId()).toBeDefined();
			simplePolygon.setId(DEFAULT_GEOMETRY_ID);
			expect(simplePolygon.getId()).toEqual(DEFAULT_GEOMETRY_ID);
			expect(simplePolygon.getGeometryOnMap().id).toEqual(DEFAULT_GEOMETRY_ID);
		});
	});

	describe("edit polygon", () => {
		beforeEach(() => {
			createAndAddSimplePolygon();
		});
		it("hides the polygon at the start of the edit", () => {
			let token: IActionToken = {};
			simplePolygon.edit(token);
			expect(simplePolygon.getVisibility()).toBeFalsy();
		});

		it("shows the polygon on finish edit action", () => {
			let token: IActionToken = {};
			simplePolygon.edit(token);
			token.finish();
			expect(simplePolygon.getVisibility()).toBeTruthy();
		});

		it("shows the polygon on cancel edit action", () => {
			let token: IActionToken = {};
			simplePolygon.edit(token);
			token.cancel();
			expect(simplePolygon.getVisibility()).toBeTruthy();
		});

		describe("on vertex drag", () => {
			let eventSimulator: EventSimulator;
			let token: IActionToken;
			let draggedVertexScreenPosition: Cesium.Cartesian2;
			const dragOffset = 100;

			beforeEach(async () => {
				eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
				token = {};
				const polygonCoordinates = simplePolygon.getCoordinates() as Coordinate[];
				const vertexCoordinateToBeDragged: Coordinate = polygonCoordinates[0];

				simplePolygon.edit(token);
				draggedVertexScreenPosition = await cesiumTestComponent.entityInCoordinateRendered(vertexCoordinateToBeDragged);
			});

			afterEach(() => {
				eventSimulator = null;
			});

			it("should change the polygon when the user drags a line's vertex", async () => {
				const destinationDragPosition = new Cesium.Cartesian2(draggedVertexScreenPosition.x + dragOffset, draggedVertexScreenPosition.y + dragOffset);
				eventSimulator.simulateDrag(draggedVertexScreenPosition.x, draggedVertexScreenPosition.y, destinationDragPosition.x, destinationDragPosition.y);
				token.finish();
				const actualUpdatedCoordinateOfGeometry = simplePolygon.getCoordinates()[0] as Coordinate;
				const expectedUpdatedCoordinate = cesiumTestComponent.mapComponent.utils.toCoordinateFromScreenPosition(destinationDragPosition);

				cesiumTestComponent.expectCoordinateToBeCloseToCoordinate(actualUpdatedCoordinateOfGeometry, expectedUpdatedCoordinate);

				const polygonEntity = (simplePolygon.getGeometryOnMap() as CesiumMultiGeometry).getFlattedGeometries()[0].polygon;
				const positionOfDraggedPoint = polygonEntity.hierarchy.getValue(Cesium.JulianDate.now()).positions[0];
				const actualUpdatedCoordinateOfGeometryOnMap = CesiumUtilities.toCoordinateFromCartesian(positionOfDraggedPoint);
				cesiumTestComponent.expectCoordinateToBeCloseToCoordinate(actualUpdatedCoordinateOfGeometryOnMap, expectedUpdatedCoordinate);
			});
		});
	});
});