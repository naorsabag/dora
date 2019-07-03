import { IGeometryDesign } from "./IGeometryDesign";
import { ILineDesign } from "./ILineDesign";

export interface IDoubleLineGeometryDesign extends IGeometryDesign {
	secondLine?: ILineDesign;
}