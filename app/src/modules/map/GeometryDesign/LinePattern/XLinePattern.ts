import { Coordinate } from "../../Geometries/Coordinate";
import { LinePattern } from "./LinePattern";

let pattern = [
	new Coordinate(-0.25, -0.25, 0),
	new Coordinate(0.25, 0.25, 0),
	new Coordinate(0, 0, 0),
	new Coordinate(0.25, -0.25, 0),
	new Coordinate(-0.25, 0.25, 0)];

export class XLinePattern extends LinePattern {
	constructor() {
		super(pattern, 70);
	}
}