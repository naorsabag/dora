import { IBaseLayersLoader } from "../IBaseLayersLoader";
import { RasterLayer } from "../RasterLayer";

export class GERastersLoader implements IBaseLayersLoader<RasterLayer> {
	public loadLayers(): Promise<RasterLayer[]> {
		throw new Error("Method not implemented.");
	}
}