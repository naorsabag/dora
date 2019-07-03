import { IMapConfig } from "./IMapConfig";
import { ITileLayerProvider } from "./ITileLayerProvider";
import * as L from "leaflet";

export interface ILeafletConfig extends IMapConfig {
	crs?: L.CRS;
	baseLayers: ITileLayerProvider[];
	overlayLayers?: ITileLayerProvider[];
	useCluster?: boolean;
	preferCanvas?: boolean;
	XXXWMSVectorLayersUrl?: string;
	placesLayerProvider?: ITileLayerProvider;
}