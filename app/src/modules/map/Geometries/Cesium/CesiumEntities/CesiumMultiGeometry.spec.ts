import { POLY_COORDINATES } from "../../../../../test/TestConsts";
import { CesiumTestComponent } from "../../../../../test/CesiumTestComponent";
import { CesiumMultiGeometry } from "./CesiumMultiGeometry";
import { CesiumEntitiesCreator } from "./CesiumEntitiesCreator";
import { CesiumLayer } from "../../../Layers/CesiumLayer";
import { EventSimulator } from "../../../../../test/EventSimulator";

const Cesium = require("cesium/Source/Cesium");

describe("Cesium Multi Geometry", () => {
	const fakeId = "123";
	let multiGeometry: CesiumMultiGeometry = null;
	let geometries1: Cesium.Entity[];
	let geometries2: (Cesium.Entity | CesiumMultiGeometry)[];
	let cesiumTestComponent: CesiumTestComponent;

	const createMultipleEntities = (): Cesium.Entity[] => {
		const polyline = CesiumEntitiesCreator.createPolylineEntity(POLY_COORDINATES, {});
		const polygon = CesiumEntitiesCreator.createPolygonEntity(POLY_COORDINATES, {});
		const point = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});

		return [polyline, polygon, point];
	};

	const createSimpleMultiGeometry = (): CesiumMultiGeometry => {
		geometries1 = createMultipleEntities();
		return new CesiumMultiGeometry(cesiumTestComponent.mapComponent, fakeId, geometries1);
	};

	const createTwoLevelMultiGeometry = (): CesiumMultiGeometry => {
		const simpleMultiGeometry = createSimpleMultiGeometry();
		const geometries = createMultipleEntities();
		geometries2 = [simpleMultiGeometry, ...geometries];
		return new CesiumMultiGeometry(cesiumTestComponent.mapComponent, fakeId, geometries2);
	};

	const createLayer = () => {
		const dataSources = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources;
		const dataSourcesLengthBeforeAddingLayer = dataSources.length;
		const layer = new CesiumLayer(cesiumTestComponent.mapComponent);
		layer.show();
		const layerEntitiesCollection = dataSources.get(dataSourcesLengthBeforeAddingLayer).entities.values;

		return {layer, layerEntitiesCollection};
	};

	beforeEach(async () => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		await cesiumTestComponent.initMapComponent();
	});

	afterEach(() => {
		if (cesiumTestComponent.mapComponent && !cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
			multiGeometry = null;
			geometries1 = null;
			geometries2 = null;
		}
	});

	describe("- constructor", () => {
		it("- multi geometry should be not defined and throw error when create without map component", () => {
			expect(() => {
				multiGeometry = new CesiumMultiGeometry(null);
			}).toThrowError("mapComponent param didn't supplied");
			expect(multiGeometry).toBeNull();
		});
		it("- multi geometry should be not defined and throw error when create with invalid map component", () => {
			expect(() => {
				multiGeometry = new CesiumMultiGeometry("mapComponent" as any);
			}).toThrowError("mapComponent param didn't supplied");
			expect(multiGeometry).toBeNull();
		});
		it("- multi geometry should be defined when create without data", () => {
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			expect(multiGeometry).toBeDefined();
			expect(multiGeometry.getGeometries()).toEqual([]);
			expect(multiGeometry.id).toBeUndefined();
		});

		it("- multi geometry should be defined with id when create with id only", () => {
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent, fakeId);
			expect(multiGeometry).toBeDefined();
			expect(multiGeometry.getGeometries()).toEqual([]);
			expect(multiGeometry.id).toBe(fakeId);
		});

		it("- multi geometry should be defined with entities when create one level multi geometry", () => {
			multiGeometry = createSimpleMultiGeometry();
			expect(multiGeometry).toBeDefined();
			multiGeometry.getGeometries().forEach((geometry, index) => {
				expect(geometry.id).toEqual(geometries1[index].id);
			});
			expect(multiGeometry.id).toBe(fakeId);
		});

		it("- multi geometry should be defined with entities when create two level multi geometry", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			expect(multiGeometry).toBeDefined();
			multiGeometry.getGeometries().forEach((geometry, index) => {
				expect(geometry.id).toEqual(geometries2[index].id);
			});
			expect(multiGeometry.id).toBe(fakeId);
		});
	});

	describe("- getGeometries", () => {
		it("- should return all the direct child geometries", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.getGeometries().forEach((geometry, index) => {
				expect(geometry.id).toEqual(geometries2[index].id);
			});
			expect(multiGeometry.getGeometries().length).toBe(4);
		});
		it("- should return copy of the child geometries", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const geometries = multiGeometry.getGeometries();
			const geometry = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			geometries.push(geometry);
			expect(multiGeometry.getGeometries()).not.toContain(geometry);
			expect(multiGeometry.getGeometries().length).not.toEqual(geometries.length);
		});
	});
	describe("- getFlattedGeometries", () => {
		it("- should return all multi level leaf child native geometries which are not multi geometries containers", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.getFlattedGeometries().forEach(geometry => {
				expect(geometry.propertyNames).toBeDefined(); // propertyNames is a property that defined for each cesium entity
			});
			expect(multiGeometry.getFlattedGeometries().length).toBe(6);
		});
		it("- should return copy of the child native geometries", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const geometries = multiGeometry.getFlattedGeometries();
			const geometry = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			geometries.push(geometry);
			expect(multiGeometry.getFlattedGeometries()).not.toContain(geometry);
			expect(multiGeometry.getFlattedGeometries().length).not.toEqual(geometries.length);
		});
	});
	describe("- appendGeometries", () => {
		it("- should add geometries to empty multi geometry container", () => {
			const geometries = createMultipleEntities();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.appendGeometries(geometries);
			expect(multiGeometry.getGeometries().length).toBe(geometries.length);
		});
		it("- should add geometries to multi geometry container with children", () => {
			multiGeometry = createSimpleMultiGeometry();
			const countBefore = multiGeometry.getGeometries().length;
			const geometries = createMultipleEntities();
			multiGeometry.appendGeometries(geometries);
			expect(multiGeometry.getGeometries().length).toBe(geometries.length + countBefore);
		});
		it("- should add geometries that contain multi-geometries to multi geometry container", () => {
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			const multiGeometriesToAdd = [createSimpleMultiGeometry(), createSimpleMultiGeometry()];
			const geometries = createMultipleEntities();
			multiGeometry.appendGeometries([...geometries, ...multiGeometriesToAdd]);
			expect(multiGeometry.getGeometries().length).toBe(geometries.length + multiGeometriesToAdd.length);
		});
		it("- should add geometries to multi geometry which is added to map before", () => {
			const geometries = createMultipleEntities();
			const childMultiGeometry = createSimpleMultiGeometry();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.addToMap();
			multiGeometry.appendGeometries([...geometries, childMultiGeometry]);
			multiGeometry.getFlattedGeometries().forEach((entity =>
				entity.entityCollection === cesiumTestComponent.mapComponent.nativeMapInstance.entities)
			);
		});
		it("- should add geometries to multi geometry which is added to layer before", () => {
			const geometries = createMultipleEntities();
			const childMultiGeometry = createSimpleMultiGeometry();
			const dataSources = cesiumTestComponent.mapComponent.nativeMapInstance.dataSources;
			const dataSourcesLengthBeforeAddingLayer = dataSources.length;
			const layer = new CesiumLayer(cesiumTestComponent.mapComponent);
			layer.show();
			const layerEntitiesCollection = dataSources.get(dataSourcesLengthBeforeAddingLayer).entities;

			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.addToLayer(layer);
			multiGeometry.appendGeometries([...geometries, childMultiGeometry]);
			multiGeometry.getFlattedGeometries().forEach(entity =>
				expect(layerEntitiesCollection.values).toContain(entity)
			);
		});
		it("- should add geometries to hidden multi geometry", () => {
			const geometries = createMultipleEntities();
			const childMultiGeometry = createSimpleMultiGeometry();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.setVisibility(false);
			multiGeometry.appendGeometries([...geometries, childMultiGeometry]);
			multiGeometry.getFlattedGeometries().forEach(entity => expect(entity.isShowing).toBeFalsy());
		});
	});
	describe("- appendGeometry", () => {
		it("- should add geometry to empty multi geometry container", () => {
			const geometry = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.appendGeometry(geometry);
			expect(multiGeometry.getGeometries().length).toBe(1);
			expect(multiGeometry.getGeometries()).toContain(geometry);
		});
		it("- should add geometry to multi geometry container with children", () => {
			multiGeometry = createSimpleMultiGeometry();
			const countBefore = multiGeometry.getGeometries().length;
			const geometry = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			multiGeometry.appendGeometry(geometry);
			expect(multiGeometry.getGeometries().length).toBe(1 + countBefore);
			expect(multiGeometry.getGeometries()).toContain(geometry);
		});
		it("- should add multi geometry to multi geometry container", () => {
			const geometry = createSimpleMultiGeometry();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.appendGeometry(geometry);
			expect(multiGeometry.getGeometries().length).toBe(1);
			expect(multiGeometry.getFlattedGeometries().length).toBe(geometry.getGeometries().length);
		});

		it("- should add geometry to multi geometry which is added to map before", () => {
			const geometry = createSimpleMultiGeometry();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.addToMap();
			multiGeometry.appendGeometry(geometry);
			multiGeometry.getFlattedGeometries().forEach((entity =>
				entity.entityCollection === cesiumTestComponent.mapComponent.nativeMapInstance.entities)
			);
		});
		it("- should add geometry to multi geometry which is added to layer before", () => {
			const geometry = createSimpleMultiGeometry();
			const {layer, layerEntitiesCollection} = createLayer();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.addToLayer(layer);
			multiGeometry.appendGeometry(geometry);

			multiGeometry.getFlattedGeometries().forEach(entity =>
				expect(layerEntitiesCollection).toContain(entity)
			);
		});
		it("- should add geometry to hidden multi geometry", () => {
			const geometry = createSimpleMultiGeometry();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			multiGeometry.setVisibility(false);
			multiGeometry.appendGeometry(geometry);
			multiGeometry.getFlattedGeometries().forEach(entity => expect(entity.isShowing).toBeFalsy());
			expect(geometry.isShowing).toBeFalsy();
		});
		it("- should add geometry to multi geometry with event", () => {
			const addEventListenerSpy = spyOn(cesiumTestComponent.mapComponent.utils, "addEntityMouseEvent");
			const geometry: Cesium.Entity = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			const listener = () => {
			};
			multiGeometry.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener});
			multiGeometry.appendGeometry(geometry);
			expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
			expect(addEventListenerSpy).toHaveBeenCalledWith(listener, Cesium.ScreenSpaceEventType.LEFT_CLICK, geometry);
		});
		it("- should add multi geometry as child to multi geometry with event", () => {
			const addEventListenerSpy = spyOn(cesiumTestComponent.mapComponent.utils, "addEntityMouseEvent");
			const geometry: CesiumMultiGeometry = createSimpleMultiGeometry();
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			const listener = () => {
			};
			multiGeometry.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener});
			multiGeometry.appendGeometry(geometry);
			expect(addEventListenerSpy).toHaveBeenCalledTimes(geometry.getFlattedGeometries().length);
		});
	});
	describe("- removeGeometry", () => {
		it("- should remove simple geometry from multi geometry which has only this geometry", () => {
			const geometry: Cesium.Entity  = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent, "", [geometry]);
			multiGeometry.removeGeometry(geometry);
			expect(multiGeometry.getGeometries()).toEqual([]);
		});
		it("- should remove simple geometry from multi geometry with more than one geometries", () => {
			multiGeometry = createSimpleMultiGeometry();
			const geometry = geometries1[0];
			multiGeometry.removeGeometry(geometry);
			expect(multiGeometry.getGeometries().length).toEqual(geometries1.length - 1);
			expect(multiGeometry.getGeometries()).not.toContain(geometry);
		});
		it("- should do nothing when the geometry is not contained in the multi geometry container", () => {
			multiGeometry = createSimpleMultiGeometry();
			const geometry = CesiumEntitiesCreator.createPointEntity(POLY_COORDINATES[0], {});
			expect(multiGeometry.getGeometries()).not.toContain(geometry);
			multiGeometry.removeGeometry(geometry);
			expect(multiGeometry.getGeometries()).toEqual(geometries1);
		});
		it("- should remove multi geometry from multi geometry container", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const geometry = multiGeometry.getGeometries()[0];
			multiGeometry.removeGeometry(geometry);
			expect(multiGeometry.getGeometries()).toEqual(geometries2.slice(1));
		});
		it("- should remove simple geometry from map when multi geometry container is added to map", () => {
			multiGeometry = createSimpleMultiGeometry();
			multiGeometry.addToMap();
			const geometry = multiGeometry.getFlattedGeometries()[0];
			const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values;
			const entitiesOnMapCountBeforeRemove = entities.length;
			multiGeometry.removeGeometry(geometry);
			expect(entities).not.toContain(geometry);
			expect(entities.length).toBe(entitiesOnMapCountBeforeRemove - 1);
		});
		it("- should remove child multi geometry from map when multi geometry container is added to map", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.addToMap();

			const entities = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values;
			const entitiesOnMapCountBeforeRemove = entities.length;
			const multiGeometryChild = multiGeometry.getGeometries()[0] as CesiumMultiGeometry;
			multiGeometry.removeGeometry(multiGeometryChild);
			multiGeometryChild.getFlattedGeometries().forEach(entity =>
				expect(entities).not.toContain(entity)
			);
			expect(entities.length).toBe(entitiesOnMapCountBeforeRemove - multiGeometryChild.getFlattedGeometries().length);
		});
		it("- should remove geometry from layer when multi geometry container is added to layer", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const {layer, layerEntitiesCollection} = createLayer();
			multiGeometry.addToLayer(layer);
			const layerEntitiesOnMapCountBeforeRemove = layerEntitiesCollection.length;

			const multiGeometryChild = multiGeometry.getGeometries()[0] as CesiumMultiGeometry;
			multiGeometry.removeGeometry(multiGeometryChild);

			multiGeometryChild.getFlattedGeometries().forEach(entity =>
				expect(layerEntitiesCollection).not.toContain(entity)
			);
			expect(layerEntitiesCollection.length).toBe(layerEntitiesOnMapCountBeforeRemove - multiGeometryChild.getFlattedGeometries().length);
		});

		it("- should remove events of geometry when geometry is removed", () => {
			const removeEventSpy = spyOn(Cesium.ScreenSpaceEventHandler.prototype, "destroy");
			multiGeometry = createTwoLevelMultiGeometry();
			const singleGeometryChild: Cesium.Entity = multiGeometry.getGeometries()[1] as Cesium.Entity;

			multiGeometry.addMouseEvent({
				eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK,
				listener: () => {
				}
			});
			multiGeometry.removeGeometry(singleGeometryChild);

			expect(removeEventSpy).toHaveBeenCalledTimes(1);
		});
		it("- should remove events of child geometries (level 2) when multi-geometry child is removed", () => {
			const removeEventSpy = spyOn(Cesium.ScreenSpaceEventHandler.prototype, "destroy");
			multiGeometry = createTwoLevelMultiGeometry();
			const multiGeometryChild: CesiumMultiGeometry = multiGeometry.getGeometries()[0] as CesiumMultiGeometry;
			const geometriesAmountOfMultiGeometryChild = multiGeometryChild.getFlattedGeometries().length;
			multiGeometry.addMouseEvent({
				eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK,
				listener: () => {
				}
			});
			multiGeometry.removeGeometry(multiGeometryChild);

			expect(removeEventSpy).toHaveBeenCalledTimes(geometriesAmountOfMultiGeometryChild);
		});
	});
	describe("- cleanMultiGeometry", () => {
		it("- should do nothing when the multi geometry container is empty", () => {
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent);
			expect(multiGeometry.getGeometries().length).toEqual(0);
			multiGeometry.cleanMultiGeometry();
			expect(multiGeometry.getGeometries().length).toEqual(0);
		});
		it("- should remove all the geometries from multi geometry container with simple geometries", () => {
			multiGeometry = createSimpleMultiGeometry();
			const geometries = multiGeometry.getGeometries();
			multiGeometry.cleanMultiGeometry();
			expect(multiGeometry.getGeometries().length).toEqual(0);
			geometries.forEach(geometry =>
				expect(multiGeometry.getGeometries()).not.toContain(geometry)
			);
		});
		it("- should remove all the geometries from multi geometry container with multi level geometries", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const geometries = multiGeometry.getGeometries();
			multiGeometry.cleanMultiGeometry();
			expect(multiGeometry.getGeometries().length).toEqual(0);
			geometries.forEach(geometry =>
				expect(multiGeometry.getGeometries()).not.toContain(geometry)
			);
		});
		it("- should remove all the geometries from map when geometry container is added to map", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.addToMap();
			const entitiesOnMap = cesiumTestComponent.mapComponent.nativeMapInstance.entities.values;

			expect(entitiesOnMap.length).toBeGreaterThan(0);
			multiGeometry.cleanMultiGeometry();
			expect(entitiesOnMap.length).toEqual(0);
		});
		it("- should remove all the geometries from layer when geometry container is added to layer", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const {layer, layerEntitiesCollection} = createLayer();
			multiGeometry.addToLayer(layer);
			expect(layerEntitiesCollection.length).toBeGreaterThan(0);
			multiGeometry.cleanMultiGeometry();
			expect(layerEntitiesCollection.length).toEqual(0);
		});
		it("- should remove all events of geometries when multi geometry is cleaned", () => {
			const removeEventSpy = spyOn(Cesium.ScreenSpaceEventHandler.prototype, "destroy");
			multiGeometry = createTwoLevelMultiGeometry();
			const geometriesAmount: number = multiGeometry.getFlattedGeometries().length;

			multiGeometry.addMouseEvent({
				eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK,
				listener: () => {
				}
			});
			multiGeometry.cleanMultiGeometry();

			expect(removeEventSpy).toHaveBeenCalledTimes(geometriesAmount);
		});
	});
	describe("- removeFromMap", () => {
		it("- should remove all sub geometries from map", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.addToMap();
			multiGeometry.removeFromMap();
			multiGeometry.getFlattedGeometries().forEach((entity) =>
				expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).not.toContain(entity)
			);
		});
	});
	describe("- addToMap", () => {
		it("- should add all sub geometries to map", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.addToMap();
			multiGeometry.getFlattedGeometries().forEach((entity) =>
				expect(cesiumTestComponent.mapComponent.nativeMapInstance.entities.values).toContain(entity)
			);
		});
	});
	describe("- removeFromLayer", () => {
		it("- should remove all sub geometries from layer", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const {layer, layerEntitiesCollection} = createLayer();
			multiGeometry.addToLayer(layer);
			multiGeometry.removeFromLayer(layer);
			multiGeometry.getFlattedGeometries().forEach((entity) =>
				expect(layerEntitiesCollection).not.toContain(entity)
			);
		});
		it("- should remove all sub geometries from one layer only", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const layer1 = createLayer();
			const layer2 = createLayer();
			multiGeometry.addToLayer(layer1.layer);
			multiGeometry.addToLayer(layer2.layer);
			multiGeometry.removeFromLayer(layer1.layer);
			multiGeometry.getFlattedGeometries().forEach((entity) =>
				expect(layer1.layerEntitiesCollection).not.toContain(entity)
			);
		});
	});
	describe("- addToLayer", () => {
		it("- should add all sub geometries to layer", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const {layer, layerEntitiesCollection} = createLayer();
			multiGeometry.addToLayer(layer);
			multiGeometry.getFlattedGeometries().forEach((entity) =>
				expect(layerEntitiesCollection).toContain(entity)
			);
		});
		it("- should add all sub geometries to two layers", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const layer1 = createLayer();
			const layer2 = createLayer();
			multiGeometry.addToLayer(layer1.layer);
			multiGeometry.addToLayer(layer2.layer);
			multiGeometry.getFlattedGeometries().forEach((entity) => {
				expect(layer1.layerEntitiesCollection).toContain(entity);
				expect(layer2.layerEntitiesCollection).toContain(entity);
			});
		});
	});
	describe("- setVisibility", () => {
		it("should hide all sub geometries", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.setVisibility(false);
			multiGeometry.getFlattedGeometries().forEach((entity) => {
				expect(entity.isShowing).toBeFalsy();
			});
			expect(multiGeometry.isShowing).toBeFalsy();
			// multi-geometry child
			expect(multiGeometry.getGeometries()[0].isShowing).toBeFalsy();
		});
		it("should show all sub geometries by default", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.getFlattedGeometries().forEach((entity) => {
				expect(entity.isShowing).toBeTruthy();
			});
			expect(multiGeometry.isShowing).toBeTruthy();
			// multi-geometry child
			expect(multiGeometry.getGeometries()[0].isShowing).toBeTruthy();
		});
		it("should show all sub geometries after hide and show again", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			multiGeometry.setVisibility(false);
			multiGeometry.setVisibility(true);
			multiGeometry.getFlattedGeometries().forEach((entity) => {
				expect(entity.isShowing).toBeTruthy();
			});
			expect(multiGeometry.isShowing).toBeTruthy();
			// multi-geometry child
			expect(multiGeometry.getGeometries()[0].isShowing).toBeTruthy();
		});
	});
	describe("- iterateOverPolygons", () => {
		it("should iterate over polygons only", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			let polygonsCount = 0;
			multiGeometry.iterateOverPolygons((polygon) => {
				polygonsCount++;
				expect(polygon).toBeDefined();
				expect(polygon.hierarchy).toBeDefined();
			});
			expect(polygonsCount).toEqual(2);
		});
	});
	describe("- iterateOverPolylines", () => {
		it("should iterate over polylines only", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			let polylinesCount = 0;
			multiGeometry.iterateOverPolylines((polyline) => {
				polylinesCount++;
				expect(polyline).toBeDefined();
				expect(polyline.positions).toBeDefined();
			});
			expect(polylinesCount).toEqual(2);
		});
	});
	describe("- iterateOverPoints", () => {
		it("should iterate over points only", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			let pointsCount = 0;
			multiGeometry.iterateOverPoints((pointEntity) => {
				pointsCount++;
				expect(pointEntity).toBeDefined();
				expect(pointEntity.billboard).toBeDefined();
				expect(pointEntity.position).toBeDefined();
			});
			expect(pointsCount).toEqual(2);
		});
	});
	describe("- setFillColor", () => {
		it("- should set the fill color of all polygons to blue", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const color = "blue";
			const oldColorsAlpha: number[] = [];
			multiGeometry.iterateOverPolygons(polygon => {
				const colorOfPolygon = ((polygon.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				oldColorsAlpha.push(colorOfPolygon.alpha);
			});
			multiGeometry.setFillColor(color);
			multiGeometry.iterateOverPolygons(polygon => {
				const oldAlpha = oldColorsAlpha.shift();
				const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(oldAlpha);
				const actualColor = ((polygon.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				expect(actualColor).toEqual(expectedColor);
			});
		});
	});
	describe("- setFillOpacity", () => {
		it("- should set the fill opacity of all polygons to transparent", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const opacity = 0;
			const oldColors: Cesium.Color[] = [];
			multiGeometry.iterateOverPolygons(polygon => {
				const colorOfPolygon = ((polygon.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				oldColors.push(colorOfPolygon);
			});
			multiGeometry.setFillOpacity(opacity);
			multiGeometry.iterateOverPolygons(polygon => {
				const oldcolor = oldColors.shift();
				const expectedColor = oldcolor.withAlpha(opacity);
				const actualColor = ((polygon.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				expect(actualColor).toEqual(expectedColor);
			});
		});
	});
	describe("- setLineColor", () => {
		it("- should set the line color of all polylines to blue", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const color = "blue";
			const oldColorsAlpha: number[] = [];
			multiGeometry.iterateOverPolylines(polyline => {
				const colorOfPolygon = ((polyline.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				oldColorsAlpha.push(colorOfPolygon.alpha);
			});
			multiGeometry.setLineColor(color);
			multiGeometry.iterateOverPolylines(polyline => {
				const oldAlpha = oldColorsAlpha.shift();
				const expectedColor = Cesium.Color.fromCssColorString(color).withAlpha(oldAlpha);
				const actualColor = ((polyline.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				expect(actualColor).toEqual(expectedColor);
			});
		});
	});
	describe("- setLineOpacity", () => {

		it("- should set the line opacity of all polylines to transparent", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const opacity = 0;
			const oldColors: Cesium.Color[] = [];
			multiGeometry.iterateOverPolylines(polyline => {
				const colorOfPolygon = ((polyline.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				oldColors.push(colorOfPolygon);
			});
			multiGeometry.setLineOpacity(opacity);
			multiGeometry.iterateOverPolylines(polyline => {
				const oldcolor = oldColors.shift();
				const expectedColor = oldcolor.withAlpha(opacity);
				const actualColor = ((polyline.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				expect(actualColor).toEqual(expectedColor);
			});
		});
	});
	describe("- setLineWidth", () => {

		it("- should set the line width of all polylines to 3", () => {
			multiGeometry = createTwoLevelMultiGeometry();
			const width = 3;
			multiGeometry.setLineWidth(width);
			multiGeometry.iterateOverPolylines(polyline => {
				const actualWidth = (polyline.width as any as Cesium.Property).getValue(Cesium.JulianDate.now());
				expect(actualWidth).toEqual(width * CesiumEntitiesCreator.WIDTH_SCALAR);
			});
		});
	});
	describe("- addMouseEvent", () => {
		let eventSimulator: EventSimulator;
		const simulateEvents = () => {
			POLY_COORDINATES.forEach(coordinate => {
				cesiumTestComponent.entityInCoordinateRendered(coordinate)
					.then((screenPosition: Cesium.Cartesian2) =>
						eventSimulator.simulateLeftClick(screenPosition.x, screenPosition.y)
					)
					.catch(() => {
							throw `the entity in coordinate ${coordinate.longitude}/${coordinate.latitude} wasn't rendered`;
						}
					);
			});
		};

		beforeEach(() => {
			eventSimulator = new EventSimulator(cesiumTestComponent.mapComponent.nativeMapInstance.scene.canvas);
			const points = POLY_COORDINATES.map(coordinate => CesiumEntitiesCreator.createPointEntity(coordinate, {}));
			multiGeometry = new CesiumMultiGeometry(cesiumTestComponent.mapComponent, "", points);
			multiGeometry.addToMap();
		});

		it("- listeners of all sub geometries should be invoked on left click", (done) => {
			let listenerCount = 0;
			const cancelEvent = multiGeometry.addMouseEvent({
				eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener: (eventArgs) => {
					const entity = cesiumTestComponent.mapComponent.utils.pickNativeEntity(eventArgs);
					expect(entity).toBe(multiGeometry.getFlattedGeometries()[listenerCount]);
					expect(eventArgs.longitude).toBeCloseTo(POLY_COORDINATES[listenerCount].longitude, 1);
					expect(eventArgs.latitude).toBeCloseTo(POLY_COORDINATES[listenerCount].latitude, 1);
					listenerCount++;

					if (listenerCount === POLY_COORDINATES.length) {
						cancelEvent();
						done();
					}
				}
			});

			simulateEvents();
		});
		it("- listeners of all sub geometries should not be invoked on left click after canceling", (done) => {
			const cancelEvent = multiGeometry.addMouseEvent({
				eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener: () => {
					throw "should not get here after cancel";
				}
			});
			cancelEvent();

			simulateEvents();

			setTimeout(done, 1000);
		});
		it("- canceling mouse event remove the event from all sub entities", () => {
			const removeEventSpy = spyOn(Cesium.ScreenSpaceEventHandler.prototype, "destroy");
			const cancelEvent = multiGeometry.addMouseEvent({
				eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener: () => {
				}
			});
			cancelEvent();
			expect(removeEventSpy).toHaveBeenCalledTimes(POLY_COORDINATES.length);
		});

	});


});