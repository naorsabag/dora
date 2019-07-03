import { ICesiumImageryProvider } from "./ICesiumImageryProvider";
import { CesiumMapComponent } from "../Components/CesiumMapComponent";

const Cesium = require("cesium/Source/Cesium");

export class CesiumVectorImageryProvider implements ICesiumImageryProvider {

	private readonly DEFAULT_VECTOR_PATH = "LINK";

	public initProvider(mapComponent: CesiumMapComponent): Promise<any> {
		return new Promise((resolve) => {
			let tileSize: number = (Math.max(mapComponent.nativeMapInstance.canvas.height, mapComponent.nativeMapInstance.canvas.width) / 2);

			this.options.tileHeight = this.options.tileHeight || tileSize;
			this.options.tileWidth = this.options.tileWidth || tileSize;

			resolve(new Cesium.ArcGisMapServerImageryProvider(this.options));
		});
	}

	constructor(public options: any = {}) {

		this.options.url = this.options.url || this.DEFAULT_VECTOR_PATH;
	}
}