import { SmoothingType } from "../Enums/SmoothingType";
import { LinePatternName } from "../Enums/LinePatternName";

export interface ILineDesign {
	color?: string;
	smoothing?: SmoothingType;
	pattern?: LinePatternName; // API break
	opacity?: number;
	width?: number;
}