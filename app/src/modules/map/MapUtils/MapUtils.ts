import * as turf from "@turf/helpers";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import lineDistance from "@turf/length";
import { ColorRgba } from "../Common/ColorRgba";
import { Coordinate } from "../Geometries/Coordinate";


export class MapUtils {

	public static convertGeoJsonCoordinatesToCoordinates(geoJsonCoords: GeoJSON.Position[]): Coordinate[] {
		return geoJsonCoords.map(pos => Coordinate.fromGeoJSON(pos));
	}

	public static convertCoordinatesToGeoJsonCoordinates(coordinates: Coordinate[]): GeoJSON.Position[] {
		return coordinates.map((currCoordinate) => currCoordinate.getGeoJSON());
	}

	static generateGuid(): string {
		function s4() {
			return Math.floor((1 + Math.random() * 0x10000)).toString(16).substring(1);
		}

		return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
	}

	static getNorthPoint(coordinates: Coordinate[]): Coordinate {
		let topPoint = coordinates[0];

		for (let i = 1; i < coordinates.length; i++) {
			let tempPoint = coordinates[i];

			if (tempPoint.latitude > topPoint.latitude || (tempPoint.latitude === topPoint.latitude && tempPoint.longitude < topPoint.longitude)) {
				topPoint = tempPoint;
			}
		}

		return topPoint;
	}

	static getCoordinatesCenter(coordinates: Coordinate[]): Coordinate {
		let centerCoordinate = new Coordinate(0, 0, 0);

		coordinates.forEach((currentCoordinate: Coordinate) => {
			centerCoordinate.latitude += currentCoordinate.latitude;
			centerCoordinate.longitude += currentCoordinate.longitude;
			centerCoordinate.altitude += currentCoordinate.altitude;
		});

		centerCoordinate.latitude /= coordinates.length;
		centerCoordinate.longitude /= coordinates.length;
		centerCoordinate.altitude /= coordinates.length;

		return centerCoordinate;
	}

	//TODO: more accurate calculation using turf (now it is ok)
	public static getLineLength(coordinates: Coordinate[], units: turf.Units = "kilometers"): number {
		let turfCoords = this.convertCoordinatesToGeoJsonCoordinates(coordinates);
		let turfLine = turf.lineString(turfCoords);
		let distance = lineDistance(turfLine, {units});

		return distance;
	}

	public static async getAltitude(coordinate: Coordinate): Promise<number> {

		const url: string = "LINK";
		let data = {
			points: [{lon: coordinate.longitude, lat: coordinate.latitude}],
			accessToken: "elevationpoint",
			priority: 1
		};

		try {

			let res: Response = await fetch(url, {
				method: "POST",
				headers: {
					accept: "application/vnd.geo+json",
				},
				body: JSON.stringify(data)
			});

			if (!res.ok) {
				throw new Error(res.statusText);
			}

			let result = await res.json();
			return result.features[0].geometry.coordinates[2];

		} catch (e) {
			throw e;
		}
	}

	public static timeout(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private static flattenJSON(data): any {
		let result = {};
		let recurse = (cur, prop) => {
			if (Object(cur) !== cur) {
				result[prop] = cur;
			} else if (Array.isArray(cur)) {
				let l;
				for (let i = 0, l = cur.length; i < l; i++) {
					recurse(cur[i], prop + "[" + i + "]");
				}
				if (l === 0) {
					result[prop] = [];
				}
			} else {
				let isEmpty = true;
				for (let p in cur) {
					if (cur.hasOwnProperty(p)) {
						isEmpty = false;
						recurse(cur[p], prop ? prop + "." + p : p);
					}
				}
				if (isEmpty && prop) {
					result[prop] = {};
				}
			}
		};
		recurse(data, "");
		return result;
	}
}
