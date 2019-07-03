import { IControlBuilder } from "./IControlBuilder";
import { IXXXTreeControl } from "../XXXTreeControl/IXXXTreeControl";
import { IXXXTreeConfig } from "../XXXTreeControl/IXXXTreeConfig";
import { CesiumMapComponent } from "../../CesiumMapComponent";
import { CesiumXXXTreeControl } from "../XXXTreeControl/CesiumXXXTreeControl";

export class CesiumControlBuilder implements IControlBuilder {
	private mapComponent: CesiumMapComponent;

	constructor(mapComponent: CesiumMapComponent) {
		this.mapComponent = mapComponent;
	}

	public buildXXXTreeControl(config?: IXXXTreeConfig): IXXXTreeControl {
		return new CesiumXXXTreeControl(this.mapComponent, config);
	}

}