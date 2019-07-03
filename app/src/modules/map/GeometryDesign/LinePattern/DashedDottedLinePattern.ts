import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(0.4, 0, 0),
	new Coordinate(0.6, 0, 0),
	new Coordinate(0.6, 0.2, 0),
	new Coordinate(0.4, 0.2, 0),
	new Coordinate(0.4, 0, 0)
];

export class DashedDottedLinePattern extends LinePattern {
	constructor() {
		super(pattern, 120);
	}

	protected applyGeneratedCoordinates(geometry: IGeometryWithLinePattern, generatedCoordinates: Coordinate[][]): void {
		//TODO: implement correctly
		geometry.applyMultipolygonLinePattern(generatedCoordinates);
	}
}