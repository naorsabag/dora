import { FillPatternName } from "../Enums/FillPatternName";

export interface IFillDesign {
	pattern?: FillPatternName; // API break
	color?: string;
	opacity?: number;
}