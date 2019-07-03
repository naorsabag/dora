import { IBaseLayersLoader } from "../IBaseLayersLoader";
import { RasterLayer } from "../RasterLayer";

export class GMRastersLoader implements IBaseLayersLoader<RasterLayer> {
	public loadLayers(): Promise<RasterLayer[]> {
		throw new Error("Method not implemented.");
	}
}