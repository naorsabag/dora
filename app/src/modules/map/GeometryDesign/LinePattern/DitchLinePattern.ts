import { Coordinate } from "../../Geometries/Coordinate";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(0, 0, 0),
	new Coordinate(0.5, 0, 0),
	new Coordinate(0.5, 0.8, 0),
	new Coordinate(0.5, 0, 0),
	new Coordinate(1, 0, 0)];

export class DitchLinePattern extends LinePattern {
	constructor() {
		super(pattern, 120);
	}
}