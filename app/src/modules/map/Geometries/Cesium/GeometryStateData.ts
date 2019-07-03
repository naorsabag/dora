import { Coordinate } from "../Coordinate";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { GEOMETRY_TYPES } from "../GeometryTypes";

export class GeometryStateData {
	constructor(public coordinates: Coordinate | Coordinate[] | Coordinate[][],
		public design: IGeometryDesign,
		public type: GEOMETRY_TYPES,
		public id: string) {
	}
}