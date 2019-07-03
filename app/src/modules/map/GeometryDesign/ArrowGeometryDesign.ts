import { ArrowType } from "./Enums/ArrowType";
import { GeometryDesign } from "./GeometryDesign";
import { IGeometryDesign } from "./Interfaces/IGeometryDesign";
import { IArrowDesign } from "./Interfaces/IArrowDesign";
import { IArrowGeometryDesign } from "./Interfaces/IArrrowGeometryDesign";

const merge = require("lodash.merge");

const defaultArrowDesign = () => {
	return {
		gap: 500,
		type: ArrowType.Regular,
		isDouble: false
	};
};

export class ArrowGeometryDesign extends GeometryDesign
	implements IArrowGeometryDesign {
	arrow: IArrowDesign;

	constructor(design: IArrowGeometryDesign) {
		super(design);
		this.arrow = merge(defaultArrowDesign(), design.arrow);
	}

	public update(design: IGeometryDesign): void {
		super.update(design);
		const designWithArrow = <IArrowGeometryDesign>design;
		if (designWithArrow.arrow) {
			this.arrow = merge(this.arrow, designWithArrow.arrow);
		}
	}
}
