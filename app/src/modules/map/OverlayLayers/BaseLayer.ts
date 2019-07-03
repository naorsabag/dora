import { IBaseLayer } from "./IBaseLayer";
import { IBaseLayerViewer } from "./LayerViewers/IBaseLayerViewer";

export abstract class BaseLayer implements IBaseLayer {

	public name: string;

	public isSelected: boolean = false;

	protected viewer: IBaseLayerViewer;

	constructor(name: string) {
		this.name = name;
	}

	public async addToMap(onError: () => void = undefined): Promise<void> {
		if (!this.isSelected) {
			try {
				await this.viewer.addToMap(onError);
				this.isSelected = true;
			} catch (e) {
				throw e;
			}
		}
	}

	public async remove(): Promise<void> {
		if (this.isSelected) {
			await this.viewer.remove();
			this.isSelected = false;
		}
	}

	public setViewer(viewer: IBaseLayerViewer): void {
		this.viewer = viewer;
	}
}