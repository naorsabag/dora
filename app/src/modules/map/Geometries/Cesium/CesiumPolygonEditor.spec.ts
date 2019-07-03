import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { POLY_COORDINATES } from "../../../../test/TestConsts";
import { Coordinate } from "../Coordinate";
import { CesiumPolygonEditor } from "./CesiumPolygonEditor";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Polygon Editor Service", () => {

	let cesiumTestComponent: CesiumTestComponent;

	let cesiumPolygonEditor: CesiumPolygonEditor;
	let polygon: Cesium.Entity;
	const shellCoordinates = [...POLY_COORDINATES, POLY_COORDINATES[0]];
	const holesCoordinates = [
		new Coordinate(32.25, 35.25, 0),
		new Coordinate(32.75, 35.25, 0),
		new Coordinate(32.75, 35.75, 0),
		new Coordinate(32.25, 35.75, 0),
		new Coordinate(32.25, 35.25, 0)
	];

	const createAndAddSimplePolygon = () => {
		createAndAddPolygon(shellCoordinates);
	};
	const createAndAddPolygonWithHoles = () => {
		const coordinates = [shellCoordinates, holesCoordinates];
		createAndAddPolygon(coordinates);
	};
	const createAndAddPolygon = (coordinates: Coordinate[] | Coordinate[][]) => {
		polygon = CesiumEntitiesCreator.createPolygonEntity(coordinates, {});
		cesiumTestComponent.mapComponent.nativeMapInstance.entities.add(polygon);
	};

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();


		cesiumPolygonEditor = new CesiumPolygonEditor(cesiumTestComponent.mapComponent);
	});

	afterEach(() => {
		if (cesiumTestComponent.mapComponent && !cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			cesiumPolygonEditor = null;
			polygon = null;
		}
	});

	describe("- enable edit polygon", () => {
		describe("- add edit lines", () => {
			it("- should add line for the shell in simple polygon", () => {
			});
			it("- should add lines for the shell and hole in polygon with holes", () => {
			});
		});
		describe("- drag points", () => {
			it("- should polygon be changeable when dragging edit point and not changeable when finish", () => {
			});
			it("- should polygon positions be changed when shell line is edited", () => {
			});
			it("- should polygon positions be changed when hole line is edited", () => {
			});
			it("- should polygon positions be changed when shell line is edited after hole editing", () => {
			});
			it("- should polygon positions be changed when hole line is edited after shell editing", () => {
			});
		});
		describe("- finish edit mode", () => {
			it("- should remove edit lines and edit points", () => {
			});
			it("- should polygon positions be constant", () => {
			});
			it("- should cancel edit points events", () => {
			});
		});
	});

});