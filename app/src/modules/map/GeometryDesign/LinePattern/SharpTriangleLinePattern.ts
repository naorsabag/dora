import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(0.1, 0, 0),
	new Coordinate(0.5, 2.0, 0),
	new Coordinate(0.9, 0, 0),
	new Coordinate(0.1, 0, 0)
];

export class SharpTriangleLinePattern extends LinePattern {
	constructor() {
		super(pattern, 80);
	}

	protected applyGeneratedCoordinates(geometry: IGeometryWithLinePattern, generatedCoordinates: Coordinate[][]): void {
		geometry.applyMultipolygonLinePattern(generatedCoordinates);
	}
}