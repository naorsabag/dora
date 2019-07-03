import { Coordinate } from "../../Geometries/Coordinate";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(0, 0, 0),
	new Coordinate(1, 0, 0),
	new Coordinate(1, 0.5, 0),
	new Coordinate(0, 0.5, 0),
	new Coordinate(0, 0, 0)
];

export class EmptyRectangleLinePattern extends LinePattern {
	constructor() {
		super(pattern, 60);
	}
}