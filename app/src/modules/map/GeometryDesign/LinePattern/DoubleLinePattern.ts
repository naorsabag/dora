import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";
import { LinePatternUtils } from "./LinePatternUtils";

/**
 * DoubleLine pattern is pattern of double line, this pattern is different from
 * DoubleLineGeometry, in this *geometry* one can add two line patterns with different
 * line designs, here this is the same design, and the design is double line
 */
export class DoubleLinePattern extends LinePattern {
	constructor(occurrencesInShape: number = 10) {
		super(null, occurrencesInShape);
	}

	public applyToGeometry(geometry: IGeometryWithLinePattern, coordinates: Coordinate[]): void {
		let lines = LinePatternUtils.generateDoubleLine(coordinates);
		this.applyGeneratedCoordinates(geometry, lines);
	}
}