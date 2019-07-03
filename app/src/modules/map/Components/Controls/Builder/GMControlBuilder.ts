import { GoogleMapsMapComponent } from "../../GoogleMapsMapComponent";
import { IControlBuilder } from "./IControlBuilder";
import { IXXXTreeControl } from "../XXXTreeControl/IXXXTreeControl";
import { IXXXTreeConfig } from "../XXXTreeControl/IXXXTreeConfig";
import { GMXXXTreeControl } from "../XXXTreeControl/GMXXXTreeControl";

export class GMControlBuilder implements IControlBuilder {
	private mapComponent: GoogleMapsMapComponent;

	constructor(mapComponent: GoogleMapsMapComponent) {
		this.mapComponent = mapComponent;
	}

	public buildXXXTreeControl(config?: IXXXTreeConfig): IXXXTreeControl {
		return new GMXXXTreeControl(this.mapComponent, config);
	}
}
