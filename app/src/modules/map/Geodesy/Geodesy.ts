import * as proj4 from "proj4";
import * as _ from "underscore";
import { Coordinate } from "../Geometries/Coordinate";
import { DIRECTIONS, PROJECTIONS, UNITS } from "./Consts";
import { Projection } from "./Projection";

export class Geodesy {
	private static isLoaded = false;
	private static validDmsRegex = /^-?\d\d?( |°)\d\d?('| )\d\d?\.?\d?\d?\d?\d?"?$/;

	public static convertCoordinate(coordinate: Coordinate, sourceProjection: Projection,
									destinationProjection: Projection, zone?: number): { coordinate: Coordinate, zone: number } {

		if (!this.isLoaded) {
			this.initilize();
			this.isLoaded = true;
		}

		if (sourceProjection.epsg !== PROJECTIONS.WGS84GEO.epsg && destinationProjection.epsg !== PROJECTIONS.WGS84GEO.epsg) {
			let wgsCroods = Geodesy.convertCoordinate(coordinate, sourceProjection, PROJECTIONS.WGS84GEO, zone);
			return Geodesy.convertCoordinate(wgsCroods.coordinate, PROJECTIONS.WGS84GEO, destinationProjection, zone);
		}

		if (sourceProjection === destinationProjection) {
			return {coordinate: coordinate, zone: zone};
		}

		let coords = _.clone(coordinate);
		const fromProj: any = sourceProjection;
		const toProj: any = destinationProjection;

		if (!fromProj || !toProj) {
			throw {message: "Invalid coordinate systems!"};
		}

		if (fromProj.isAsync || toProj.isAsync) {
			throw {message: "The coordinate system cant be converted synchronously! Please use the async convert method."};
		}

		let fromEPSG, toEPSG;

		if (!fromProj.isUtm) {
			fromEPSG = "EPSG:" + fromProj.epsg;
			if (!zone && toProj.isUtm) {
				let coordX;
				if (fromProj.epsg === 4326) {
					coordX = coords.longitude;
				} else {
					const wgs84 = this.convertCoordinate(coords, sourceProjection, PROJECTIONS.WGS84GEO).coordinate;
					coordX = wgs84.longitude;
				}
				//Calculate the right zone (assuming each zone is 6 degrees)
				zone = Math.floor((coordX + 180) / 6) + 1;
			}
		} else {
			if (!zone) {
				throw new Error("Zone must be defined for this projection");
			}
			fromEPSG = "EPSG:" + (fromProj.epsg + zone);
		}
		if (!toProj.isUtm) {
			zone = null;
			toEPSG = "EPSG:" + toProj.epsg;
		} else {
			if (toProj.is36Extended && zone === 37 && !fromProj.isUtm) {
				if (36 <= coords.longitude && coords.longitude < 37) {
					zone = 36;
				}
			}
			toEPSG = "EPSG:" + (toProj.epsg + zone);
		}

		const outCoords = proj4(fromEPSG, toEPSG, {x: coords.longitude, y: coords.latitude});

		return {coordinate: new Coordinate(+outCoords.y, +outCoords.x, coordinate.altitude), zone: zone};
	}

	public static convertUnits(val: any, source: UNITS, target: UNITS): string {
		if (source !== UNITS.DMS) {
			val = +val;
		}

		if (!val || (isNaN(val) && !Geodesy.validDmsRegex.test(val + ""))) {
			return val + "";
		}

		let d, m, s, isNeg;
		if (source === UNITS.SECONDS) {
			if (target === UNITS.DEGREES) {
				return (val / 3600).toFixed(6);
			} else {
				val = +(val / 3600).toFixed(6);
				isNeg = val < 0;
				if (isNeg) {
					val *= -1;
				}
				d = Math.floor(val);
				m = Math.floor((val - d) * 60);
				s = (val - d - (m / 60)) * 3600;
				if (isNeg) {
					if (d === 0) {
						d = "-0";
					} else {
						d *= -1;
					}
				}
				return `${d}ᵒ${m}'${s.toFixed(4)}"`;
			}
		} else if (source === UNITS.DEGREES) {
			if (target === UNITS.SECONDS) {
				return (val * 3600).toFixed(2);
			} else {
				isNeg = val < 0;
				if (isNeg) {
					val *= -1;
				}
				d = Math.floor(val);
				m = Math.floor((val - d) * 60);
				s = (val - d - (m / 60)) * 3600;
				if (isNeg) {
					if (d === 0) {
						d = "-0";
					} else {
						d *= -1;
					}
				}
				return `${d}ᵒ${m}'${s.toFixed(4)}"`;
			}
		} else if (source === UNITS.DMS) {
			let dmsRegex = /-?\d\d?\.?\d?\d?\d?\d?/g;
			let match = dmsRegex.exec(val + "");
			d = Number(match[0]);

			isNeg = match[0].indexOf("-") > -1;
			if (isNeg) {
				d *= -1;
			}

			match = dmsRegex.exec(val + "");
			m = Number(match[0]);
			match = dmsRegex.exec(val + "");
			s = Number(match[0]);

			if (target === UNITS.SECONDS) {
				s = (d * 3600) + (m * 60) + s;
				if (isNeg) {
					return (s * -1).toFixed(2);
				} else {
					return s.toFixed(2);
				}
			} else {
				d = d + (m / 60) + (s / 3600);
				if (isNeg) {
					return (d * -1).toFixed(6);
				} else {
					return d.toFixed(6);
				}
			}
		}
	}

	public static validate(coordinates: Coordinate, proj: Projection, unit: UNITS = UNITS.DEGREES,
				direction: DIRECTIONS = DIRECTIONS.NORTH, IIIZone?: number): string {
		let lon: string = coordinates.longitude.toString();
		let lat: string = coordinates.latitude.toString();
		let alt: string = coordinates.altitude.toString();
		let zone: string = IIIZone ? IIIZone.toString() : null;
		let projection = proj;

		let validationError: string = null;

		if (!lon || !lat) {
			// if lon or lat are null, undefined or empty string validation fails
			return "!!! !!! !!!! !!!!!!!!";
		} else if (projection.isUtm && !zone) {
			// if the epsg requires zone and it is not valid --> validation fails
			return "!!! !!! !!!! !!!";
		}

		if (zone && zone !== "") {
			if (!/^\d?\d$/g.test(zone)) {
				validationError = "!!! !! !!!! !!!! !!!";
			} else if (+zone > 60 || +zone < 1) {
				validationError = "!!! !!!! !!!!! !!! 1 !60";
			}
		}

		if (alt && alt !== "") {
			if (!/^[0-9]+$/g.test(alt)) {
				validationError = "!!! !! !!!! !!!! !!!!";
			}
		}

		// 0 not allowed in coords -- unknown problem
		if (lon && lon !== "") {
			if (unit !== UNITS.DMS && !/^-?\d{1,8}$/g.test(lon) && !/^\d{1,8}\.\d{1,6}$/g.test(lon)) {
				if (projection.epsg !== 22780 && projection.epsg !== 22770) {
					validationError = "!!! !! !!!! !!!! " + (projection.isUtm ? "East" : "Longitude");
				}
			} else if (projection.isUtm) {
				if (projection.epsg === 22770) {
					if (+lon > 650000 || +lon < 100000) {
						validationError = "EAST !!!! !!!!! !!! 100,000 ! 650,000";
					}
				}
				else if (projection.epsg === 22780) {
					if ((+lon > 200000 || +lon < -350000)) {
						validationError = "EAST !!!! !!!!! !!! 350,000- ! 200,000";
					}
				} else if (+lon > 800000 || +lon < 250000) {
					validationError = "EAST !!!! !!!!! !!! 250,000 ! 800,000";
				}
			} else {
				if (unit === UNITS.DEGREES) {
					if (+lon < -180 || +lon > 180) {
						validationError = "Longitude !!!! !!!!! !!! 180 ! 180-";
					}
				} else if (unit === UNITS.SECONDS) {

				} else {
					if (!this.validDmsRegex.test(lon)) {
						validationError = "!!! DMS !! !!!!";
					}
				}
			}
		}

		// 0 not allowed in coords -- unknown problem
		if (lat && lat !== "") {
			if (unit !== UNITS.DMS && !/^-?\d{1,8}$/g.test(lat) && !/^\d{1,8}\.\d{1,6}$/g.test(lat)) {
				if (projection.epsg !== 22780 && projection.epsg !== 22770) {
					validationError = "!!! !! !!!! !!!! " + (projection.isUtm ? "North" : "Latitude");
				}
			} else if (projection.isUtm) {
				if (projection.epsg === 22770) {
					if (+lon > 650000 || +lon < 0) {
						validationError = "NORTH !!!! !!!!! !!! 0 ! 650,000";
					}
				}
				else if (projection.epsg === 22780) {
					if (+lon > 400000 || +lon < -250000) {
						validationError = "NORTH !!!! !!!!! !!! 250,000- ! 400,000";
					}
				}
				else if (direction === DIRECTIONS.NORTH) {
					if (+lat < 0 || +lat > 8500000) {
						validationError = "North !!!! !!!!! !!! 0 ! 8,500,000";
					}
				} else {
					if (+lat < 0 || +lat > 10000000) {
						validationError = "South !!!! !!!!! !!! 0 ! 10,000,000";
					}
				}
			} else {
				if (unit === UNITS.DEGREES) {
					if (+lat < -90 || +lat > 90) {
						validationError = "Latidude !!!! !!!!! !!! 90 ! 90-";
					}
				} else if (unit === UNITS.SECONDS) {

				} else {
					if (!this.validDmsRegex.test(lat)) {
						validationError = "!!! DMS !! !!!!";
					}
				}
			}
		}

		return validationError;
	}

	public static initilize(): void {
		_.each(PROJECTIONS, (proj: any) => {
			if (proj.format) {
				if (proj.isUtm) {
					//Define a projection for each zone
					for (let i = 1; i <= 60; i++) {
						let format = proj.format;
						if (proj.is36Extended && i === 36) {
							format = proj.format36;
						}
						proj4.defs("EPSG:" + (proj.epsg + i), format.replace("%zone", i));
					}
				} else {
					proj4.defs("EPSG:" + proj.epsg, proj.format);
				}
			}
		});

	}

}