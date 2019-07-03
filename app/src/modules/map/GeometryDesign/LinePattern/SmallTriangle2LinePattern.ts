import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(0, 0, 0),
	new Coordinate(0.25, 0, 0),
	new Coordinate(0.5, -0.2, 0),
	new Coordinate(0.75, 0, 0),
	new Coordinate(1, 0, 0),
	new Coordinate(0, 0, 0)
];

export class SmallTriangle2LinePattern extends LinePattern {
	constructor() {
		super(pattern, 70);
	}

	protected applyGeneratedCoordinates(geometry: IGeometryWithLinePattern, generatedCoordinates: Coordinate[][]): void {
		geometry.applyMultipolygonLinePattern(generatedCoordinates);
	}
}