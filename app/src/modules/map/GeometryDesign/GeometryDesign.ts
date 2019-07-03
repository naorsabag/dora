import { SmoothingType } from "./Enums/SmoothingType";
import { IconRelativePosition } from "./Enums/IconRelativePosition";
import { IFillDesign } from "./Interfaces/IFillDesign";
import { IGeometryDesign } from "./Interfaces/IGeometryDesign";
import { IIconDesign } from "./Interfaces/IIconDesign";
import { ILineDesign } from "./Interfaces/ILineDesign";
import { LabelRelativePosition } from "./Enums/LabelRelativePosition";
import { isArray } from "util";
import { LinePatternName } from "./Enums/LinePatternName";
import { FillPatternName } from "./Enums/FillPatternName";

const merge = require("lodash.merge");
const cloneDeep = require("lodash.clonedeep");

const defaultLineDesign = () => {
	return {
		color: "#ff0000",
		smoothing: SmoothingType.None,
		pattern: LinePatternName.Solid,
		opacity: 1,
		width: 3
	};
};
const defaultFillDesign = () => {
	return {
		color: "rgb(255,255,255)",
		pattern: FillPatternName.Solid,
		opacity: 1
	};
};
const defaultIconDesign = () => {
	return {
		image: {
			url: null,
			size: null,
			anchor: null,
			opacity: 1,
			angle: 0,
			positionPolicy: IconRelativePosition.NorthernPoint,
			visibility: true
		},
		label: {
			text: null,
			opacity: 1,
			visibility: false,
			fontSize: 12,
			positionPolicy: LabelRelativePosition.Top
		}
	};
};

export class GeometryDesign implements IGeometryDesign {
	line: ILineDesign;
	fill: IFillDesign;
	icons: IIconDesign[];

	constructor(inputDesign: IGeometryDesign, useDefaults: boolean = true) {
		if (!useDefaults) {
			this.line = cloneDeep(inputDesign.line);
			this.fill = cloneDeep(inputDesign.fill);
			this.icons = cloneDeep(inputDesign.icons);
		} else {
			this.mergeLineDesignOnConstruct(inputDesign);
			this.mergeFillDesignOnConstruct(inputDesign);
			this.mergeIconDesignOnConstruct(inputDesign);
		}
	}

	private mergeLineDesignOnConstruct(inputDesign: IGeometryDesign) {
		if (inputDesign.line) {
			this.line = merge(defaultLineDesign(), inputDesign.line);
		} else {
			this.line = defaultLineDesign();
		}
	}

	private mergeFillDesignOnConstruct(inputDesign: IGeometryDesign) {
		if (inputDesign.fill) {
			this.fill = merge(defaultFillDesign(), inputDesign.fill);
		} else {
			this.fill = defaultFillDesign();
		}
	}

	private mergeIconDesignOnConstruct(inputDesign: IGeometryDesign) {
		if (inputDesign.icons && isArray(inputDesign.icons)) {
			const iconsToPresent = [];
			//In the case where there are icons, we
			//TODO: tests for this, it's hard
			//TODO just use for of instead of for in with curr
			for (let i = 0; i < inputDesign.icons.length; i++) {
				const currIcon = inputDesign.icons[i];
			}
			inputDesign.icons.forEach(icon => {
				const mergedIcon = merge(defaultIconDesign(), icon);
				iconsToPresent.push(mergedIcon);
			});
			this.icons = iconsToPresent;
		} else {
			this.icons = [];
		}
	}

	public update(design: IGeometryDesign): void {
		//case of another number of icons, we need to create default icons:
		let mergedIcons = [];
		if (design.icons && design.icons.length !== this.icons.length) {
			design.icons.forEach(icon => {
				mergedIcons.push(merge(defaultIconDesign(), icon));
			});
		} else {
			mergedIcons = merge(this.icons, design.icons);
		}
		const merged = merge(this, design);
		this.fill = merged.fill;
		this.line = merged.line;
		this.icons = mergedIcons;
	}
}