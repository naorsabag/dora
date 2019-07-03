import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";
import { LinePatternUtils } from "./LinePatternUtils";

export class DoubleDashedLinePattern extends LinePattern {
	constructor(occurrencesInShape: number = 60) {
		super(null, occurrencesInShape);
	}

	public applyToGeometry(geometry: IGeometryWithLinePattern, coordinates: Coordinate[]): void {

		let finalCoords: Coordinate[][] = [];
		let lines = LinePatternUtils.generateDoubleLine(coordinates);
		lines.forEach((line) => {
			let dashedLineCoords = LinePatternUtils.generateDashedLine(line, this.occurencesInShape);
			finalCoords = finalCoords.concat(dashedLineCoords);
		});
		this.applyGeneratedCoordinates(geometry, finalCoords);
	}
}