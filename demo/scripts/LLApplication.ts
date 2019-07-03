import { TileLayerProvider } from "../../app/src/modules/map/Config/TileLayerProvider";
import { ILeafletConfig } from "../../app/src/modules/map/Config/ILeafletConfig";
import { LeafletMapComponent } from "../../app/src/modules/map/Components/LeafletMapComponent";
import { Application } from "./Application";
import * as L from "leaflet";

let config: ILeafletConfig = {
	mapDivId: "map",
	baseLayers: [
		new TileLayerProvider("LINK",
			{
				layers: "[PEIMAT_MIPUY]:1065",
				format: "image/png",
				transparent: true,
				crs: L.CRS.EPSG4326,
				attribution: "!!!!! !!!!!",
			}, true)
	],
	useCluster: true,
	preferCanvas: true
};

export class LLApplication extends Application {
	constructor() {
		super(new LeafletMapComponent(config));
	}
}