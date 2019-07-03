import { Arc2LinePattern } from "./LinePattern/Arc2LinePattern";
import { GeometryDesign } from "./GeometryDesign";
import { IDoubleLineGeometryDesign } from "./Interfaces/IDoubleLineGeometryDesign";
import { ILineDesign } from "./Interfaces/ILineDesign";
import { IGeometryDesign } from "./Interfaces/IGeometryDesign";
import { LinePatternName } from "./Enums/LinePatternName";


const merge = require("lodash.merge");

export class DoubleLineGeometryDesign extends GeometryDesign
	implements IDoubleLineGeometryDesign {
	secondLine: ILineDesign = {
		color: "#0000ff",
		pattern: LinePatternName.Arc2,
	};

	constructor(design: IDoubleLineGeometryDesign) {
		super(design);
	}

	public update(design: IGeometryDesign): void {
		super.update(design);
		const designWithDoubleLine = <IDoubleLineGeometryDesign>design;
		if (designWithDoubleLine.secondLine) {
			this.secondLine = merge(this.secondLine, designWithDoubleLine.secondLine);
		}
	}
}
