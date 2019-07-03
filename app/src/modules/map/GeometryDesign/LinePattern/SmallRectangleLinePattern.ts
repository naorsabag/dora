import { Coordinate } from "../../Geometries/Coordinate";
import { LinePattern } from "./LinePattern";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";

let pattern = [
	new Coordinate(0, 0, 0),
	new Coordinate(0.25, 0, 0),
	new Coordinate(0.25, 0.3, 0),
	new Coordinate(0.75, 0.3, 0),
	new Coordinate(0.75, 0, 0),
	new Coordinate(1, 0, 0),
	new Coordinate(0, 0, 0)
];

export class SmallRectangleLinePattern extends LinePattern {
	constructor() {
		super(pattern, 70);
	}

	protected applyGeneratedCoordinates(geometry: IGeometryWithLinePattern, generatedCoordinates: Coordinate[][]): void {
		geometry.applyMultipolygonLinePattern(generatedCoordinates);
	}
}