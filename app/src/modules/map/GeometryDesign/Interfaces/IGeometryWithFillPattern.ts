import { Coordinate } from "../../Geometries/Coordinate";

export interface IGeometryWithFillPattern {
	applyMultilineFillPattern(coordinates: Coordinate[][]): void;
}