import { IconRelativePosition } from "../Enums/IconRelativePosition";

export interface IImageDesign {
	url?: string;
	size?: {width: number, height: number};
	anchor?: {x: number, y: number};
	opacity?: number;
	angle?: number;
	positionPolicy?: IconRelativePosition;
	visibility?: boolean;
}