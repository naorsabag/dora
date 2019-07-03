import * as L from "leaflet";

export interface ITileLayerProvider {
	url: string;
	isWMS: boolean;
	options: L.TileLayerOptions;
}