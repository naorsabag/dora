import { Coordinate } from "../../Geometries/Coordinate";
import { LinePattern } from "./LinePattern";

let pattern = [new Coordinate(0, 0.30, 0),
	new Coordinate(0.20000000000000018, 0.06599999999999992, 0),
	new Coordinate(0.40000000000000013, 0.006667353952620469, 0),
	new Coordinate(0.6000000000000002, 0.006667353952620505, 0),
	new Coordinate(0.8000000000000002, 0.06600000000000006, 0),
	new Coordinate(1, 0.30, 0)];

export class Arc1LinePattern extends LinePattern {
	constructor() {
		super(pattern, 120);
	}
}