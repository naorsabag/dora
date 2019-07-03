import { IBaseLayerViewer } from "./IBaseLayerViewer";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { BaseLayer } from "../BaseLayer";

export class GELayerViewer implements IBaseLayerViewer {

	constructor(mapComponent: GoogleEarthMapComponent, geFeature: google.earth.KmlFeature) {
	}

	public addToMap(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	public remove(): Promise<void> {
		throw new Error("Method not implemented.");
	}
}