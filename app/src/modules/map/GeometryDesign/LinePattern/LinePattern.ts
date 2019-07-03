import { Coordinate } from "../../Geometries/Coordinate";
import { MapUtils } from "../../MapUtils/MapUtils";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { ILinePattern } from "../Interfaces/ILinePattern";
import * as Victor from "victor";

export abstract class LinePattern implements ILinePattern {
	protected coordinatesPattern: Coordinate[];
	protected occurencesInShape: number;

	constructor(coordinatesPattern: Coordinate[], occurencesInShape: number) {
		this.coordinatesPattern = coordinatesPattern;
		this.occurencesInShape = occurencesInShape;
	}

	public applyToGeometry(geometry: IGeometryWithLinePattern, coordinates: Coordinate[]): void {
		//now we calculate the total length of the coordinates array
		let length = MapUtils.getLineLength(coordinates) / 100;
		let sizeOfPatternInLine = Math.min(length / 7.0, Math.pow(length, 0.5) / this.occurencesInShape);

		//make the size of pattern in line such that the line will be covered. i.e. we can't put 7.5 occurences of
		//the pattern on the line only 7 or 8, so we want to adjust SizeOfPatternInLine s.t. the number will be integer
		let occurences = length / sizeOfPatternInLine;
		sizeOfPatternInLine = length / Math.ceil(occurences);

		//run on the line and find the points to put the pattern
		let patternVectors: Victor[] = this.coordinatesPattern.map((coord: Coordinate) => new Victor(coord.longitude, coord.latitude));
		const maxIterations = Math.max(length / sizeOfPatternInLine * 5,
			coordinates.length * 3); //control variable to prevent infinite loop

		let coordinateBef = null;
		let currentLength = 0;
		let generatedCoordinates: Coordinate[][] = [];
		let indexToInsert = 0;
		let j = 0;
		for (let i = 0; i < coordinates.length - 1 && j < maxIterations; i++ , j++) {
			let p1: Coordinate, p2: Coordinate;
			if (coordinateBef == null) {
				p1 = coordinates[i];
			} else {
				p1 = coordinateBef;
			}
			p2 = coordinates[i + 1];

			let vx = p2.longitude - p1.longitude;
			let vy = p2.latitude - p1.latitude;

			const currSegmentLength = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));

			//(vx,vy) is a unit vector. i.e. ||(vx,vy)||==1, e.g. point on a circle
			// with a radius one, where the direction isthe direction of the vector (p1,p2)
			vx /= currSegmentLength;
			vy /= currSegmentLength;

			if (currentLength - currSegmentLength <= 0) {
				const xValue = p1.longitude + vx * (currentLength);
				const yValue = p1.latitude + vy * (currentLength);

				//create the pattern at this point
				let slope = Math.PI / 2;
				if (vx !== 0) {
					slope = Math.atan2(vy, vx);
				}

				let patternInPlace: Victor[] = patternVectors.map((vec: Victor) => vec.clone());
				patternInPlace = patternInPlace.map((vec: Victor) => vec.multiply(new Victor(sizeOfPatternInLine, sizeOfPatternInLine)));
				patternInPlace = patternInPlace.map((vec: Victor) => vec.rotate(slope + Math.PI / 2));
				patternInPlace = patternInPlace.map((vec: Victor) => vec.add(new Victor(xValue, yValue))); //TODO: check order

				generatedCoordinates.push(patternInPlace.map((vec: Victor) => new Coordinate(vec.y, vec.x)));

				coordinateBef = new Coordinate(yValue, xValue);
				currentLength = sizeOfPatternInLine;
				i--;
			} else {
				coordinateBef = p1;
				currentLength = sizeOfPatternInLine;
			}
			j++;

		}
		this.applyGeneratedCoordinates(geometry, generatedCoordinates);
	}

	protected applyGeneratedCoordinates(geometry: IGeometryWithLinePattern, generatedCoordinates: Coordinate[][]): void {
		geometry.applyMultilineLinePattern(generatedCoordinates);
	}
}