import { IControlBuilder } from "./IControlBuilder";
import { LeafletMapComponent } from "../../LeafletMapComponent";
import { LLXXXTreeControl } from "../XXXTreeControl/LLXXXTreeControl";
import { IXXXTreeControl } from "../XXXTreeControl/IXXXTreeControl";
import { LLXXXLayer } from "../XXXTreeControl/XXXLayer/LLXXXLayer";
import { IXXXTreeConfig } from "../XXXTreeControl/IXXXTreeConfig";

export class LLControlBuilder implements IControlBuilder {
	private mapComponent: LeafletMapComponent;

	constructor(mapComponent: LeafletMapComponent) {
		this.mapComponent = mapComponent;
	}

	public buildXXXTreeControl(config?: IXXXTreeConfig): IXXXTreeControl {
		return new LLXXXTreeControl(this.mapComponent, config);
	}

}