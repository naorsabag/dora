import { CesiumMapComponent } from "../Components/CesiumMapComponent";
import { MapEventArgs } from "../Events/MapEventArgs";
import { Coordinate } from "../Geometries/Coordinate";
import { Geometry } from "../Geometries/Geometry";
import { IUtilities } from "./IUtilities";
import { Cartesian2, Entity } from "cesium";
import { CesiumEntitiesCreator } from "../Geometries/Cesium/CesiumEntities/CesiumEntitiesCreator";
import { CesiumEntitiesResolver } from "../Geometries/Cesium/CesiumEntities/CesiumEntitiesResolver";
import { GeometryStateData } from "../Geometries/Cesium/GeometryStateData";

const Cesium = require("cesium/Source/Cesium");

export class CesiumUtilities implements IUtilities {
	private lastPos: { x: number, y: number };

	constructor(private mapComponent: CesiumMapComponent) {
	}

	public static toCartesianFromCoordinate(coordinate: Coordinate): Cesium.Cartesian3 {
		return Cesium.Cartesian3.fromDegrees(coordinate.longitude, coordinate.latitude, coordinate.altitude);
	}

	public static toCartesianArrayFromCoordinates(coordinates: Coordinate[]): Cesium.Cartesian3[] {
		return coordinates.map(coord => this.toCartesianFromCoordinate(coord));
	}

	public static toCartesianFromCoordinatesRings(coordsRings: Coordinate[][]): Cesium.Cartesian3[][] {
		return coordsRings.map(ring =>
			this.toCartesianArrayFromCoordinates(ring)
		);
	}

	public static toCoordinateFromCartesian(cartesian: Cesium.Cartesian3): Coordinate {
		return this.toCoordinateFromCartographic(
			Cesium.Cartographic.fromCartesian(cartesian)
		);
	}

	public static toCoordinateFromCartographic(cartographic: Cesium.Cartographic): Coordinate {
		return new Coordinate(Cesium.Math.toDegrees(cartographic.latitude),
			Cesium.Math.toDegrees(cartographic.longitude),
			cartographic.height);
	}

	private static getPositionByEventType(eventType: number, movement: any): any {
		switch (eventType) {
			case Cesium.ScreenSpaceEventType.MOUSE_MOVE: {
				return {
					start: movement.startPosition,
					end: movement.endPosition
				};
			}
			default: {
				return movement.position;
			}
		}
	}

	public isSameEntities(entityA, entityB): boolean {
		return (Cesium.defined(entityA) &&
			Cesium.defined(entityA) &&
			entityA === entityB);
	}

	/**
	 * Searches a geometry object by the event position
	 * @param eventArgs the map event
	 * @returns {Geometry} the geometry object
	 */
	public pickEntity(eventArgs: MapEventArgs): Geometry {
		let nativeEntity = this.pickNativeEntity(eventArgs);
		return nativeEntity ? this.mapComponent.geometryBuilder.buildFromNativeEntity(nativeEntity) : null;
	}

	/**
	 * Searches a native entity by the event position
	 * @param eventArgs the map event
	 * @returns {Entity} the native entity
	 */
	public pickNativeEntity(eventArgs: MapEventArgs): Entity {
		let entity = this.mapComponent.nativeMapInstance.scene.pick({
			x: eventArgs.clientX,
			y: eventArgs.clientY
		} as Cartesian2);
		return entity && entity.id;
	}

	public pickEntities(eventArgs: MapEventArgs, maxEntities?: number): Geometry[] {
		let entities: any[] = this.mapComponent.nativeMapInstance.scene.drillPick(new Cesium.Cartesian2(eventArgs.clientX, eventArgs.clientY), maxEntities);
		let geometries: Geometry[] = [];
		for (let entity of entities) {
			if (entity.id) {
				geometries.push(this.mapComponent.geometryBuilder.buildFromNativeEntity(entity.id));
			}
		}
		return geometries;
	}

	public entitiesAmountInPositionGreaterThan(eventArgs: MapEventArgs, num: number): boolean {
		if (num < 0) {
			return true;
		}

		let entity = this.pickNativeEntity(eventArgs);
		if (!entity) {
			return false;
		}
		else if (num === 0) {
			return true;
		}

		let entities: any[] =
			this.mapComponent.nativeMapInstance.scene.drillPick(new Cesium.Cartesian2(eventArgs.clientX, eventArgs.clientY), num + 1) || [];
		return entities.length > num;
	}

	public addEntityMouseEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void {
		return this.onMouseEvent(eventType,
			(eventArgs: MapEventArgs) => {
				let pickedEntity = this.pickNativeEntity(eventArgs);
				if (this.isSameEntities(pickedEntity, entity)) {
					entity.hover = true;
					listener(eventArgs);
				}
			});
	}

	public addEntityMouseOutEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void {
		return this.onMouseEvent(eventType,
			(eventArgs: MapEventArgs) => {
				let pickedEntity = this.pickNativeEntity(eventArgs);
				if ((!this.isSameEntities(pickedEntity, entity)) && entity.hover) {
					entity.hover = false;
					listener(eventArgs);
				}
			});
	}

	/**
	 * Attaches a map mouse event
	 * @param eventType
	 * @param listener
	 * @returns {() => void} destroy function
	 */
	public onMouseEvent(eventType: number, listener: (eventArgs?: MapEventArgs) => void): () => void {
		const handler = new Cesium.ScreenSpaceEventHandler(this.mapComponent.nativeMapInstance.scene.canvas as HTMLCanvasElement);
		this.mouseEventWithKeyboard(handler, eventType, undefined, listener);
		this.mouseEventWithKeyboard(handler, eventType, Cesium.KeyboardEventModifier.ALT, listener);
		this.mouseEventWithKeyboard(handler, eventType, Cesium.KeyboardEventModifier.CTRL, listener);
		this.mouseEventWithKeyboard(handler, eventType, Cesium.KeyboardEventModifier.SHIFT, listener);

		return () => handler.destroy();
	}

	public toCartesianFromMousePosition(pos: Cesium.Cartesian2): Cesium.Cartesian3 {
		let cartesian;
		if (!this.mapComponent.getIs2D()) {
			let ray = this.mapComponent.nativeMapInstance.camera.getPickRay(pos);
			cartesian = this.mapComponent.nativeMapInstance.scene.globe.pick(ray, this.mapComponent.nativeMapInstance.scene);
		} else {
			cartesian = this.mapComponent.nativeMapInstance.camera.pickEllipsoid(pos, this.mapComponent.nativeMapInstance.scene.globe.ellipsoid);
		}
		return cartesian;
	}

	/**
	 * converts coordinate to screen position
	 * @param {Coordinate} coordinate
	 * @return {Cesium.Cartesian2} screen position
	 */
	public toScreenPosFromCoordinate(coordinate: Coordinate): Cesium.Cartesian2 {
		return Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.mapComponent.nativeMapInstance.scene, Cesium.Cartesian3.fromDegrees(coordinate.longitude, coordinate.latitude));
	}

	/**
	 * converts screen position to coordinate
	 * @param {Cesium.Cartesian2} pos screen position
	 * @return {Coordinate} coordinate
	 */
	public toCoordinateFromScreenPosition(pos: Cesium.Cartesian2): Coordinate {
		const cartesian = this.toCartesianFromMousePosition(pos);
		return CesiumUtilities.toCoordinateFromCartesian(cartesian);
	}

	/**
	 * disable/enable controlling the camera position based on mouse input
	 * @param {boolean} state false for disable and true for enable
	 */
	public setCameraMotionState(state: boolean) {
		this.mapComponent.nativeMapInstance.scene.screenSpaceCameraController.enableInputs = state;
	}

	/**
	 * render the map
	 */
	public requestRender() {
		this.mapComponent.nativeMapInstance.scene.requestRender();
	}

	/**
	 * sets the material object of geometry to new color without overriding the old alpha
	 * @param {Cesium.ColorMaterialProperty} material the design object of geometry
	 * @param {Cesium.Color} newColor the new color to set
	 */
	public setMaterialColorRGBOnly(material: Cesium.ColorMaterialProperty, newColor: Cesium.Color): void {
		const oldColor = this.getMaterialColor(material as Cesium.ColorMaterialProperty);
		newColor.alpha = oldColor.alpha;
		this.setMaterialColor(material as Cesium.ColorMaterialProperty, newColor);
	}

	/**
	 * sets the material object of geometry with new opacity without overriding the old color
	 * @param {Cesium.ColorMaterialProperty} material the design object of geometry
	 * @param {number} opacity number between 0 to 1
	 */
	public setMaterialOpacity(material: Cesium.ColorMaterialProperty, opacity: number): void {
		const color = this.getMaterialColor(material as Cesium.ColorMaterialProperty);
		color.alpha = opacity;
		this.setMaterialColor(material as Cesium.ColorMaterialProperty, color);
	}

	/**
	 * sets the material object of geometry with new color
	 * @param {Cesium.ColorMaterialProperty} material the design object of geometry
	 * @param {Cesium.Color} color the new color to set
	 */
	public setMaterialColor(material: Cesium.ColorMaterialProperty, color: Cesium.Color): void {
		(material.color as any as Cesium.ConstantProperty).setValue(color);
	}

	/**
	 * get the color of the material object of geometry
	 * @param {Cesium.ColorMaterialProperty} material the design object of geometry
	 * @return {Cesium.Color}
	 */
	public getMaterialColor(material: Cesium.ColorMaterialProperty): Cesium.Color {
		return (material.color as any as Cesium.Property).getValue(Cesium.JulianDate.now());
	}

	/**
	 * sets thw width of polyline. because, in cesium the lines are narrow, it multipled by scalar.
	 * @param {Cesium.PolylineGraphics} polyline
	 * @param {number} width
	 */
	public setLineWidth(polyline: Cesium.PolylineGraphics, width: number) {
		polyline.width = width * CesiumEntitiesCreator.WIDTH_SCALAR;
	}

	private mouseEventWithKeyboard(handler, eventType: number, keyboardModifier: number, listener: (eventArgs?: MapEventArgs) => void) {
		handler.setInputAction(
			movement => {

				if (eventType === Cesium.ScreenSpaceEventType.MOUSE_MOVE) {
					if (this.lastPos && movement.startPosition.equals(this.lastPos)) {
						return;
					}
					else {
						this.lastPos = movement.endPosition.clone();
					}
				}
				let eventArgs = this.getEventArgsForMouseEvent(eventType, movement);
				eventArgs.altPressed = keyboardModifier === Cesium.KeyboardEventModifier.ALT;
				eventArgs.ctrlPressed = keyboardModifier === Cesium.KeyboardEventModifier.CTRL;
				eventArgs.shiftPressed = keyboardModifier === Cesium.KeyboardEventModifier.SHIFT;
				listener(eventArgs);
			},
			eventType,
			keyboardModifier
		);
	}

	private getEventArgsForMouseEvent(eventType: number, movement) {
		let pos = CesiumUtilities.getPositionByEventType(eventType, movement);
		let startPosX: number = pos.start ? pos.start.x : pos.x;
		let startPosY: number = pos.start ? pos.start.y : pos.y;
		let endPosX: number = pos.end ? pos.end.x : null;
		let endPosY: number = pos.end ? pos.end.y : null;

		let cartesien = this.toCartesianFromMousePosition(new Cesium.Cartesian2(endPosX ? endPosX : startPosX, endPosY ? endPosY : startPosY));

		const coords = cartesien
			? CesiumUtilities.toCoordinateFromCartesian(cartesien)
			: new Coordinate(null, null);

		let eventArgs: MapEventArgs = new MapEventArgs(
			coords.longitude,
			coords.latitude,
			coords.altitude,
			null,
			null,
			null,
			null,
			startPosX,
			startPosY,
			null,
			null,
			endPosX,
			endPosY
		);
		return eventArgs;
	}

	/**
	 * make entities convertible for further use
	 * creates GeometryData for all entities in data source and saved it inside the entities.
	 * @param {Cesium.DataSource} dataSource
	 */
	public makeEntitiesFromDataSourceDoraCompatible(dataSource: Cesium.DataSource) {
		for (let entity of dataSource.entities.values) {
			const geometryData: GeometryStateData = CesiumEntitiesResolver.buildGeometryDataFromEntity(entity);
			if (geometryData) {
				CesiumEntitiesCreator.saveGeometryDataInsideEntity(entity,
					geometryData.coordinates, geometryData.design,
					geometryData.type, geometryData.id);
			}
		}
	}
}
