import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";
import { LinePatternUtils } from "./LinePatternUtils";

export class DashedLinePattern extends LinePattern {
	constructor(occurrencesInShape: number = 60) {
		super(null, occurrencesInShape);
	}

	public applyToGeometry(geometry: IGeometryWithLinePattern, coordinates: Coordinate[]): void {
		let generatedCoordinates = LinePatternUtils.generateDashedLine(coordinates, this.occurencesInShape);
		this.applyGeneratedCoordinates(geometry, generatedCoordinates);
	}
}