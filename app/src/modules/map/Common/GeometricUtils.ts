export class GeometricUtils {

	private static getSlope(x1: number, y1: number, x2: number, y2: number): number {
		if (x1 === x2) {
			return Infinity;
		}
		else {
			return (y2 - y1) / (x2 - x1);
		}
	}

	private static getYInt(x1: number, y1: number, x2: number, y2: number): number {
		if (x1 === x2) {
			return y1 === 0 ? 0 : Infinity;
		}
		if (y1 === y2) {
			return y1;
		}
		return y1 - this.getSlope(x1, y1, x2, y2) * x1;
	}

	private static getXInt(x1: number, y1: number, x2: number, y2: number): number {
		let slope;
		if (y1 === y2) {
			return x1 === 0 ? 0 : Infinity;
		}
		if (x1 === x2) {
			return x1;
		}
		slope = this.getSlope(x1, y1, x2, y2);
		return (-1 * (slope * x1 - y1)) / slope;
	}

	public static getLineIntersection(x11: number, y11: number, x12: number, y12: number, x21: number, y21: number, x22: number, y22: number): number[] {
		let slope1, slope2, yint1, yint2, intx, inty;
		if (x11 === x21 && y11 === y21) {
			return [x11, y11];
		}
		if (x12 === x22 && y12 === y22) {
			return [x12, y12];
		}

		slope1 = this.getSlope(x11, y11, x12, y12);
		slope2 = this.getSlope(x12, y12, x22, y22);

		if (slope1 === slope2) {
			return null; //for parallerl lines
		}

		yint1 = this.getYInt(x11, y11, x12, y12);
		yint2 = this.getYInt(x21, y21, x22, y22);

		if (yint1 === yint2) {
			return yint1 === Infinity ? null : [0, yint1];
		}

		if (slope1 === Infinity) {
			return [y21, slope2 * y21 + yint2];
		}
		if (slope2 === Infinity) {
			return [y11, slope1 * y11 + yint1];
		}
		intx = (slope1 * x11 + yint1 - yint2) / slope2;
		return [intx, slope1 * intx + yint1];
	}
}