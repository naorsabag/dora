import { GeometryDesign } from "./GeometryDesign";
import { IIconDesign } from "./Interfaces/IIconDesign";
import { IImageDesign } from "./Interfaces/IImageDesign";
import { ILabelDesign } from "./Interfaces/ILabelDesign";

const merge = require("lodash.merge");

export class IconDesign implements IIconDesign {
	image: IImageDesign;
	label: ILabelDesign;

	constructor(design: IIconDesign) {
		const defaultDesign = new GeometryDesign({icons: [design]});
		this.image = defaultDesign.icons[0].image;
		this.label = defaultDesign.icons[0].label;
	}

	public update(design: IIconDesign): void {
		merge(this, design);
	}
}