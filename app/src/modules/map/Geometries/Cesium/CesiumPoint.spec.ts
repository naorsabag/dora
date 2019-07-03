import { CesiumPoint } from "./CesiumPoint";
import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import {
	DEFAULT_GEOMETRY_DESIGN,
	DEFAULT_GEOMETRY_ID,
	NON_DEFAULT_DESIGN,
	POLY_COORDINATES
} from "../../../../test/TestConsts";
import { Coordinate } from "../Coordinate";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { GeometryDesign } from "../../GeometryDesign/GeometryDesign";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium point", () => {
	let point: CesiumPoint;
	let cesiumTestComponent: CesiumTestComponent;
	let pointId: string = "pointId";
	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();
		point = new CesiumPoint(cesiumTestComponent.mapComponent, POLY_COORDINATES[0], DEFAULT_GEOMETRY_DESIGN, pointId);
		point.addToMap();
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			point = null;
		}
	});

	it("creates point", () => {
		expect(point).toBeDefined();
	});

	it("should save design", () => {
		expect(DEFAULT_GEOMETRY_DESIGN as IGeometryDesign)
			.toEqual(CesiumEntitiesResolver.extractSavedDesign(point.getGeometryOnMap()));

		let pointWithNonDefaultDesign: CesiumPoint = new CesiumPoint(cesiumTestComponent.mapComponent,
			POLY_COORDINATES[1], NON_DEFAULT_DESIGN, "non_default");
		pointWithNonDefaultDesign.addToMap();

		expect(NON_DEFAULT_DESIGN)
			.toEqual(CesiumEntitiesResolver.extractSavedDesign(pointWithNonDefaultDesign.getGeometryOnMap()));
	});

	it("setDesign should save design", () => {
		point.setDesign(NON_DEFAULT_DESIGN);
		expect(NON_DEFAULT_DESIGN)
			.toEqual(CesiumEntitiesResolver.extractSavedDesign(point.getGeometryOnMap()));
	});

	it("adds point to map", () => {
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.contains(point.getGeometryOnMap())).toBeTruthy();
	});

	it("removes point from map", () => {
		point.remove();
		expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.getById(pointId)).toBeUndefined();
		expect(point.getGeometryOnMap()).toBeNull();
	});

	it("has the right coordinates", () => {
		let coordinate: Coordinate = point.getCoordinate();
		expect(coordinate.longitude).toEqual(POLY_COORDINATES[0].longitude);
		expect(coordinate.latitude).toEqual(POLY_COORDINATES[0].latitude);
	});

	it("sets visibility", () => {
		point.setVisibility(false);
		expect(point.getGeometryOnMap().show).toBeFalsy();
		point.setVisibility(true);
		expect(point.getGeometryOnMap().show).toBeTruthy();
	});

	it("sets description", () => {
		point.openBalloonHtml("abc");
		expect(point.getGeometryOnMap().description.getValue()).toEqual("abc");
	});

	it("sets label", () => {
		point.setLabel("ABC");
		expect(point.getGeometryOnMap().label.text.getValue()).toEqual("ABC");
		point.setLabel("ABC DEF");
		expect(point.getGeometryOnMap().label.text.getValue()).toEqual("ABC DEF");
		point.setLabel("!!!! !!!!!");
		expect(point.getGeometryOnMap().label.text.getValue()).toEqual("!!!! !!!!!");
		point.setLabel("Abc !!!!");
		expect(point.getGeometryOnMap().label.text.getValue()).toEqual("Abc !!!!");
	});

	it("get label", () => {
		expect(point.getLabel()).toEqual(null);
		point.setLabel("ABC");
		expect(point.getLabel()).toEqual("ABC");
		point.setLabel("ABC DEF");
		expect(point.getLabel()).toEqual("ABC DEF");
		point.setLabel("!!!! !!!!!");
		expect(point.getLabel()).toEqual("!!!! !!!!!");
		point.setLabel("Abc !!!!");
		expect(point.getLabel()).toEqual("Abc !!!!");

	});

	it("sets coordinate", () => {
		point.setCoordinate(POLY_COORDINATES[1]);
		expect(point.getCoordinate()).toEqual(POLY_COORDINATES[1]);
	});

	it("sets fill color", () => {
		point.setDesign({fill: {color: "BLUE"}});
		expect(point.getGeometryOnMap().billboard.color.getValue(Cesium.JulianDate.now()))
			.toEqual(Cesium.Color.BLUE.withAlpha(point.getDesign().fill.opacity));
	});

	it("sets id", () => {
		expect(point.getId()).toBeDefined();
		point.setId(DEFAULT_GEOMETRY_ID);
		expect(point.getId()).toEqual(DEFAULT_GEOMETRY_ID);
		expect(point.getGeometryOnMap().id).toEqual(DEFAULT_GEOMETRY_ID);
	});

	it("should mark point", () => {
		let markedPointDesign: IGeometryDesign = new GeometryDesign(JSON.parse(JSON.stringify(DEFAULT_GEOMETRY_DESIGN)));
		markedPointDesign.fill.color = "#5ec4ff";
		markedPointDesign.line.color = "#5ec4ff";

		point.mark();

		expect(markedPointDesign)
			.toEqual(CesiumEntitiesResolver.extractSavedDesign(point.getGeometryOnMap()));
	});

	it("should unmark point", () => {
		point.mark();
		point.unMark();
		expect(DEFAULT_GEOMETRY_DESIGN as IGeometryDesign)
			.toEqual(CesiumEntitiesResolver.extractSavedDesign(point.getGeometryOnMap()));
	});
});