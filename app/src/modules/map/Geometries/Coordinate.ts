export interface ICoordinate {
	latitude: number;
	longitude: number;
	altitude?: number;
}

function isLatitude(objOrLatitude: number | ICoordinate): objOrLatitude is number {
	return typeof objOrLatitude === "number" || objOrLatitude === null;
}

export class Coordinate implements ICoordinate {

	public latitude: number;
	public longitude: number;
	public altitude: number;

	constructor(latitude: number, longitude: number, altitude?: number);
	constructor(coordinate: ICoordinate);
	constructor(objOrLatitude: ICoordinate | number, longitude?: number, altitude: number = 500000) {
		if (isLatitude(objOrLatitude)) {
			this.latitude = objOrLatitude;
			this.longitude = longitude;
			this.altitude = altitude;
		} else {
			this.latitude = objOrLatitude.latitude;
			this.longitude = objOrLatitude.longitude;
			this.altitude = typeof objOrLatitude.altitude === "number" ? objOrLatitude.altitude : 500000;
		}
	}

	public static fromGeoJSON(coordinate: number[]): Coordinate {
		return new this(coordinate[1], coordinate[0], coordinate[2]);
	}

	public getGeoJSON(getAltitude: boolean = true): number[] {
		if (getAltitude) {
			return [this.longitude, this.latitude, this.altitude];
		} else {
			return [this.longitude, this.latitude];
		}
	}

	public getWKT(): string {
		return `${this.longitude} ${this.latitude}`;
	}

	public clone(): Coordinate {
		return new Coordinate(this);
	}
}
