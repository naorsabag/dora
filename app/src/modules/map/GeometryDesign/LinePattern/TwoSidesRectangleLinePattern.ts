import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(0, 0, 0),
	new Coordinate(0.1, 0, 0),
	new Coordinate(0.1, 0.2, 0),
	new Coordinate(0.4, 0.2, 0),
	new Coordinate(0.4, 0, 0),
	new Coordinate(0.6, 0, 0),
	new Coordinate(0.6, -0.2, 0),
	new Coordinate(0.9, -0.2, 0),
	new Coordinate(0.9, 0, 0),
	new Coordinate(1, 0, 0),
	new Coordinate(0, 0, 0)];

export class TwoSidesRectangleLinePattern extends LinePattern {
	constructor() {
		super(pattern, 90);
	}

	protected applyGeneratedCoordinates(geometry: IGeometryWithLinePattern, generatedCoordinates: Coordinate[][]): void {
		geometry.applyMultipolygonLinePattern(generatedCoordinates);
	}
}