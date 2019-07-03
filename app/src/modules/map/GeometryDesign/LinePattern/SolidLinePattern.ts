import { Coordinate } from "../../Geometries/Coordinate";
import { IGeometryWithLinePattern } from "../Interfaces/IGeometryWithLinePattern";
import { LinePattern } from "./LinePattern";

export class SolidLinePattern extends LinePattern {
	constructor() {
		super(null, 1);
	}

	public applyToGeometry(geometry: IGeometryWithLinePattern, coordinates: Coordinate[]): void {
	}
}