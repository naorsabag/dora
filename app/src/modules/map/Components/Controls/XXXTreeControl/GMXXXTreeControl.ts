import { XXXTreeControl } from "./XXXTreeControl";
import { XXXLayer } from "./XXXLayer/XXXLayer";
import { XXXLayerType } from "./XXXLayer/XXXLayerType";

//TODO: implement
export class GMXXXTreeControl extends XXXTreeControl {
	public addToMap(): void {

	}

	protected loadTree(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	protected addControl(): void {
		throw new Error("Method not implemented.");
	}

	public toggleLayers(layers: XXXLayer[], state: boolean) {
		throw new Error("Method not implemented.");
	}

	protected createXXXLayerFromWMS(id: string, text: string, type: XXXLayerType, layerIds: string): XXXLayer {
		throw new Error("Method not implemented.");
	}
}