import { IViewBounds } from "./IViewBounds";

/**
 * Created by T60352784 on 17/01/2017.
 */

export class ViewBounds implements IViewBounds {
	constructor(public north: number,
				public south: number,
				public west: number,
				public east: number, ) {
	}

	public isEqual(other: ViewBounds): boolean {
		return this.north === other.north &&
			this.south === other.south &&
			this.west === other.west &&
			this.east === other.east;
	}
}