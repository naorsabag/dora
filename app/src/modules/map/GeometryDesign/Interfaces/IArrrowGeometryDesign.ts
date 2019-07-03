import { IArrowDesign } from "./IArrowDesign";
import { IGeometryDesign } from "./IGeometryDesign";

export interface IArrowGeometryDesign extends IGeometryDesign {
	arrow?: IArrowDesign;
}