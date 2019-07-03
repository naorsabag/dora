import { ILayer } from "./ILayer";
import { IMapComponent } from "../Components/IMapComponent";
import { IGeometry } from "../Geometries/IGeometry";
import { ILayerChild } from "./ILayerChild";

export abstract class Layer implements ILayer {
	protected mapComponent: IMapComponent;
	protected geometries: ILayerChild[] = [];
	protected displayed: boolean = false;

	constructor(mapComponent: IMapComponent) {
		this.mapComponent = mapComponent;
	}

	abstract addGeometry(geometry: IGeometry): void;

	abstract removeGeometry(geometry: IGeometry): void;

	abstract show(): void;

	abstract hide(): void;

	abstract remove(): void;

	public getGeometries(): IGeometry[] {
		return this.geometries.slice();
	}
}