import { IActionToken } from "../Common/IActionToken";
import { MapEventArgs } from "../Events/MapEventArgs";
import { GeometryDesign } from "../GeometryDesign/GeometryDesign";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { GEOMETRY_TYPES } from "./GeometryTypes";
import * as GeoJSON from "@turf/helpers/lib/geojson";

export interface IGeometry {
	geometryType: GEOMETRY_TYPES;

	/**
	 * Adds the geometry to the map.
	 */
	addToMap(): void;

	/**
	 * Returns the geometry's GeoJSON geometry level
	 */
	getGeoJSON(): GeoJSON.Geometry;

	/**
	 * Gets the wkt format of the geometry.
	 * @returns the geometry's wkt.
	 */
	getWKT(): string;

	/**
	 * Sets the geometry's geo json.
	 * @param geometry - the geo json geometry to set.
	 */
	setGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): void;

	/**
	 * Sets the geometry's wkt.
	 * @param {string} wkt - Wkt geometry format
	 */
	setWKT(wkt: string): void;

	/**
	 * Edits the geometry.
	 * @param {IActionToken} token - Enables the caller to cancel \ finish the edit action.
	 */
	edit(token: IActionToken): void;

	/**
	 * Drags the geometry on the map.
	 * @param {IActionToken} token - Enables the caller to cancel \ finish the drag action.
	 */
	drag(token: IActionToken): void;

	/**
	 * Removes the geometry from the map.
	 */
	remove(): void;

	/**
	 * Attach an event to the geometry
	 * @param event event type
	 * @param listener function to be executed
	 */
	on(event: string, listener: (eventArgs: MapEventArgs) => void): void;

	/**
	 * Detach an event from the geometry
	 * @param event event type
	 * @param listener the function to detach
	 */
	off(event: string, listener?: (eventArgs: MapEventArgs) => void): void;

	/**
	 * Gets the geometry's design.
	 * @returns the design of the geometry.
	 */
	getDesign(): GeometryDesign; //API break
	/**
	 * Sets the geometry's design.
	 * @param design - The new design of the geometry to be set.
	 */
	setDesign(design: IGeometryDesign): void; //API break

	/**
	 * Returns if the geometry is visible
	 */
	getVisibility(): boolean;

	/**
	 * Shows or hides the geometry from the map
	 * @param state the new visibility state. *fasle*=**invisible**, *true*=**visible**
	 */
	setVisibility(state: boolean): void;

	/**
	 * Sets the lable of the geometry.
	 * @param text - The text of the lable to be set.
	 */
	setLabel(text: string): void;

	/**
	 * Gets the geometry's lable.
	 * @returns the text of the geometry's lable.
	 */
	getLabel(): string;

	openBalloonHtml(html: string): void;

	focusView(): Promise<void>;

	mark(): void;

	unMark(): void;

	isMarked(): boolean;

	setGeometryOnMap(nativeEntity: any);

	getCollectionContainerId(): string;
}
