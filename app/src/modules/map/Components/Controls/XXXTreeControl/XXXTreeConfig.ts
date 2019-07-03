import { IXXXTreeConfig } from "./IXXXTreeConfig";
import * as $ from "jquery";
import { XXXLayer } from "./XXXLayer/XXXLayer";

export class XXXTreeConfig implements IXXXTreeConfig {
	layers: XXXLayer[] = null;
	rememberState: boolean = true;

	public update(config: IXXXTreeConfig) {
		$.extend(this, config);
	}
}