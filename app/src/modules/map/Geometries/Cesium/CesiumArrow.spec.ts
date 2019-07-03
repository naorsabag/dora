import { ArrowType } from "../../../../dora-common";
import { ArrowGeometryDesign } from "../../GeometryDesign/ArrowGeometryDesign";
import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { DEFAULT_GEOMETRY_DESIGN, DEFAULT_GEOMETRY_ID, POLY_COORDINATES } from "../../../../test/TestConsts";
import { Coordinate } from "../Coordinate";
import { CesiumArrow } from "./CesiumArrow";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium arrow", () => {
	let arrow: CesiumArrow;
	let cesiumTestComponent: CesiumTestComponent;
	let arrowId: string = "arrowId";
	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({ mapDivId: "map" });
		await cesiumTestComponent.initMapComponent();
		arrow = new CesiumArrow(cesiumTestComponent.mapComponent, POLY_COORDINATES, DEFAULT_GEOMETRY_DESIGN, arrowId);
		arrow.addToMap();
	});

	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			arrow = null;
		}
	});

	it("creates arrow", () => {
		expect(arrow).toBeDefined();
	});

	describe("check the amount of polylines by arrow type", () => {
		it("regular arrow", () => {
			const regularArrowDesign: ArrowGeometryDesign = new ArrowGeometryDesign({ arrow: { type: ArrowType.Regular } });
			arrow = new CesiumArrow(cesiumTestComponent.mapComponent, POLY_COORDINATES, regularArrowDesign);
			arrow.addToMap();
			expect(arrow.getGeometryOnMap().getGeometries().length).toEqual(2);
		});
		it("wide arrow", () => {
			const wideArrowDesign: ArrowGeometryDesign = new ArrowGeometryDesign({ arrow: { type: ArrowType.Wide } });
			arrow = new CesiumArrow(cesiumTestComponent.mapComponent, POLY_COORDINATES, wideArrowDesign);
			arrow.addToMap();
			expect(arrow.getGeometryOnMap().getGeometries().length).toEqual(3);
		});
		it("expanded arrow", () => {
			const expandedArrowDesign: ArrowGeometryDesign = new ArrowGeometryDesign({ arrow: { type: ArrowType.Expanded } });
			arrow = new CesiumArrow(cesiumTestComponent.mapComponent, POLY_COORDINATES, expandedArrowDesign);
			arrow.addToMap();
			expect(arrow.getGeometryOnMap().getGeometries().length).toEqual(3);
		});
	});

	it("adds arrow to map", () => {
		arrow
			.getGeometryOnMap()
			.getGeometries()
			.forEach(entity => {
				expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.contains(entity)).toBeTruthy();
			});
	});

	it("removes arrow from map", () => {
		const entitiesIds: string[] = arrow
			.getGeometryOnMap()
			.getGeometries()
			.map(entity => entity.id);
		arrow.remove();
		entitiesIds.forEach(id => expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.getById(id)).toBeUndefined());
		expect(arrow.getGeometryOnMap()).toBeNull();
	});

	it("has the right coordinates", () => {
		arrow.getCoordinates().forEach((coordinate: Coordinate, i: number) => {
			expect(coordinate).toEqual(POLY_COORDINATES[i]);
		});
	});

	describe("sets visibility", () => {
		let setVisibilitySpy;
		beforeEach(() => {
			setVisibilitySpy = spyOn(arrow.getGeometryOnMap(), "setVisibility").and.callThrough();
		});

		it("show", () => {
			arrow.setVisibility(true);
			expect(setVisibilitySpy).toHaveBeenCalledWith(true);
			expect(arrow["visible"]).toBeTruthy();
			expect(arrow.getGeometryOnMap().isShowing).toBeTruthy();
		});

		it("hide", () => {
			arrow.setVisibility(false);
			expect(setVisibilitySpy).toHaveBeenCalledWith(false);
			expect(arrow["visible"]).toBeFalsy();
			expect(arrow.getGeometryOnMap().isShowing).toBeFalsy();
		});
	});

	it("sets description", () => {
		arrow.openBalloonHtml("abc");
		expect(
			arrow
				.getGeometryOnMap()
				.getGeometries()[0]
				.description.getValue()
		).toEqual("abc");
	});

	it("sets line color", () => {
		const color = "BLUE";
		arrow.setDesign({ line: { color } });
		arrow
			.getGeometryOnMap()
			.getGeometries()
			.forEach(entity => {
				expect(entity.polyline.material.color.getValue()).toEqual(new Cesium.Color.fromCssColorString("BLUE"));
			});
	});

	it("sets line opacity", () => {
		const opacity: number = 0.2;
		arrow.setDesign({ line: { opacity } });
		arrow
			.getGeometryOnMap()
			.getGeometries()
			.forEach(entity => {
				expect(entity.polyline.material.color.getValue().alpha).toEqual(opacity);
			});
	});

	it("sets line width", () => {
		const width: number = 5;
		arrow.setDesign({ line: { width } });
		arrow
			.getGeometryOnMap()
			.getGeometries()
			.forEach(entity => {
				expect(entity.polyline.width.getValue()).toEqual(width * CesiumEntitiesCreator.WIDTH_SCALAR);
			});
	});

	it("sets id", () => {
		expect(arrow.getId()).toEqual(arrowId);
		arrow.setId(DEFAULT_GEOMETRY_ID);
		expect(arrow.getId()).toEqual(DEFAULT_GEOMETRY_ID);
		expect(arrow.getGeometryOnMap().id).toEqual(DEFAULT_GEOMETRY_ID);
	});
});
