import { Coordinate } from "../../Geometries/Coordinate";
import * as turf from "@turf/helpers";
import along from "@turf/along";
import destination from "@turf/destination";
import lineDistance from "@turf/length";
import turfBearing from "@turf/bearing";

/* This class is used to generate some common line patterns */
export class LinePatternUtils {

	private static readonly RELATIVE_WIDTH = 0.005;
	private static readonly SAMPLES_IN_SLICE = 6.0;

	private static convertCoordinatesToGeoJSONCoordinates(coordinates: Coordinate[]): number[][] {
		let geoJson = { type: "LineString", geometry: { coordinates: [] } };
		for (let i = 0; i < coordinates.length; i++) {
			geoJson.geometry.coordinates.push([
				coordinates[i].latitude,
				coordinates[i].longitude
			]);
		}
		return geoJson.geometry.coordinates;
	}

	private static convertGeoJSONCoordinatesToCoordinates(geoJsonCoordinates: number[][]): Coordinate[] {
		let coordinates: Coordinate[] = [];
		geoJsonCoordinates.forEach(currCoordinate => {
			coordinates.push(
				new Coordinate(currCoordinate[0], currCoordinate[1], 0)
			);
		});
		return coordinates;
	}

	private static findBearingsBetweenPoints(point1: GeoJSON.Feature<GeoJSON.Point, any>,
		point2: GeoJSON.Feature<GeoJSON.Point, any>): { clockwise: number, counterClockwise: number } {
		let bearing = turfBearing(point1, point2);

		let clockwiseOrthogonalBearing = bearing + 90.0;
		if (clockwiseOrthogonalBearing > 180) {
			clockwiseOrthogonalBearing -= 360.0;
		}

		let counterClockwiseOrthogonalBearing = bearing - 90.0;
		if (counterClockwiseOrthogonalBearing < -180) {
			clockwiseOrthogonalBearing += 360.0;
		}

		return {
			clockwise: clockwiseOrthogonalBearing,
			counterClockwise: counterClockwiseOrthogonalBearing
		};
	}

	public static generateDoubleLine(coordinates: Coordinate[]): Coordinate[][] {
		let result: Coordinate[][] = [[], []];
		let samples =  this.SAMPLES_IN_SLICE * coordinates.length;
		let clockwiseCoords = [];
		let counterClockwiseCoords = [];

		const initialCoords = this.convertCoordinatesToGeoJSONCoordinates(coordinates);

		let turfLine = turf.lineString(initialCoords);
		let distance = lineDistance(turfLine, {units: "kilometers"});

		const sizeOfSample = distance / samples;

		for (let i = 1; i <= samples; i++) { //Start from the second index
			let point1 = along(
				turfLine,
				sizeOfSample * (i - 1),
				{units: "kilometers"}
			);
			let point2 = along(turfLine, sizeOfSample * i, {units: "kilometers"});

			const bearing = this.findBearingsBetweenPoints(point1, point2);

			//only for the first iteration
			if (i === 1) {
				let pointClockwise = destination(
					point1,
					this.RELATIVE_WIDTH * distance,
					bearing.clockwise
				);
				let pointCounterClockwise = destination(
					point1,
					this.RELATIVE_WIDTH * distance,
					bearing.counterClockwise
				);

				clockwiseCoords.push(pointClockwise.geometry.coordinates);
				counterClockwiseCoords.push(
					pointCounterClockwise.geometry.coordinates
				);
			}

			let pointClockwise = destination(
				point2,
				this.RELATIVE_WIDTH * distance,
				bearing.clockwise
			);
			let pointCounterClockwise = destination(
				point2,
				this.RELATIVE_WIDTH * distance,
				bearing.counterClockwise
			);

			clockwiseCoords.push(pointClockwise.geometry.coordinates);
			counterClockwiseCoords.push(pointCounterClockwise.geometry.coordinates);

			//for the last iteration
			if (i === samples) {
				let clockwiseEnd = turf.lineString([
					clockwiseCoords[clockwiseCoords.length - 1],
					clockwiseCoords[clockwiseCoords.length - 2]
				]);
				let counterClockwiseEnd = turf.lineString([
					counterClockwiseCoords[counterClockwiseCoords.length - 1],
					counterClockwiseCoords[counterClockwiseCoords.length - 2]
				]);
				let headStart = along(
					clockwiseEnd,
					this.RELATIVE_WIDTH * distance
				);
				let headEnd = along(
					counterClockwiseEnd,
					this.RELATIVE_WIDTH * distance
				);

				let pointClockwise = destination(
					point2,
					this.RELATIVE_WIDTH * 2 * distance,
					bearing.clockwise
				);
				let pointCounterClockwise = destination(
					point2,
					this.RELATIVE_WIDTH * 2 * distance,
					bearing.counterClockwise
				);
			}
		}

		result[0] = this.convertGeoJSONCoordinatesToCoordinates(clockwiseCoords);
		result[1] = this.convertGeoJSONCoordinatesToCoordinates(counterClockwiseCoords);

		return result;
	}

	public static generateDashedLine(coordinates: Coordinate[], numDashes: number): Coordinate[][] {
		let totalLength = 0;
		let generatedCoordinates: Coordinate[][] = [];
		for (let i = 0; i < coordinates.length - 1; i++) {
			const p1 = coordinates[i];
			const p2 = coordinates[i + 1];
			//TODO: use length from turf to correct calculation
			totalLength += Math.sqrt(Math.pow(p1.longitude - p2.longitude, 2) + Math.pow(p1.latitude - p2.latitude, 2));
		}

		//now we calculate the number of segments it will be depend on the length and the const NUM_OF_SEGMENTS (magic formula)
		let lengthOfSegment = Math.min(totalLength / 20.0, Math.pow(totalLength, 0.33) / numDashes);
		const occurences = totalLength / lengthOfSegment;
		lengthOfSegment = totalLength / Math.ceil(occurences);
		lengthOfSegment = totalLength / numDashes;
		const maxIterations = Math.max(Math.ceil(occurences) * 3, coordinates.length * 3); //control variable to prevent infinite loop

		let currentLength = lengthOfSegment;
		let currentCoordinates = [coordinates[0]];
		let coordinateBef = null;
		let splitSegments: Coordinate[][] = [];
		for (let i = 0, j = 0; i < coordinates.length - 1 && j < maxIterations; i++ , j++) {
			let p1: Coordinate, p2: Coordinate;
			if (coordinateBef == null) {
				p1 = coordinates[i];
			} else {
				p1 = coordinateBef;
			}
			p2 = coordinates[i + 1];

			let vx = p2.longitude - p1.longitude;
			let vy = p2.latitude - p1.latitude;

			let currSegmentLength = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));

			//(vx,vy) is a unit vector. i.e. ||(vx,vy)||==1, e.g. point on a circle
			// with a radius one, where the direction isthe direction of the vector (p1,p2)
			vx /= currSegmentLength;
			vy /= currSegmentLength;

			if (currentLength - currSegmentLength <= 0) {
				const xValue = p1.longitude + vx * (currentLength);
				const yValue = p1.latitude + vy * (currentLength);

				const lastCoordinateInDash = new Coordinate(yValue, xValue);
				currentCoordinates.push(lastCoordinateInDash);

				splitSegments.push(currentCoordinates);

				currentCoordinates = [lastCoordinateInDash];
				coordinateBef = lastCoordinateInDash;
				currentLength = lengthOfSegment;
				i--;
			} else {
				currentLength -= currSegmentLength;
				currentCoordinates.push(new Coordinate(p2.latitude, p2.longitude));
				coordinateBef = null;
			}
		}
		for (let i = 0; i < splitSegments.length; i++) {
			if (i % 2 === 0) {
				generatedCoordinates.push(splitSegments[i]);
			}
		}

		return generatedCoordinates;

	}
}