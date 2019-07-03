import { CesiumLine } from "./CesiumLine";
import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import {
	DEFAULT_GEOMETRY_DESIGN,
	DEFAULT_GEOMETRY_ID,
	NON_DEFAULT_DESIGN,
	POLY_COORDINATES
} from "../../../../test/TestConsts";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { IActionToken } from "../../Common/IActionToken";
import { EventSimulator } from "../../../../test/EventSimulator";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { GEOMETRY_TYPES } from "../GeometryTypes";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { Coordinate } from "../Coordinate";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium line", () => {
	let line: CesiumLine;
	let cesiumTestComponent: CesiumTestComponent;
	let lineId: string = "lineId";

	beforeEach(async (done) => {
		cesiumTestComponent = new CesiumTestComponent({ mapDivId: "map" });
		await cesiumTestComponent.initMapComponent();

		line = new CesiumLine(cesiumTestComponent.mapComponent, POLY_COORDINATES, DEFAULT_GEOMETRY_DESIGN, lineId);
		line.addToMap();
		done();
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			line = null;
		}
	});
	describe("- constructor", () => {
		it("- should creates line", () => {
			expect(line).toBeDefined();
		});

		it("- should save design", () => {
			expect(DEFAULT_GEOMETRY_DESIGN as IGeometryDesign)
				.toEqual(CesiumEntitiesResolver.extractSavedDesign(line.getGeometryOnMap().getFlattedGeometries()[0]));

			let lineWithNonDefaultDesign: CesiumLine = new CesiumLine(cesiumTestComponent.mapComponent,
				POLY_COORDINATES, NON_DEFAULT_DESIGN, "non_default");
			lineWithNonDefaultDesign.addToMap();

			expect(NON_DEFAULT_DESIGN)
				.toEqual(CesiumEntitiesResolver.extractSavedDesign(lineWithNonDefaultDesign.getGeometryOnMap().getFlattedGeometries()[0]));
		});
	});

	describe("- geometryType", () => {
		it("- should has the correct type of line", () => {
			expect(line.geometryType).toBe(GEOMETRY_TYPES.LINE);
		});
	});


	describe("- addToMap", () => {
		it("- should line be in the map", () => {
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).toContain(line.getGeometryOnMap().getFlattedGeometries()[0]);
		});
	});

	describe("- remove", () => {
		it("- should removes line from map", () => {
			const geometry = line.getGeometryOnMap().getFlattedGeometries()[0];
			line.remove();
			expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).not.toContain(geometry);
			expect(line.getGeometryOnMap()).toBeNull();
		});
	});

	describe("- getCoordinates", () => {
		it("- should has the right coordinates", () => {
			cesiumTestComponent.expectGeometry(line, POLY_COORDINATES);
		});
	});


	describe("- setVisibility", () => {
		it("- should hide the line and show it", () => {
			line.setVisibility(false);
			expect(line.getGeometryOnMap().isShowing).toBeFalsy();
			line.setVisibility(true);
			expect(line.getGeometryOnMap().isShowing).toBeTruthy();
		});
	});

	describe("- openBalloonHtml", () => {
		it("- should set the description of all sub entities", () => {
			line.openBalloonHtml("abc");
			line.getGeometryOnMap().getFlattedGeometries().forEach(entity => {
				expect(entity.description.getValue(Cesium.JulianDate.now())).toEqual("abc");
			});
		});
	});
	describe("- setDesign", () => {
		it("- should change the line color", () => {
			const color = "BLUE";
			line.setDesign({line: {color}});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(line.getDesign().line.opacity);

			expect(line.getDesign().line.color).toBe(color);
			expect(line.getGeometryOnMap().getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});
		it("- should change the line opacity", () => {
			const opacity = 0.5;
			line.setDesign({line: {opacity}});

			const expectedColor = Cesium.Color.fromCssColorString(line.getDesign().line.color).withAlpha(opacity);
			expect(line.getDesign().line.opacity).toBe(opacity);
			expect(line.getGeometryOnMap().getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});
		it("- should change the line color and opacity", () => {
			const opacity = 0.5;
			const color = "BLUE";
			line.setDesign({line: {opacity, color}});
			const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
			expect(line.getDesign().line.opacity).toBe(opacity);
			expect(line.getDesign().line.color).toBe(color);
			expect(line.getGeometryOnMap().getFlattedGeometries()[0].polyline.material.color.getValue(Cesium.JulianDate.now()))
				.toEqual(expectedColor);
		});
		it("- should change the line width", () => {
			const width = 3;
			line.setDesign({line: {width}});
			expect(line.getDesign().line.width).toBe(width);
			expect(line.getGeometryOnMap().getFlattedGeometries()[0].polyline.width.getValue(Cesium.JulianDate.now()))
				.toEqual(width * CesiumEntitiesCreator.WIDTH_SCALAR);
		});

		it("- should save design when setting design", () => {
			line.setDesign(NON_DEFAULT_DESIGN);
			expect(NON_DEFAULT_DESIGN)
				.toEqual(CesiumEntitiesResolver.extractSavedDesign(line.getGeometryOnMap().getFlattedGeometries()[0]));
		});
	});
	describe("- setId", () => {
		it("- should change the id of the object and geometry", () => {
			expect(line.getId()).toBeDefined();
			line.setId(DEFAULT_GEOMETRY_ID);
			expect(line.getId()).toEqual(DEFAULT_GEOMETRY_ID);
			expect(line.getGeometryOnMap().id).toEqual(DEFAULT_GEOMETRY_ID);
		});
	});

	describe("edit line", () => {
		it("hides the line at the start of the edit", () => {
			let token: IActionToken = {};
			line.edit(token);
			expect(line.getVisibility()).toBeFalsy();
		});

		it("shows the line on finish edit action", () => {
			let token: IActionToken = {};
			line.edit(token);
			token.finish();
			expect(line.getVisibility()).toBeTruthy();
		});

		it("shows the line on cancel edit action", () => {
			let token: IActionToken = {};
			line.edit(token);
			token.cancel();
			expect(line.getVisibility()).toBeTruthy();
		});

		describe("on vertex drag", () => {
			let eventSimulator: EventSimulator;
			let token: IActionToken;
			let vertexSourceScreenPosition: Cesium.Cartesian2;
			let lineCoordinates: Coordinate[];
			const dragOffset = 100;

			beforeEach(async () => {
				eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
				token = {};
				lineCoordinates = line.getCoordinates();
				const vertexCoordinates = lineCoordinates[0];

				line.edit(token);
				vertexSourceScreenPosition = await cesiumTestComponent.entityInCoordinateRendered(vertexCoordinates);
			});

			afterEach(() => {
				eventSimulator = null;
			});

			it("should change the line when the user drags a line's vertex", async (done) => {

				// act
				cesiumTestComponent.mapComponent.utils.setCameraMotionState(false);
				eventSimulator.simulateDrag(vertexSourceScreenPosition.x, vertexSourceScreenPosition.y, vertexSourceScreenPosition.x + dragOffset, vertexSourceScreenPosition.y + dragOffset);
				await cesiumTestComponent.waitRenderTime();

				// assert
				const updatedCoordinates = line.getGeometryOnMap().getFlattedGeometries()[0].polyline.positions.getValue(Cesium.JulianDate.now());
				const updatedCoordinate = CesiumUtilities.toCoordinateFromCartesian(updatedCoordinates[0]);
				const updatedScreenPosition = cesiumTestComponent.mapComponent.utils.toScreenPosFromCoordinate(updatedCoordinate);

				const expectedScreenPosition = new Cesium.Cartesian2(vertexSourceScreenPosition.x + dragOffset, vertexSourceScreenPosition.y + dragOffset);
				expect(updatedScreenPosition.x).toBeCloseTo(expectedScreenPosition.x, -1);
				expect(updatedScreenPosition.y).toBeCloseTo(expectedScreenPosition.y, -1);

				token.finish();
				done();
			});
		});
	});

});
