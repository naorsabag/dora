import { IBaseLayerViewer } from "./IBaseLayerViewer";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { ICesiumImageryProvider } from "../../Config/ICesiumImageryProvider";

export class CesiumLayerViewer implements IBaseLayerViewer {

	private imageryLayer: any;

	constructor(private mapComponent: CesiumMapComponent, private imageryProvider: ICesiumImageryProvider) {
	}

	public async addToMap(onError: () => void): Promise<void> {

		if (!this.imageryLayer) {
			try {
				let nativeImageryProvider = await this.imageryProvider.initProvider(this.mapComponent);
				await nativeImageryProvider.readyPromise;
				nativeImageryProvider.errorEvent.addEventListener(() => {
					if (onError) {
						onError();
					}
				});

				this.imageryLayer = this.mapComponent.nativeMapInstance.scene.imageryLayers.addImageryProvider(nativeImageryProvider);
				return;
			} catch (e) {
				// Removing the failed layer fixes the rendering of the other Cesium layers that crushed
				await this.remove();
				delete this.imageryLayer;

				throw e;
			}
		} else {
			this.imageryLayer = this.mapComponent.nativeMapInstance.scene.imageryLayers.addImageryProvider(this.imageryLayer.imageryProvider);
			return;
		}
	}

	public async remove(): Promise<void> {
		if (this.imageryLayer) {
			let removeListener = this.mapComponent.nativeMapInstance.scene.imageryLayers.layerRemoved.addEventListener(() => {
				this.mapComponent.nativeMapInstance.scene.imageryLayers.layerRemoved.removeEventListener(removeListener);
				return;
			});

			this.mapComponent.nativeMapInstance.scene.imageryLayers.remove(this.imageryLayer);
		}
	}
}