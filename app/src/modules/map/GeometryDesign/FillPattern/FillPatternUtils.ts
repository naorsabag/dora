import { MapUtils } from "../../MapUtils/MapUtils";
import { Coordinate } from "../../Geometries/Coordinate";
import { PatternDirection } from "../Enums/PatternDirection";
import * as turf from "@turf/helpers";
import square from "@turf/square";
import turfbbox from "@turf/bbox";
import * as _ from "underscore";
import lineIntersect from "@turf/line-intersect";
import * as GeoJSON from "@turf/helpers/lib/geojson";

/* This class is used to generate some common fill patterns,
   we use this class because the strategy to generate each fill pattern might be different
   and this common class for related styles - for example: generating Striped, VerticalStriped
   HorizontalStriped in the same class */
export class FillPatternUtils {

	public static generateStripes(numberOfStripes: number, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>, direction: PatternDirection): Coordinate[][] {

		let stripesCoordinates: Coordinate[][] = [];
		const bbox = turfbbox(polygonGeoJsonFeature);
		const squareBbox = square(bbox);

		let [west, south, east, north] = squareBbox;


		//In order to force the polygon to contain all the edges, we add margins and adds stripes
		if (this.isDiagonalDirection(direction)) {
			numberOfStripes = numberOfStripes * 2;
			const EPSILON = Math.max(east - west, north - south);
			west = west - EPSILON;
			south = south - EPSILON;
			east = east + EPSILON;
			north = north + EPSILON;
		}

		// create a line with correct offset
		let gap = (east - west) / numberOfStripes;
		for (let index = 0; index < numberOfStripes; index++) {
			let offset = gap * index;
			const nextLineString = this.getSimplePatternLineString(direction, offset, north, west, south, east);
			const group = lineIntersect(nextLineString, <any>polygonGeoJsonFeature);

			/*turf not return the intersection point in order, then we order them by the latitude in most of cases
			  and by longitude in case of horizontal */
			let orderedGeometries: GeoJSON.Feature<GeoJSON.Point>[];
			if (this.isHorizontalDirection(direction)) {
				orderedGeometries = _.sortBy(group.features, (feature) => feature.geometry.coordinates[0]);
			}
			else {
				orderedGeometries = _.sortBy(group.features, (feature) => feature.geometry.coordinates[1]);
			}
			for (let j = 1; j < orderedGeometries.length; j += 2) {
				let point1 = orderedGeometries[j - 1].geometry.coordinates;
				let point2 = orderedGeometries[j].geometry.coordinates;
				let coords = [Coordinate.fromGeoJSON(point1), Coordinate.fromGeoJSON(point2)];
				stripesCoordinates.push(coords);
			}
		}

		return stripesCoordinates;
	}

	private static getSimplePatternLineString(direction: PatternDirection, offset: number, north: number,
		west: number, south: number, east: number): GeoJSON.Feature<GeoJSON.LineString> {
		let toReturn: GeoJSON.Feature<GeoJSON.LineString>;
		switch (direction) {
			case PatternDirection.NE_TO_SW:
			case PatternDirection.SW_TO_NE:
				toReturn = turf.lineString([[west + offset - (east - west) / 2.0, south], [west + offset + (east - west) / 2.0, north]]);
				break;
			case PatternDirection.NW_TO_SE:
			case PatternDirection.SE_TO_NW:
				toReturn = turf.lineString([[west + offset + (east - west) / 2.0, south], [west + offset - (east - west) / 2.0, north]]);
				break;
			case PatternDirection.E_TO_W:
			case PatternDirection.W_TO_E:
				toReturn = turf.lineString([[west, south + offset], [east, south + offset]]);
				break;
			case PatternDirection.N_TO_S:
			case PatternDirection.S_TO_N:
				toReturn = turf.lineString([[west + offset, north], [west + offset, south]]);
				break;
			default:
				toReturn = turf.lineString([[west + offset, north], [west + offset, south]]);
				break;
		}
		return toReturn;
	}


	private static isDiagonalDirection(direction: PatternDirection) {
		return [PatternDirection.NE_TO_SW, PatternDirection.NW_TO_SE,
			PatternDirection.SE_TO_NW, PatternDirection.SW_TO_NE].indexOf(direction) !== -1;
	}

	private static isHorizontalDirection(direction: PatternDirection) {
		return [PatternDirection.E_TO_W, PatternDirection.W_TO_E].indexOf(direction) !== -1;
	}
}