import { Coordinate } from "../Geometries/Coordinate";

export interface IGraphicsUtils {
	addMarkArrow(coordinate: Coordinate): any;

	removeMarkArrow(marker: any): void;
}