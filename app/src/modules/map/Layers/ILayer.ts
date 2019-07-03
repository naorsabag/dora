import { IGeometry } from "../Geometries/IGeometry";

export interface ILayer {
	/**
	 * Returns an array of all the geometries in the layer (manipulating it doesn't affect the layer)
	 */
	getGeometries(): IGeometry[];

	/**
	 * Adds a geometry to the layer
	 */
	addGeometry(geometry: IGeometry): void;

	/**
	 * Removes a geometry from the layer
	 */
	removeGeometry(geometry: IGeometry): void;

	/**
	 * Shows the layer on the map
	 */
	show(): void;

	/**
	 * Hides the layer from the map
	 */
	hide(): void;

	/**
	 * Removes the layer from the map
	 */
	remove(): void;
}