import { MapConfig } from "./MapConfig";
import { IGoogleEarthConfig } from "./IGoogleEarthConfig";

export class GoogleEarthConfig extends MapConfig implements IGoogleEarthConfig {
	public crfZZZLayersUrl: string = "LINK";
	public YYYLayersKmzUrl: string = "LINK";
}