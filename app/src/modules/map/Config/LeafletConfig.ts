import { ILeafletConfig } from "./ILeafletConfig";
import { ITileLayerProvider } from "./ITileLayerProvider";
import { MapConfig } from "./MapConfig";
import * as L from "leaflet";
import { TileLayerProvider } from "./TileLayerProvider";

export class LeafletConfig extends MapConfig implements ILeafletConfig {
	public crs: L.CRS = L.CRS.EPSG4326;
	public baseLayers: ITileLayerProvider[];
	public overlayLayers: ITileLayerProvider[];
	public useCluster: boolean;
	public preferCanvas: boolean;
	public XXXWMSVectorLayersUrl: string = "LINK";
	public placesLayerProvider: ITileLayerProvider = new TileLayerProvider("LINK", {
		layers: "[XXXStaticGlobe]:1114",
		format: "image/png",
		transparent: true,
		crs: L.CRS.EPSG3857,
		id: "2",
		attribution: ""
	}, true);
}