import * as colorString from "color-string";

export class ColorRgba {
	constructor(public R: number, public G: number, public B: number, public A: number) {
	}

	public static fromColorString(color: string) {
		let rgbArray: number[] = colorString.get.rgb(color);
		return new ColorRgba(rgbArray[0], rgbArray[1], rgbArray[2], rgbArray[3]);
	}
}