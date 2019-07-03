import { CesiumLayer } from "../../../Layers/CesiumLayer";
import { CesiumMapComponent } from "../../../Components/CesiumMapComponent";
import { CesiumUtilities } from "../../../MapUtils/CesiumUtilities";
import { GeometryEvent } from "../GeometryEvent";

const Cesium = require("cesium/Source/Cesium");

/**
 * Represent multi geometry (multi leveled) in cesium, with methods that will apply to all sub entities.
 * Today cesium doesn't support multi entity, so this class supposed to answer this use case
 */
export class CesiumMultiGeometry {
	/**
	 * is multi geometry in show state, when true, the map is shown when it added to map or to shown layer
	 * @type {boolean}
	 */
	public isShowing: boolean = true;
	private entities: (Cesium.Entity | CesiumMultiGeometry)[] = [];
	private isAddedToMap: boolean = false;
	private addedToLayers: CesiumLayer[] = [];
	private attachedEvents: GeometryEvent[] = [];
	private cancelEventsFnOfDirectEntities: Map<Cesium.Entity, Map<GeometryEvent, () => void>> = new Map();

	private entitiesCollection: Cesium.EntityCollection;
	private cesiumUtils: CesiumUtilities;

	constructor(mapComponent: CesiumMapComponent,
		public id?: string,
		entities: (Cesium.Entity | CesiumMultiGeometry)[] = []) {
		if (!mapComponent || !(mapComponent instanceof CesiumMapComponent)) {
			throw new Error("mapComponent param didn't supplied");
		}
		this.entitiesCollection = mapComponent.nativeMapInstance.entities;
		this.cesiumUtils = mapComponent.utils;
		this.appendGeometries(entities);
	}

	/**
	 * get a copy array of the direct geometries children
	 * @return {(Cesium.Entity | CesiumMultiGeometry)[]} the direct children. children can be also multi geometry in multi level multi geometries
	 */
	public getGeometries(): (Cesium.Entity | CesiumMultiGeometry)[] {
		return this.entities.slice();
	}

	/**
	 * get a copy array of all geometries children which are native cesium entities
	 * @return {Cesium.Entity[]} all geometries children
	 */
	public getFlattedGeometries(): Cesium.Entity[] {
		const entities: Cesium.Entity[] = [];
		this.iterateOverEntities(entity => entities.push(entity));
		return entities;
	}

	/**
	 * append list of geometries to the multi geometry container. when the container is already added to map or layer,
	 * all the new geometries will be added too
	 * @param {(Cesium.Entity | CesiumMultiGeometry)[]} entities
	 */
	public appendGeometries(entities: (Cesium.Entity | CesiumMultiGeometry)[]): void {
		entities.forEach(entity => this.appendGeometry(entity));
	}

	/**
	 * append geometry to the multi geometry container. when the container is already added to map or layer,
	 * the new geometry will be added too
	 * @param {Cesium.Entity | CesiumMultiGeometry} entity
	 */
	public appendGeometry(entity: Cesium.Entity | CesiumMultiGeometry): void {
		this.entities.push(entity);
		this.addEntityOrMultiGeometryToMapAndLayers(entity);
	}

	/**
	 * remove geometry from the multi geometry container. when the container is already added to map or layer,
	 * the geometry will be removed from map or layer.
	 * @param {Cesium.Entity | CesiumMultiGeometry} entity
	 */
	public removeGeometry(entity: Cesium.Entity | CesiumMultiGeometry): void {
		if (this.entities.indexOf(entity) !== -1) {
			this.removeEntityOrMultiGeometryFromMapAndLayers(entity);
			this.entities = this.entities.filter(currEntity => currEntity !== entity);
		}
	}

	/**
	 * remove all the geometries from the multi geometry container and leave it empty.
	 * when the container is already added to map or layer, all geomtries will be removed too
	 */
	public cleanMultiGeometry(): void {
		this.entities.forEach(entityOrMulti => this.removeEntityOrMultiGeometryFromMapAndLayers(entityOrMulti));
		this.entities = [];
	}

	/**
	 * remove the multi geometry from map. all it's sub entities will be removed.
	 */
	public removeFromMap(): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			this.removeEntityFromMap(entity);
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.removeFromMap();
		});
		this.isAddedToMap = false;
	}

	/**
	 * add the multi geometry to map. all it's sub entities will be added.
	 */
	public addToMap(): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			this.addEntityToMap(entity);
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.addToMap();
		});
		this.isAddedToMap = true;
	}

	/**
	 * remove the multi geometry from specific layer. all it's sub entities will be removed from layer.
	 * @param {CesiumLayer} layer
	 */
	public removeFromLayer(layer: CesiumLayer): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			this.removeEntityFromLayer(layer, entity);
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.removeFromLayer(layer);
		});
		this.addedToLayers = this.addedToLayers.filter(l => l !== layer);
	}

	/**
	 * add the multi geometry to specific layer. all it's sub entities will be added to layer.
	 * @param {CesiumLayer} layer
	 */
	public addToLayer(layer: CesiumLayer): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			this.addEntityToLayer(layer, entity);
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.addToLayer(layer);
		});

		this.addedToLayers.push(layer);
	}

	/**
	 * hide or show the entity. in show state the geometries will be shown only if the multi geometry is added to map or shown layer
	 * @param {boolean} state true represents show, and false hide
	 */
	public setVisibility(state: boolean): void {
		if (state) {
			this.show();
		}
		else {
			this.hide();
		}
	}

	/**
	 * call a callback function for all sub geometries which are polygons
	 * @param {(polygon: Cesium.PolygonGraphics) => void} callback
	 */
	public iterateOverPolygons(callback: (polygon: Cesium.PolygonGraphics) => void): void {
		this.iterateOverEntities(entity => entity.polygon && callback(entity.polygon));
	}

	/**
	 * call a callback function for all sub geometries which are polylines
	 * @param {(polyline: Cesium.PolylineGraphics) => void} callback
	 */
	public iterateOverPolylines(callback: (polyline: Cesium.PolylineGraphics) => void): void {
		this.iterateOverEntities(entity => entity.polyline && callback(entity.polyline));
	}

	/**
	 * call a callback function for all sub geometries which are points
	 * @param {(entity: Cesium.Entity) => void} callback
	 */
	public iterateOverPoints(callback: (entity: Cesium.Entity) => void): void {
		this.iterateOverEntities(entity => entity.position && entity.billboard && callback(entity));
	}

	/**
	 * set the fill color for all sub polygons in multi geometry
	 * @param {string} color css color
	 */
	public setFillColor(color: string): void {
		const newColor = Cesium.Color.fromCssColorString(color);
		this.iterateOverPolygons(polygon => {
			this.cesiumUtils.setMaterialColorRGBOnly(polygon.material as Cesium.ColorMaterialProperty, newColor);
		});
	}

	/**
	 * set the fill opacity for all sub polygons in multi geometry
	 * @param {number} opacity number between 0 to 1
	 */
	public setFillOpacity(opacity: number): void {
		this.iterateOverPolygons(polygon => {
			this.cesiumUtils.setMaterialOpacity(polygon.material as Cesium.ColorMaterialProperty, opacity);
		});
	}

	/**
	 * set the line color for all sub polylines in multi geometry
	 * @param {string} color css color
	 */
	public setLineColor(color: string): void {
		const newColor = Cesium.Color.fromCssColorString(color);
		this.iterateOverPolylines(polyline => {
			this.cesiumUtils.setMaterialColorRGBOnly(polyline.material as Cesium.ColorMaterialProperty, newColor);
		});
	}

	/**
	 * set the line opacity for all sub polylines in multi geometry
	 * @param {number} opacity
	 */
	public setLineOpacity(opacity: number): void {
		this.iterateOverPolylines(polyline => {
			this.cesiumUtils.setMaterialOpacity(polyline.material as Cesium.ColorMaterialProperty, opacity);
		});
	}

	/**
	 * set the line width for all sub polylines in multi geometry
	 * @param {number} width
	 */
	public setLineWidth(width: number): void {
		this.iterateOverPolylines(polyline =>
			this.cesiumUtils.setLineWidth(polyline, width));
	}

	/**
	 * register to mouse event
	 * @param {GeometryEvent} event
	 * @return {() => void} cancel register event function
	 */
	public addMouseEvent(event: GeometryEvent): () => void {
		this.attachedEvents.push(event);

		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			this.attachEventToEntity(entity, event);
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.addMouseEvent(event);
		});


		return () => {
			this.removeMouseEvent(event);
		};
	}

	private removeMouseEvent(event: GeometryEvent): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			const cancelEventsOfEntity: Map<GeometryEvent, () => void> = this.cancelEventsFnOfDirectEntities.get(entity);
			cancelEventsOfEntity.get(event)();
			cancelEventsOfEntity.delete(event);
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.removeMouseEvent(event);
		});
		this.attachedEvents = this.attachedEvents.filter(currEvent => currEvent !== event);
	}

	private show(): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			entity.show = true;
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.show();
		});
		this.isShowing = true;
	}

	private hide(): void {
		this.iterateOverDirectChildren((entity: Cesium.Entity) => {
			entity.show = false;
		}, (multiGeometry: CesiumMultiGeometry) => {
			multiGeometry.hide();
		});
		this.isShowing = false;
	}

	private removeEntityFromMapAndLayers(entity: Cesium.Entity): void {
		if (this.isAddedToMap) {
			this.removeEntityFromMap(entity);
		}
		this.addedToLayers.forEach((layer) => this.removeEntityFromLayer(layer, entity));

		this.removeEntityEvents(entity);
	}

	private removeMultiGeometryFromMapAndLayers(multiGeometry: CesiumMultiGeometry): void {
		multiGeometry.iterateOverDirectChildren((entity: Cesium.Entity) => {
			multiGeometry.removeEntityFromMapAndLayers(entity);
		}, (multiChild: CesiumMultiGeometry) => {
			multiGeometry.removeMultiGeometryFromMapAndLayers(multiChild);
		});
		multiGeometry.isShowing = false;
		multiGeometry.isAddedToMap = false;
		multiGeometry.addedToLayers = [];
		multiGeometry.attachedEvents = [];
	}

	private removeEntityOrMultiGeometryFromMapAndLayers(entityOrMulti: Cesium.Entity | CesiumMultiGeometry): void {
		if (entityOrMulti instanceof CesiumMultiGeometry) {
			this.removeMultiGeometryFromMapAndLayers(entityOrMulti);
		} else {
			this.removeEntityFromMapAndLayers(entityOrMulti);
		}
	}

	private addEntityToMapAndLayers(entity: Cesium.Entity) {
		if (this.isAddedToMap) {
			this.addEntityToMap(entity);
		}
		this.addedToLayers.forEach((layer) => this.addEntityToLayer(layer, entity));
		entity.show = this.isShowing;

		this.cancelEventsFnOfDirectEntities.set(entity, new Map());

		this.attachedEvents.forEach(event => {
			this.attachEventToEntity(entity, event);
		});
	}

	private addMultiGeometryToMapAndLayers(multiGeometry: CesiumMultiGeometry) {
		multiGeometry.isShowing = this.isShowing;
		multiGeometry.isAddedToMap = this.isAddedToMap;
		multiGeometry.addedToLayers = this.addedToLayers.slice(0);
		multiGeometry.attachedEvents = this.attachedEvents.slice(0);
		multiGeometry.iterateOverDirectChildren((entity: Cesium.Entity) => {
			multiGeometry.addEntityToMapAndLayers(entity);
		}, (multiChild: CesiumMultiGeometry) => {
			multiGeometry.addMultiGeometryToMapAndLayers(multiChild);
		});
	}

	private addEntityOrMultiGeometryToMapAndLayers(entityOrMulti: Cesium.Entity | CesiumMultiGeometry): void {
		if (entityOrMulti instanceof CesiumMultiGeometry) {
			this.addMultiGeometryToMapAndLayers(entityOrMulti);
		} else {
			this.addEntityToMapAndLayers(entityOrMulti);
		}
	}

	private removeEntityEvents(entity: Cesium.Entity) {
		const cancelEventsOfEntity = this.cancelEventsFnOfDirectEntities.get(entity);
		if (cancelEventsOfEntity) {
			cancelEventsOfEntity.forEach(cancelFn => cancelFn());
			this.cancelEventsFnOfDirectEntities.delete(entity);
		}
	}

	private attachEventToEntity(entity: Cesium.Entity, event: GeometryEvent) {
		const cancelEventsOfEntity = this.cancelEventsFnOfDirectEntities.get(entity);
		if (!cancelEventsOfEntity.has(event)) {
			const cancelFn = this.cesiumUtils.addEntityMouseEvent(event.listener, event.eventType, entity);
			cancelEventsOfEntity.set(event, cancelFn);
		}
	}

	private addEntityToMap(entity: Cesium.Entity): void {
		if (!this.entitiesCollection.contains(entity)) {
			this.entitiesCollection.add(entity);
		}
	}

	private removeEntityFromMap(entity: Cesium.Entity): void {
		this.entitiesCollection.removeById(entity.id);
	}

	private addEntityToLayer(layer: CesiumLayer, entity: Cesium.Entity): void {
		layer.addEntity(entity);
	}

	private removeEntityFromLayer(layer: CesiumLayer, entity: Cesium.Entity): void {
		layer.removeEntity(entity);
	}

	private iterateOverEntities(callback: (entity: Cesium.Entity) => void): void {
		this.entities.forEach((entity: Cesium.Entity | CesiumMultiGeometry) => {
			if (entity instanceof CesiumMultiGeometry) {
				entity.iterateOverEntities(callback);
			}
			else {
				callback(entity);
			}
		});
	}

	private iterateOverDirectChildren(callbackForEntity: (entity: Cesium.Entity) => void, callbackForMultiGeometry: (multiGeometry: CesiumMultiGeometry) => void): void {
		this.entities.forEach((entity: Cesium.Entity | CesiumMultiGeometry) => {
			if (entity instanceof CesiumMultiGeometry) {
				callbackForMultiGeometry(entity);
			}
			else {
				callbackForEntity(entity);
			}
		});
	}
}