import { RasterLayer } from "../RasterLayer";
import { CesiumLayerViewer } from "../LayerViewers/CesiumLayerViewer";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IBaseLayersLoader } from "../IBaseLayersLoader";
import { IXXXRaster } from "../IXXXRaster";
import { CesiumRasterImageryProvider } from "../../Config/CesiumRasterImageryProvider";
import { HttpUtils } from "../../Utilities/HttpUtils";

export class CesiumRastersLoader implements IBaseLayersLoader<RasterLayer> {

	private readonly DEFAULT_RASTERS_PATH: string =
		"LINK";

	constructor(private mapComponent: CesiumMapComponent) {
	}

	public loadLayers(): Promise<RasterLayer[]> {
		return new Promise((resolve, reject) => {
			HttpUtils.get(this.DEFAULT_RASTERS_PATH).then((rastersData) => {
				let rasterLayers: RasterLayer[] = (<IXXXRaster[]>JSON.parse(rastersData)).map((raster) => {

					let rasterLayer: RasterLayer = new RasterLayer(raster.eng_name, raster.globe_type, raster.peima_year,
						raster.peima_TTT, raster.FFF_name);

					rasterLayer.setViewer(new CesiumLayerViewer(this.mapComponent,
						new CesiumRasterImageryProvider({ url: raster.links.google_maps })));

					return rasterLayer;
				});

				rasterLayers.splice(0, 1);
				resolve(rasterLayers);
			}, (e) => {
				reject(e);
			});
		});
	}
}