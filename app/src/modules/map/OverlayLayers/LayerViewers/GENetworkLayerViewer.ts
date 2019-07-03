import { IBaseLayerViewer } from "./IBaseLayerViewer";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { NetworkLink } from "../../Components/Controls/XXXTreeControl/XXXLayer/NetworkLink";
import { BaseLayer } from "../BaseLayer";

export class GELayerViewer implements IBaseLayerViewer {

	constructor(mapComponent: GoogleEarthMapComponent, networkLink: NetworkLink) {
	}

	public addToMap(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	public remove(): Promise<void> {
		throw new Error("Method not implemented.");
	}
}