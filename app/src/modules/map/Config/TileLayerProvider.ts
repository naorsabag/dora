import { ITileLayerProvider } from "./ITileLayerProvider";
import * as L from "leaflet";

export class TileLayerProvider implements ITileLayerProvider {
	public url: string;
	public isWMS: boolean;
	public options: L.TileLayerOptions;

	constructor(url: string, options: L.TileLayerOptions, isWMS: boolean = false) {
		this.url = url;
		this.options = options;
		this.isWMS = isWMS;
	}
}