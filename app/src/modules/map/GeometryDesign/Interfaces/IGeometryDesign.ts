import { IFillDesign } from "./IFillDesign";
import { IIconDesign } from "./IIconDesign";
import { ILineDesign } from "./ILineDesign";

/**
 * Represents the design object for rendering the geometries on map according to the design
 */
export interface IGeometryDesign {
	line?: ILineDesign;
	fill?: IFillDesign;
	icons?: IIconDesign[];

	/**
	 * update the object by merging the new design properties
	 * @param design include the new design properties
	 */
	update?(design: IGeometryDesign): void;
}