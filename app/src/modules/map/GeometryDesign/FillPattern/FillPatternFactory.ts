import { HorizontalStripedFillPattern } from "./HorizontalStripedFillPattern";
import { FillPatternName } from "../Enums/FillPatternName";
import { VerticalStripedFillPattern } from "./VerticalStripedFillPattern";
import { DiagonalSquaresFillPattern } from "./DiagonalSquaresFillPattern";
import { StripedFillPattern } from "./StripedFillPattern";
import { IFillPattern } from "../Interfaces/IFillPattern";
import { SquaresFillPattern } from "./SquaresFillPattern";
import { SolidFillPattern } from "./SolidFillPattern";

/**
 * factory for retrieving fill pattern object from fill pattern name
 */
export class FillPatternFactory {
	private static fillPatternDictionary = new Map<FillPatternName, IFillPattern>([
		[FillPatternName.Solid, new SolidFillPattern()],
		[FillPatternName.Striped, new StripedFillPattern()],
		[FillPatternName.VerticalStriped, new VerticalStripedFillPattern()],
		[FillPatternName.HorizontalStriped, new HorizontalStripedFillPattern()],
		[FillPatternName.Squares, new SquaresFillPattern()],
		[FillPatternName.DiagonalSquares, new DiagonalSquaresFillPattern()]
	]);

	/**
	 * retrieve fill pattern object from fill pattern name
	 * @param {FillPatternName} fillPatternName
	 * @return {IFillPattern} fill pattern object
	 */
	public static getPatternObject(fillPatternName: FillPatternName): IFillPattern {
		const linePatternObj = this.fillPatternDictionary.get(fillPatternName);
		return linePatternObj || this.fillPatternDictionary.get(FillPatternName.Solid);
	}
}
