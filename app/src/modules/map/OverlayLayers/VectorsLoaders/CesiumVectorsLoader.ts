import { IBaseLayersLoader } from "../IBaseLayersLoader";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { VectorLayer } from "../VectorLayer";
import { LayerType } from "../Enums/LayerType";
import { CesiumLayerViewer } from "../LayerViewers/CesiumLayerViewer";
import { IXXXVector } from "../IXXXVector";
import { VectorSource } from "../Enums/VectorSource";
import { CesiumVectorImageryProvider } from "../../Config/CesiumVectorImageryProvider";
import { CesiumRasterImageryProvider } from "../../Config/CesiumRasterImageryProvider";
import { HttpUtils } from "../../Utilities/HttpUtils";
import { Cesium3DBuildingViewer } from "../LayerViewers/Cesium3DBuildingViewer";

const Cesium = require("cesium/Source/Cesium.js");

export class CesiumVectorsLoader implements IBaseLayersLoader<VectorLayer> {
	private readonly DEFAULT_VECTORS_PATH: string = "LINK";
	private readonly SPECIAL_VECTORS_PATH: string = "LINK";
	private readonly BUILDINGS_3D_NAME: string = "!!!! !!!!!ם - !!! !!!!";
	private layersToReturn: VectorLayer[] = [];

	constructor(private mapComponent: CesiumMapComponent) {
	}

	public loadLayers(): Promise<VectorLayer[]> {
		return new Promise((resolve, reject) => {

			let parentFolders: VectorLayer[] = [];

			// Loading regular vectors
			HttpUtils.get(this.DEFAULT_VECTORS_PATH).then((vectorsData) => {
				let vectorLayers: VectorLayer[] = (<IXXXVector[]>(JSON.parse(vectorsData)).items).map((vector) => {
					let layerType = (vector.category_parent_id || vector.layer_ids) ? LayerType.Layer : LayerType.Folder;
					let vectorLayer: VectorLayer = new VectorLayer(vector.category_id, VectorSource.XXX, vector.category_name,
						layerType, Number(vector.category_parent_id) || undefined);

					if (vectorLayer.type === LayerType.Layer) {
						if (vector.category_name === this.BUILDINGS_3D_NAME) {
							vectorLayer.setViewer(new Cesium3DBuildingViewer(this.mapComponent));
						} else {
							vectorLayer.setViewer(new CesiumLayerViewer(this.mapComponent,
								new CesiumVectorImageryProvider({layers: vector.layer_ids})));
						}
					} else {
						parentFolders.push(vectorLayer);
					}
					// Checking for layers that are not a part of a folder
					if (!vector.category_parent_id && vector.layer_ids) {
						this.layersToReturn.push(vectorLayer);
					}

					return (vectorLayer);
				});

				this.loadSpecialVectors();
				this.loadSpecialRasters();

				parentFolders.forEach(parentFolder => {
					parentFolder.children = vectorLayers.filter((layer) => {
						return (layer.parentID === parentFolder.id);
					});
				});

				resolve(parentFolders.concat(this.layersToReturn));
			}, (e) => {
				reject(e);
			});
		});
	}

	private loadSpecialVectors(): void {
		let vectorRegishim: VectorLayer = new VectorLayer("regishim", VectorSource.XXX,
			"!!!!!!ם !!!!!ם", LayerType.Layer);
		vectorRegishim.setViewer(new CesiumLayerViewer(this.mapComponent,
			new CesiumVectorImageryProvider({url: "LINK"})));

		this.layersToReturn.push(vectorRegishim);

		let vectorOrtophoto: VectorLayer = new VectorLayer("orthophotoDatails", VectorSource.XXX,
			"!!!! !!!!!!!!!!", LayerType.Layer);
		vectorOrtophoto.setViewer(new CesiumLayerViewer(this.mapComponent,
			new CesiumVectorImageryProvider({url: "LINK"})));

		this.layersToReturn.push(vectorOrtophoto);
	}

	private loadSpecialRasters(): void {
		let rasterBasic: VectorLayer = new VectorLayer("baseVectorLayer", VectorSource.XXX,
			"!!!! !!!!! !!!!!! (!!!!!ם, !!!!!!, !!!!!!ם)", LayerType.Layer);
		rasterBasic.setViewer(new CesiumLayerViewer(this.mapComponent,
			new CesiumRasterImageryProvider
			({
				url: this.SPECIAL_VECTORS_PATH,
				tilingScheme: new Cesium.WebMercatorTilingScheme(),
				maximumLevel: 18
			}, 1)));

		this.layersToReturn.push(rasterBasic);

		let rasterShlita: VectorLayer = new VectorLayer("shlitaVectorLayer", VectorSource.XXX,
			"!!!!! (!!!\"!, !!\"ם)", LayerType.Layer);
		rasterShlita.setViewer(new CesiumLayerViewer(this.mapComponent,
			new CesiumRasterImageryProvider
			({
				url: this.SPECIAL_VECTORS_PATH,
				tilingScheme: new Cesium.WebMercatorTilingScheme(),
				maximumLevel: 18
			}, 2)));

		this.layersToReturn.push(rasterShlita);
	}
}