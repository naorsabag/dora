import { IMapConfig } from "./IMapConfig";

export interface IGoogleEarthConfig extends IMapConfig {
	crfZZZLayersUrl?: string;
	YYYLayersKmzUrl?: string;
}