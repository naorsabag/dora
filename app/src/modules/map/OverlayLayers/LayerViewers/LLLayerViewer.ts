import { IBaseLayerViewer } from "./IBaseLayerViewer";
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { TileLayerProvider } from "../../Config/TileLayerProvider";
import { BaseLayer } from "../BaseLayer";

export class LLLayerViewer implements IBaseLayerViewer {

	constructor(mapComponent: LeafletMapComponent, provider: TileLayerProvider) {
	}

	public addToMap(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	public remove(): Promise<void> {
		throw new Error("Method not implemented.");
	}
}