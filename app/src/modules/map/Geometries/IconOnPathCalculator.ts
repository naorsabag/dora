import { IconRelativePosition } from "../GeometryDesign/Enums/IconRelativePosition";
import { Coordinate } from "./Coordinate";
import * as turf from "@turf/helpers";
import midpoint from "@turf/midpoint";
import polylabel from "polylabel";

//TODO: get the shape type??? not needed
export class IconOnPathCalculator {
	public static calculatePositionOnPath(coordinates: Coordinate[], policy: IconRelativePosition): Coordinate {
		switch (policy) {
			case IconRelativePosition.Center:
				return IconOnPathCalculator.calculateCenter(coordinates);
			case IconRelativePosition.Centroid:
				return IconOnPathCalculator.calculateCentroid(coordinates);
			case IconRelativePosition.NorthernPoint:
				return IconOnPathCalculator.calculateNorthernPoint(coordinates);
			case IconRelativePosition.FirstEdge:
				return IconOnPathCalculator.calculateFirstEdge(coordinates);
			case IconRelativePosition.SecondEdge:
				return IconOnPathCalculator.calculateSecondEdge(coordinates);
			default:
				return IconOnPathCalculator.calculateNorthernPoint(coordinates);
		}
	}

	private static calculateCenter(coordinates: Coordinate[]): Coordinate {
		//The center will be the center of the middle line in the path
		if (coordinates.length === 1) {
			return coordinates[0];
		}
		else if (coordinates.length === 2) {
			//case of line of two points
			let baseCoords: number[][] = coordinates.map(c => c.getGeoJSON());
			let midPoint = midpoint(turf.point(baseCoords[0]), turf.point(baseCoords[1]));
			return new Coordinate(
				midPoint.geometry.coordinates[1],
				midPoint.geometry.coordinates[0]
			);
		} else {
			return coordinates[Math.floor(coordinates.length / 2)];
		}
	}

	private static calculateCentroid(coordinates: Coordinate[]): Coordinate {
		//The center will be the center of the middle line in the path
		let baseCoords: number[][][] = [coordinates.map(c => c.getGeoJSON())];

		const centroid = polylabel(baseCoords, 0.001);

		return new Coordinate(
			centroid[1],
			centroid[0]
		);
	}

	private static calculateNorthernPoint(coordinates: Coordinate[]): Coordinate {
		//The center will be the center of the middle line in the path
		let northernPoint;
		if (coordinates && coordinates.length > 0) {
			//TODO: check case of undefined
			northernPoint = coordinates[0];
			coordinates.forEach(currCoordinate => {
				//TODO: for some reason it is backward
				if (currCoordinate.latitude > northernPoint.latitude) {
					northernPoint = currCoordinate;
				}
			});
		} else {
			northernPoint = new Coordinate(0, 0);
		}

		return northernPoint;
	}

	private static calculateFirstEdge(coordinates: Coordinate[]): Coordinate {
		return coordinates[0];
	}

	private static calculateSecondEdge(coordinates: Coordinate[]): Coordinate {
		return coordinates[coordinates.length - 1];
	}
}
