import { IMapComponent } from "../../IMapComponent";
import { IXXXTreeControl } from "../XXXTreeControl/IXXXTreeControl";
import { XXXLayer } from "../XXXTreeControl/XXXLayer/XXXLayer";
import { IXXXTreeConfig } from "../XXXTreeControl/IXXXTreeConfig";

export interface IControlBuilder {
	/**
	 * Create the XXX tree control.
	 */
	buildXXXTreeControl(config?: IXXXTreeConfig): IXXXTreeControl;
}