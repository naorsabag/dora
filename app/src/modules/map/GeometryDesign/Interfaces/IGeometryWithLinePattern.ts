import { Coordinate } from "../../Geometries/Coordinate";

export interface IGeometryWithLinePattern {
	applyMultilineLinePattern(coordinates: Coordinate[][]): void;

	applyMultipolygonLinePattern(coordinates: Coordinate[][]): void;
}