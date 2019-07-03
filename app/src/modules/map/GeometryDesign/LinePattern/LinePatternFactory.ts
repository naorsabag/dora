import { SmallTriangle2LinePattern } from "./SmallTriangle2LinePattern";
import { Arc2LinePattern } from "./Arc2LinePattern";
import { EmptyTriangleLinePattern } from "./EmptyTriangleLinePattern";
import { Triangle2LinePattern } from "./Triangle2LinePattern";
import { LinePatternName } from "../Enums/LinePatternName";
import { DashedLinePattern } from "./DashedLinePattern";
import { ILinePattern } from "../Interfaces/ILinePattern";
import { DoubleLinePattern } from "./DoubleLinePattern";
import { SmallRectangleLinePattern } from "./SmallRectangleLinePattern";
import { Arc1LinePattern } from "./Arc1LinePattern";
import { EmptyRectangleLinePattern } from "./EmptyRectangleLinePattern";
import { SharpTriangleLinePattern } from "./SharpTriangleLinePattern";
import { SmallTriangle1LinePattern } from "./SmallTriangle1LinePattern";
import { DashedDottedLinePattern } from "./DashedDottedLinePattern";
import { DoubleDashedLinePattern } from "./DoubleDashedLinePattern";
import { Triangle1LinePattern } from "./Triangle1LinePattern";
import { XLinePattern } from "./XLinePattern";
import { DitchLinePattern } from "./DitchLinePattern";
import { DottedLinePattern } from "./DottedLinePattern";
import { DoubleEmptyTriangleLinePattern } from "./DoubleEmptyTriangleLinePattern";
import { TwoSidesRectangleLinePattern } from "./TwoSidesRectangleLinePattern";
import { SolidLinePattern } from "./SolidLinePattern";
/**
 * factory for retrieving line pattern object from line pattern name
 */
export class LinePatternFactory {
	private static linePatternDictionary = new Map<LinePatternName, ILinePattern>([
		[LinePatternName.Solid, new SolidLinePattern()],
		[LinePatternName.Dashed, new DashedLinePattern()],
		[LinePatternName.DashedDotted, new DashedDottedLinePattern()],
		[LinePatternName.Double, new DoubleLinePattern()],
		[LinePatternName.DoubleDashed, new DoubleDashedLinePattern()],
		[LinePatternName.Dotted, new DottedLinePattern()],
		[LinePatternName.Arc1, new Arc1LinePattern()],
		[LinePatternName.Arc2, new Arc2LinePattern()],
		[LinePatternName.Ditch, new DitchLinePattern()],
		[LinePatternName.SmallTriangle1, new SmallTriangle1LinePattern()],
		[LinePatternName.SmallTriangle2, new SmallTriangle2LinePattern()],
		[LinePatternName.SmallRectangle, new SmallRectangleLinePattern()],
		[LinePatternName.EmptyTriangle, new EmptyTriangleLinePattern()],
		[LinePatternName.DoubleEmptyTriangle, new DoubleEmptyTriangleLinePattern()],
		[LinePatternName.Triangle1, new Triangle1LinePattern()],
		[LinePatternName.Triangle2, new Triangle2LinePattern()],
		[LinePatternName.X, new XLinePattern()],
		[LinePatternName.SharpTriangle, new SharpTriangleLinePattern()],
		[LinePatternName.TwoSidesRectangle, new TwoSidesRectangleLinePattern()],
		[LinePatternName.EmptyRectangle, new EmptyRectangleLinePattern()]
	]);

	/**
	 * retrieve line pattern object from line pattern name
	 * @param {LinePatternName} linePatternName
	 * @return {ILinePattern} line pattern object
	 */
	public static getPatternObject(linePatternName: LinePatternName): ILinePattern {
		const linePatternObj = this.linePatternDictionary.get(linePatternName);
		return linePatternObj || this.linePatternDictionary.get(LinePatternName.Solid);
	}
}
