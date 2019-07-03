import { LabelRelativePosition } from "../Enums/LabelRelativePosition";

export interface ILabelDesign {
	text?: string;
	opacity?: number;
	visibility?: boolean;
	fontSize?: number;
	positionPolicy?: LabelRelativePosition;
}