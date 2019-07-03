/**
 * An object that represents the values for directions
 * @type {{NORTH: string, SOUTH: string}}
 */
import { Projection } from "./Projection";

export enum DIRECTIONS {
	NORTH,
	SOUTH
}

/**
 * An object that hold the values for units
 * @type {{DEGREES: string, SECONDS: string, DMS: string}}
 */
export enum UNITS {
	DEGREES,
	SECONDS,
	DMS
}

export const PROJECTIONS: { [key: string]: Projection } = {

	//WGS84 Geographic
	WGS84GEO: new Projection(4326, "WGS84 Geo", "degree"),

	//WGS84 UTM
	WGS84UTM: new Projection(32600, "WGS84 UTM", "meter",
		"+proj=utm +zone=%zone +ellps=WGS84 +datum=WGS84 +units=m +no_defs", true, null, null, 32700),

	//WGS84 UTM S
	WGS84UTMS: new Projection(32700, "WGS84 UTM S", "meter",
		"+proj=utm +zone=%zone +ellps=WGS84 +south +datum=WGS84 +units=m +no_defs", true)
};
