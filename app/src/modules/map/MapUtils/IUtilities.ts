import { MapEventArgs } from "../Events/MapEventArgs";
import { Geometry } from "../Geometries/Geometry";
import { ScreenCoordinate } from "../GraphicsUtils/ScreenCoordinate";
import { Coordinate } from "../Geometries/Coordinate";

export interface IUtilities {

	pickEntity(eventArgs: MapEventArgs): Geometry;

	pickEntities(eventArgs: MapEventArgs, maxEntities?: number): Geometry[];

	entitiesAmountInPositionGreaterThan(eventArgs: MapEventArgs, num: number): boolean;

	onMouseEvent(eventType: number, listener: (eventArgs?: MapEventArgs) => void): () => void;

	addEntityMouseEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void;

	addEntityMouseOutEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void;

	toScreenPosFromCoordinate(coordinate: Coordinate): ScreenCoordinate;
}