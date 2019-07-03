import { IBaseLayersLoader } from "../IBaseLayersLoader";
import { RasterLayer } from "../RasterLayer";
import { HttpUtils } from "../../Utilities/HttpUtils";
import { IXXXRaster } from "../IXXXRaster";
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";

export class LLRastersLoader implements IBaseLayersLoader<RasterLayer> {

	private readonly DEFAULT_RASTERS_PATH: string =
		"LINK";

	constructor(private mapComponent: LeafletMapComponent) {
	}

	public loadLayers(): Promise<RasterLayer[]> {
		return new Promise((resolve, reject) => {
			HttpUtils.get(this.DEFAULT_RASTERS_PATH).then((rastersData) => {
				let rasterLayers: RasterLayer[] = (<IXXXRaster[]>JSON.parse(rastersData)).map((raster) => {

					let rasterLayer: RasterLayer = new RasterLayer(raster.eng_name, raster.globe_type, raster.peima_year,
						raster.peima_TTT, raster.FFF_name, raster.links);

					return rasterLayer;
				});
				resolve(rasterLayers);
			}).catch(error => {
				console.error("Network issues with the rasters service");
				console.error(error);
				reject(error);
			});
		});
	}
}