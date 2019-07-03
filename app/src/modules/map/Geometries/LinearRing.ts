import { MapUtils } from "../MapUtils/MapUtils";
import { SmoothingUtils } from "./../Utilities/SmoothingUtils";
import { MapError } from "../Common/MapError";
import { Coordinate } from "./Coordinate";
import turfArea from "@turf/area";
import turfBuffer from "@turf/buffer";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import * as turf from "@turf/helpers";

export class LinearRing {
	constructor(coordinates: Coordinate[]) {
		this.coordinates = coordinates;
	}

	private _coordinates: Coordinate[];

	public get coordinates(): Coordinate[] {
		return this._coordinates;
	}

	public set coordinates(coordinates: Coordinate[]) {
		this._coordinates = this.getValidLinearRingCoordinates(coordinates);
	}

	public static fromGeoJSON(ringGeoJson: GeoJSON.Position[]): LinearRing {
		return new LinearRing(
			MapUtils.convertGeoJsonCoordinatesToCoordinates(ringGeoJson)
		);
	}

	public getGeoJSON(): GeoJSON.Position[] {
		return this.coordinates.map(coord => coord.getGeoJSON());
	}

	public getWKT(): string {
		const coordsString = this.coordinates
			.map(coord => coord.getWKT())
			.join(",");
		return `(${coordsString})`;
	}

	/**
	 * @method transformToSmooth - Transform the polygon to be smooth polygon through his original points
	 */
	public transformToSmooth(): LinearRing {
		return new LinearRing(SmoothingUtils.SmoothGeometry(this.coordinates, true, 5));
	}

	public transformToRound(): LinearRing {
		const geoJson = turf.polygon([this.getGeoJSON()]).geometry;
		let area = turfArea(geoJson);
		let radius = Math.sqrt(area) * 19500;
		let angularRadius = 180 * radius / (Math.PI * 6378137);
		const roundedPolygonFeature = turfBuffer(
			turfBuffer(geoJson, -angularRadius, {steps: 25, units: "meters"}),
			angularRadius,
			{steps: 25, units: "meters"}
		);
		const roundedPolygon = roundedPolygonFeature.geometry;
		let transformedCoordinates: Coordinate[] = [];
		if (roundedPolygon.coordinates[0].length > 0) {
			transformedCoordinates =  MapUtils.convertGeoJsonCoordinatesToCoordinates(roundedPolygon.coordinates[0]);
		}

		return new LinearRing(transformedCoordinates);
	}

	private getValidLinearRingCoordinates(coordinates: Coordinate[]): Coordinate[] {
		coordinates = coordinates.slice(0); //clone

		if (coordinates !== null && coordinates.length > 2) {
			const firstCoordinate = coordinates[0];
			const lastCoordinate = coordinates[coordinates.length - 1];

			if (firstCoordinate.altitude !== lastCoordinate.altitude ||
				firstCoordinate.latitude !== lastCoordinate.latitude ||
				firstCoordinate.longitude !== lastCoordinate.longitude) {
				coordinates.push(firstCoordinate);
			}

			return coordinates;
		} else {
			throw new MapError("Invalid Polygon", "!!!!!!! !!!! !!!!! !!! 3 !!!!!! !!!!!");
		}
	}
}
