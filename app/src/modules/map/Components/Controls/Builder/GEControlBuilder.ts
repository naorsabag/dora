import { IControlBuilder } from "./IControlBuilder";
import { IXXXTreeControl } from "../XXXTreeControl/IXXXTreeControl";
import { GoogleEarthMapComponent } from "../../GoogleEarthMapComponent";
import { GEXXXTreeControl } from "../XXXTreeControl/GEXXXTreeControl";
import { GEXXXLayer } from "../XXXTreeControl/XXXLayer/GEXXXLayer";
import { IXXXTreeConfig } from "../XXXTreeControl/IXXXTreeConfig";

export class GEControlBuilder implements IControlBuilder {
	private mapComponent: GoogleEarthMapComponent;

	constructor(mapComponent: GoogleEarthMapComponent) {
		this.mapComponent = mapComponent;
	}

	public buildXXXTreeControl(config?: IXXXTreeConfig): IXXXTreeControl {
		return new GEXXXTreeControl(this.mapComponent, config);
	}

}