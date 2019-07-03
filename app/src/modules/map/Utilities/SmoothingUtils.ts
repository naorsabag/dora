import { Coordinate } from "./../Geometries/Coordinate";

/**
 * Copy the algorithm from mesua for smoothing geometries. If this code has a problem, it is most likely
 * because it wasn't copy correctly (the original file is c++ code).
 * You can find the original code in "\\nasmln01kir\yachlam_yehidati$\2-!!!!ם\!!! 7\71\PolySmoothingSample.cpp".
 * If it looks like the code was copy correctly and there is still a bug, the problem is mesua, get angry at Elbit.
 */
export class SmoothingUtils {
	/**
	 * @method SmoothGeometry - Samples a smooth curve passing through original points of a polyline/polygon
	 * @param coordinates - array of original points of a polyline/polygon
	 * @param isPolygon - true for a polygon, false for a polyline
	 * @param numSmoothingLevels  - number of times to halve each line segment for smoothing, values between 2 and 5 are recommended
	 * @returns - array of resulting points of a smoothed polyline/polygon
	 */
	public static SmoothGeometry(
		coordinates: Coordinate[],
		isPolygon: boolean,
		numSmoothingLevels: number
	): Coordinate[] {
		let samplingPoints: Coordinate[] = [];
		let numPolyPoints: number = coordinates.length;
		if (
			isPolygon &&
			coordinates[0].latitude ===
				coordinates[numPolyPoints - 1].latitude &&
			coordinates[0].longitude ===
				coordinates[numPolyPoints - 1].longitude
	) {
			numPolyPoints--;
		}
		if (numPolyPoints < 3) {
			samplingPoints = samplingPoints.concat(coordinates);
		}

		const dW: number = 0.01;
		const dCoeff1: number = 9 / 16 + dW * 2;
		const dCoeff2: number = -(1 / 16 + dW * 3);
		const dCoeff3: number = dW;

		let numSamplingSegments: number;
		let numSamplingPoints: number;
		let numIntermediateSegments: number;
		let numIntermediatePoints: number;

		if (isPolygon) {
			numSamplingSegments = numSamplingPoints = numIntermediateSegments = numIntermediatePoints =
				numPolyPoints << numSmoothingLevels;
		} else {
			numSamplingSegments = (numPolyPoints - 1) << numSmoothingLevels;

			numSamplingPoints = numSamplingSegments + 1;

			numIntermediateSegments = (numPolyPoints + 4) << numSmoothingLevels;

			numIntermediatePoints = numIntermediateSegments + 1;
		}

		const firstStep = 1 << numSmoothingLevels;
		samplingPoints.slice(0, numIntermediatePoints);
		let j: number = 0;
		for (let i: number = 0; i < numPolyPoints; ++i, j += firstStep) {
			samplingPoints[j] = coordinates[i];
		}

		if (!isPolygon) {
			// add dummy segments before the first one and after the last one (continuing them in the same direction)
			let EndSegment: Coordinate = this.multiplyToCoordinate(
				this.subCoordinates(
					coordinates[numPolyPoints - 1],
					coordinates[numPolyPoints - 2]
				),
				0.5
			);
			samplingPoints[j] = this.addCoordinates(
				coordinates[numPolyPoints - 1],
				EndSegment
			);
			samplingPoints[j + firstStep] = this.addCoordinates(
				samplingPoints[j],
				EndSegment
			);

			let StartSegment: Coordinate = this.multiplyToCoordinate(
				this.subCoordinates(coordinates[1], coordinates[0]),
				0.5
			);
			samplingPoints[j + firstStep * 2] = this.subCoordinates(
				coordinates[0],
				StartSegment
			);
			samplingPoints[j + firstStep * 3] = this.subCoordinates(
				samplingPoints[j + firstStep * 2],
				EndSegment
			);

			samplingPoints[numIntermediatePoints - 1] = coordinates[0];
		}

		let step: number;
		let step2: number;
		let nextStep: number;
		for (
			step = firstStep, step2 = firstStep * 2, nextStep;
			step >= 2;
			step2 = step, step = nextStep
		) {
			nextStep = step >> 1;
			const lastPoint: number = numIntermediateSegments - step;

			let i: number;
			for (i = 0; i < numSamplingSegments; i += step) {
				let j: number = i + step;
				if (j >= numIntermediatePoints) {
					j = 0;
				}
				let v: Coordinate = this.multiplyToCoordinate(
					this.addCoordinates(samplingPoints[i], samplingPoints[j]),
					dCoeff1
				);
				j += step;
				if (j >= numIntermediatePoints) {
					j = 0;
				}

				v = this.addCoordinates(
					v,
					this.multiplyToCoordinate(samplingPoints[j], dCoeff2)
				);
				j += step;
				if (j >= numIntermediatePoints) {
					j = 0;
				}
				v = this.addCoordinates(
					v,
					this.multiplyToCoordinate(samplingPoints[j], dCoeff3)
				);
				j = i > 0 ? i - step : lastPoint;
				v = this.addCoordinates(
					v,
					this.multiplyToCoordinate(samplingPoints[j], dCoeff2)
				);
				v = this.addCoordinates(
					v,
					this.multiplyToCoordinate(
						samplingPoints[j > 0 ? j - step : lastPoint],
						dCoeff3
					)
				);

				samplingPoints[i + nextStep] = v;
			}

			if (!isPolygon) {
				samplingPoints[i + nextStep] = this.multiplyToCoordinate(
					this.addCoordinates(
						samplingPoints[i],
						samplingPoints[i + step]
					),
					0.5
				);

				samplingPoints[
					numIntermediateSegments - nextStep
				] = this.multiplyToCoordinate(
					this.addCoordinates(
						samplingPoints[lastPoint],
						samplingPoints[0]
					),
					0.5
				);
			}
		}

		return samplingPoints.slice(0, numSamplingPoints);
	}

	private static addCoordinates(
		coordinate1: Coordinate,
		coordinate2: Coordinate
	) {
		const resultX = coordinate1.latitude + coordinate2.latitude;
		const resultY = coordinate1.longitude + coordinate2.longitude;

		let result: Coordinate = new Coordinate(resultX, resultY);
		return result;
	}

	private static subCoordinates(
		coordinate1: Coordinate,
		coordinate2: Coordinate
	) {
		const resultX = coordinate1.latitude - coordinate2.latitude;
		const resultY = coordinate1.longitude - coordinate2.longitude;

		let result: Coordinate = new Coordinate(resultX, resultY);
		return result;
	}

	private static multiplyCoordinates(
		coordinate1: Coordinate,
		coordinate2: Coordinate
	) {
		const resultX = coordinate1.latitude * coordinate2.latitude;
		const resultY = coordinate1.longitude * coordinate2.longitude;

		let result: Coordinate = new Coordinate(resultX, resultY);
		return result;
	}

	private static addToCoordinate(coordinate1: Coordinate, number: number) {
		const resultX = coordinate1.latitude + number;
		const resultY = coordinate1.longitude + number;

		let result: Coordinate = new Coordinate(resultX, resultY);
		return result;
	}

	private static subToCoordinate(coordinate1: Coordinate, number: number) {
		const resultX = coordinate1.latitude - number;
		const resultY = coordinate1.longitude - number;

		let result: Coordinate = new Coordinate(resultX, resultY);
		return result;
	}

	private static multiplyToCoordinate(
		coordinate1: Coordinate,
		number: number
	) {
		const resultX = coordinate1.latitude * number;
		const resultY = coordinate1.longitude * number;

		let result: Coordinate = new Coordinate(resultX, resultY);
		return result;
	}
}
