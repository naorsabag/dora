import { IBaseLayerViewer } from "./IBaseLayerViewer";
import { GoogleMapsMapComponent } from "../../Components/GoogleMapsMapComponent";
import { BaseLayer } from "../BaseLayer";

export class GMLayerViewer implements IBaseLayerViewer {

	constructor(mapComponent: GoogleMapsMapComponent) {
	}

	public addToMap(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	public remove(): Promise<void> {
		throw new Error("Method not implemented.");
	}
}