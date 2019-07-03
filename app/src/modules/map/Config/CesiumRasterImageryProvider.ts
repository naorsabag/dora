import { ICesiumImageryProvider } from "./ICesiumImageryProvider";
import { HttpUtils } from "../Utilities/HttpUtils";

const Cesium = require("cesium/Source/Cesium");

export class CesiumRasterImageryProvider implements ICesiumImageryProvider {

	private readonly DEFAULT_IMAGERY_PROVIDER: string = "LINK";

	public initProvider(): Promise<any> {
		return new Promise((resolve, reject) => {
			HttpUtils.get(this.options.url).then((imageryData) => {
				imageryData = JSON.parse(imageryData.split("=")[1]);
				let path = imageryData.serverUrl.replace("LINK");

				this.options.url = "LINK" +
					imageryData.layers[this.layerIndex].requestType + "&channel=" + imageryData.layers[this.layerIndex].id +
					"&version=" + imageryData.layers[this.layerIndex].version + "&x={x}&y={y}&z={z}";

				resolve(new Cesium.UrlTemplateImageryProvider(this.options));
			}, (e) => {
				reject(e);
			});
		});
	}

	constructor(public options: any = {}, private layerIndex: number = 0) {

		this.options.url = this.options.url || this.DEFAULT_IMAGERY_PROVIDER;

		this.options.tilingScheme = this.options.tilingScheme || new Cesium.GeographicTilingScheme({
			numberOfLevelZeroTilesX: 1,
			numberOfLevelZeroTilesY: 1,
			rectangle: new Cesium.Rectangle(-Cesium.Math.PI, -Cesium.Math.PI, Cesium.Math.PI, Cesium.Math.PI)
		});

		this.options.maximumLevel = this.options.maximumLevel || 24;

		this.options.subdomains = this.options.subdomains || ["", /*"-prx01",*/ "-prx02", "-prx03", /*"-prx04",*/ "-prx05", "-prx06", "-prx07"];
	}
}