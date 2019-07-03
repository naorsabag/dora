import { IMapComponent } from "../Components/IMapComponent";
import { ArrowType } from "../GeometryDesign/Enums/ArrowType";
import { SmoothingType } from "../GeometryDesign/Enums/SmoothingType";
import { ArrowGeometryDesign } from "../GeometryDesign/ArrowGeometryDesign";
import { IArrowGeometryDesign } from "../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IconRelativePosition } from "../GeometryDesign/Enums/IconRelativePosition";
import { MapUtils } from "../MapUtils/MapUtils";
import { Coordinate } from "./Coordinate";
import { IconOnPathCalculator } from "./IconOnPathCalculator";
import { Line } from "./Line";
import * as turf from "@turf/helpers";
import along from "@turf/along";
import destination from "@turf/destination";
import lineDistance from "@turf/length";
import lineSlice from "@turf/line-slice";
import turfBearing from "@turf/bearing";
import * as _ from "underscore";
import { GEOMETRY_TYPES } from "./GeometryTypes";
import { LinePatternFactory } from "../GeometryDesign/LinePattern/LinePatternFactory";
import { LinePatternName } from "../GeometryDesign/Enums/LinePatternName";

export abstract class Arrow extends Line {

	protected get design(): ArrowGeometryDesign {
		if (this._design === null) {
			this._design = new ArrowGeometryDesign({});
		}
		return this._design as ArrowGeometryDesign;
	}

	constructor(
		mapComponent: IMapComponent,
		coordinates: Coordinate[],
		design?: IArrowGeometryDesign,
		id?: string
	) {
		super(mapComponent, coordinates, design, id);
		this._geometryType = GEOMETRY_TYPES.ARROW;
	}

	protected applyTransformations(): void {
		this.transformedCoordinates = this.baseCoordinates;
		this.multilineCoordsDraft = null;
		this.multipolygonCoordsDraft = null;

		if (this.design.line.smoothing === SmoothingType.Smooth) {
			this.transformToSmooth();
		}

		let arrowHeads: Coordinate[][] = [];
		const linePatternObj = LinePatternFactory.getPatternObject(this.design.line.pattern);
		switch (this.design.arrow.type) {
			case ArrowType.Regular:
				arrowHeads.push(this.createRegularArrowHead());
				if (this.design.arrow.isDouble) {
					arrowHeads.push(this.createRegularArrowHead(true));
				}
				if (this.design.line.pattern !== LinePatternName.Solid) {
					linePatternObj.applyToGeometry(this, this.transformedCoordinates);
				} else {
					this.multilineCoordsDraft = [this.transformedCoordinates];
				}
				arrowHeads.forEach(head => {
					linePatternObj.applyToGeometry(this, head);
				});
				break;
			case ArrowType.Wide:
			case ArrowType.Expanded:
				let arrowParts: {
					line1: Coordinate[];
					line2: Coordinate[];
					head: Coordinate[];
				};
				if (this.design.arrow.type === ArrowType.Wide) {
					arrowParts = this.createComplexArrow(
						false,
						this.design.arrow.gap ? this.design.arrow.gap : 0.5
					);
				} else {
					arrowParts = this.createComplexArrow(
						true,
						this.design.arrow.gap ? this.design.arrow.gap : 0.5
					);
				}
				arrowHeads.push(arrowParts.head);
				linePatternObj.applyToGeometry(this, arrowParts.line1);
				linePatternObj.applyToGeometry(this, arrowParts.line2);
				if (
					this.multilineCoordsDraft === null &&
					this.multipolygonCoordsDraft === null
				) {
					this.multilineCoordsDraft = [];
					this.multilineCoordsDraft.push(arrowParts.line1);
					this.multilineCoordsDraft.push(arrowParts.line2);
				}
				break;
		}
		if (this.multilineCoordsDraft === null) {
			this.multilineCoordsDraft = [];
		}
		this.multilineCoordsDraft.push(...arrowHeads);
	}

	private createRegularArrowHead(
		tail: boolean = false,
		size: number = 0.1,
		angle: number = 18
	): Coordinate[] {
		//for cases of arrow head in the tail of the line
		let lineCoords = _.clone(this.transformedCoordinates);
		if (tail) {
			lineCoords = lineCoords.reverse();
		}
		const coordsNum = this.transformedCoordinates.length;

		let arrowHeadPoint = lineCoords[coordsNum - 1];
		let beforeArrowHeadPoint = lineCoords[coordsNum - 2];
		let length = MapUtils.getLineLength(lineCoords) / 100;
		let distance = length * size;

		let arrowHeadLengthLatitude =
			arrowHeadPoint.latitude - beforeArrowHeadPoint.latitude;
		let arrowHeadLengthLongitude =
			arrowHeadPoint.longitude - beforeArrowHeadPoint.longitude;
		let arrowHeadSlope = arrowHeadLengthLatitude / arrowHeadLengthLongitude;
		let arrowHeadSlopeDeg = Math.atan(arrowHeadSlope) * (180 / Math.PI);

		let tip1AngleRad =
			this.degreesToRadians(arrowHeadSlopeDeg) - this.degreesToRadians(angle);
		let tip2AngleRad =
			this.degreesToRadians(arrowHeadSlopeDeg) + this.degreesToRadians(angle);

		if (
			(arrowHeadLengthLatitude > 0 && arrowHeadLengthLongitude > 0) ||
			(arrowHeadLengthLatitude < 0 && arrowHeadLengthLongitude > 0)
		) {
			tip1AngleRad += Math.PI;
			tip2AngleRad += Math.PI;
		}

		let tip1Longitude =
			arrowHeadPoint.longitude + distance * Math.cos(tip1AngleRad);
		let tip1Latitude =
			arrowHeadPoint.latitude + distance * Math.sin(tip1AngleRad);
		let tip2Longitude =
			arrowHeadPoint.longitude + distance * Math.cos(tip2AngleRad);
		let tip2Latitude =
			arrowHeadPoint.latitude + distance * Math.sin(tip2AngleRad);

		let coordinates: Coordinate[] = [];
		coordinates.push(new Coordinate(tip1Latitude, tip1Longitude));
		coordinates.push(
			new Coordinate(arrowHeadPoint.latitude, arrowHeadPoint.longitude)
		);
		coordinates.push(new Coordinate(tip2Latitude, tip2Longitude));
		return coordinates;
	}

	private createComplexArrow(
		isExpanded: boolean,
		arrowWidthInMeters: number,
		stepsInCreatingArrow: number = 6.0
	): { line1: Coordinate[]; line2: Coordinate[]; head: Coordinate[] } {
		let arrowWidthInKilometers = arrowWidthInMeters / 1000.0;
		let result: {
			line1: Coordinate[];
			line2: Coordinate[];
			head: Coordinate[];
		} = {line1: [], line2: [], head: []};
		stepsInCreatingArrow *= this.transformedCoordinates.length;
		let clockwiseCoords = [];
		let counterClockwiseCoords = [];
		let geoJson = {type: "LineString", geometry: {coordinates: []}};
		for (let i = 0; i < this.transformedCoordinates.length; i++) {
			geoJson.geometry.coordinates.push([
				this.transformedCoordinates[i].latitude,
				this.transformedCoordinates[i].longitude
			]);
		}
		const initialCoords = geoJson.geometry.coordinates;

		let turfLine = turf.lineString(initialCoords);
		let distance = lineDistance(turfLine, {units: "kilometers"});
		let sizeOfStep = 0.0001;
		if (distance > arrowWidthInKilometers) {
			turfLine = lineSlice(
				along(turfLine, 0),
				along(turfLine, distance - arrowWidthInKilometers),
				turfLine
			);
			distance = lineDistance(turfLine, {units: "kilometers"});
			sizeOfStep = distance / stepsInCreatingArrow;
		} else {
			stepsInCreatingArrow = 1;
		}

		for (let i = 1; i <= stepsInCreatingArrow; i++) {
			let point1 = along(turfLine, sizeOfStep * (i - 1), {units: "kilometers"});
			let point2 = along(turfLine, sizeOfStep * i, {units: "kilometers"});

			let bearing = turfBearing(point1, point2);

			let clockwiseOrthogonalBearing = bearing + 90.0;
			if (clockwiseOrthogonalBearing > 180) {
				clockwiseOrthogonalBearing -= 360.0;
			}

			let counterClockwiseOrthogonalBearing = bearing - 90.0;
			if (counterClockwiseOrthogonalBearing < -180) {
				clockwiseOrthogonalBearing += 360.0;
			}

			//now we find the coordinates
			if (i === 1) {
				//only for the first coordinate
				let pointClockwise = destination(
					point1,
					arrowWidthInKilometers * 0.5,
					clockwiseOrthogonalBearing
				);
				let pointCounterClockwise = destination(
					point1,
					arrowWidthInKilometers * 0.5,
					counterClockwiseOrthogonalBearing
				);

				if (isExpanded) {
					pointClockwise = destination(
						point1,
						arrowWidthInKilometers *
						(0.5 + stepsInCreatingArrow / (0.5 * stepsInCreatingArrow)),
						clockwiseOrthogonalBearing
					);
					pointCounterClockwise = destination(
						point1,
						arrowWidthInKilometers *
						(0.5 + stepsInCreatingArrow / (0.5 * stepsInCreatingArrow)),
						counterClockwiseOrthogonalBearing
					);
				}

				clockwiseCoords.push(pointClockwise.geometry.coordinates);
				counterClockwiseCoords.push(pointCounterClockwise.geometry.coordinates);
			}

			let pointClockwise = destination(
				point2,
				arrowWidthInKilometers * 0.5,
				clockwiseOrthogonalBearing
			);
			let pointCounterClockwise = destination(
				point2,
				arrowWidthInKilometers * 0.5,
				counterClockwiseOrthogonalBearing
			);

			if (isExpanded) {
				pointClockwise = destination(
					point2,
					arrowWidthInKilometers *
					(0.5 + (stepsInCreatingArrow - i) / (0.5 * stepsInCreatingArrow)),
					clockwiseOrthogonalBearing
				);
				pointCounterClockwise = destination(
					point2,
					arrowWidthInKilometers *
					(0.5 + (stepsInCreatingArrow - i) / (0.5 * stepsInCreatingArrow)),
					counterClockwiseOrthogonalBearing
				);
			}

			clockwiseCoords.push(pointClockwise.geometry.coordinates);
			counterClockwiseCoords.push(pointCounterClockwise.geometry.coordinates);

			//for the last iteration
			if (i === stepsInCreatingArrow) {
				let clockwiseEnd = turf.lineString([
					_.last(clockwiseCoords),
					clockwiseCoords[clockwiseCoords.length - 2]
				]);
				let counterClockwiseEnd = turf.lineString([
					_.last(counterClockwiseCoords),
					counterClockwiseCoords[counterClockwiseCoords.length - 2]
				]);
				let headStart = along(clockwiseEnd, arrowWidthInKilometers * 0.5);
				let headEnd = along(
					counterClockwiseEnd,
					arrowWidthInKilometers * 0.5
				);

				let pointClockwise = destination(
					point2,
					arrowWidthInKilometers,
					clockwiseOrthogonalBearing
				);
				let pointCounterClockwise = destination(
					point2,
					arrowWidthInKilometers,
					counterClockwiseOrthogonalBearing
				);

				result.head.push(
					new Coordinate(
						headStart.geometry.coordinates[0],
						headStart.geometry.coordinates[1]
					)
				);
				result.head.push(
					new Coordinate(_.last(clockwiseCoords)[0], _.last(clockwiseCoords)[1])
				);
				result.head.push(
					new Coordinate(
						pointClockwise.geometry.coordinates[0],
						pointClockwise.geometry.coordinates[1]
					)
				);
				result.head.push(
					new Coordinate(_.last(initialCoords)[0], _.last(initialCoords)[1])
				);
				result.head.push(
					new Coordinate(
						pointCounterClockwise.geometry.coordinates[0],
						pointCounterClockwise.geometry.coordinates[1]
					)
				);
				result.head.push(
					new Coordinate(
						_.last(counterClockwiseCoords)[0],
						_.last(counterClockwiseCoords)[1]
					)
				);
				result.head.push(
					new Coordinate(
						headEnd.geometry.coordinates[0],
						headEnd.geometry.coordinates[1]
					)
				);
			}
		}

		_.each(clockwiseCoords, currCoordinate => {
			result.line1.push(
				new Coordinate(currCoordinate[0], currCoordinate[1], 0)
			);
		});

		_.each(counterClockwiseCoords, currCoordinate => {
			result.line2.push(
				new Coordinate(currCoordinate[0], currCoordinate[1], 0)
			);
		});

		return result;
	}

	private degreesToRadians(deg: number): number {
		return deg * (Math.PI / 180);
	}

	public setDesign(design: IArrowGeometryDesign): void {
		//Case where there are same number of icons as before
		this.design.update(design);
		if (
			!this.isOnMap ||
			(design.line !== undefined &&
				(design.line.pattern !== undefined ||
					design.line.smoothing !== undefined)) ||
			(design.arrow !== undefined && design.arrow.type !== undefined)
		) {
			//if the geometry doesn't exist yet or needs to be updated, call the generate function
			this.generateGeometryOnMap();
			this.applyDesign(this.design);
		} else {
			//only apply new design definitions if the geometry wasn't re-generated
			this.applyDesign(design);
		}
		this.setIconsOnPathDesign(design);
	}

	public applyMultilineLinePattern(coordinates: Coordinate[][]): void {
		if (this.multilineCoordsDraft === null) {
			this.multilineCoordsDraft = coordinates;
		} else {
			this.multilineCoordsDraft = this.multilineCoordsDraft.concat(coordinates);
		}
	}

	public applyMultipolygonLinePattern(coordinates: Coordinate[][]): void {
		if (this.multipolygonCoordsDraft === null) {
			this.multipolygonCoordsDraft = coordinates;
		} else {
			this.multipolygonCoordsDraft = this.multipolygonCoordsDraft.concat(
				coordinates
			);
		}
	}

	protected generateIconsCoordinates(): void {
		//We need to set the icon in place according to the policy
		for (
			let i = 0;
			i < Math.min(this.iconPoints.length, this.design.icons.length);
			i++
		) {
			const iconPoint = this.iconPoints[i];
			const positionalPolicy = this.design.icons[i].image.positionPolicy;
			//TODO: think about this
			const coordinate = IconOnPathCalculator.calculatePositionOnPath(
				this.baseCoordinates,
				positionalPolicy
			);
			iconPoint.setCoordinate(coordinate);
		}
	}

	protected calculateBalloonOpenPosition(): Coordinate {
		let baloonCoords: Coordinate;
		if (this.iconPoints && this.iconPoints.length > 0) {
			baloonCoords = this.iconPoints[0].getCoordinate();
		} else {
			//In case ther is no icon, we put the baloon in the center of the line
			baloonCoords = IconOnPathCalculator.calculatePositionOnPath(
				this.transformedCoordinates,
				IconRelativePosition.Center
			);
		}
		return baloonCoords;
	}
}
