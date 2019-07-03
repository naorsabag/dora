import { IGeometryWithLinePattern } from "./IGeometryWithLinePattern";
import { Coordinate } from "../../Geometries/Coordinate";

export interface ILinePattern {
	applyToGeometry(geometry: IGeometryWithLinePattern, coordinates: Coordinate[]): void;
}