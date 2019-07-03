import { ILayer } from "./ILayer";
import { IGeometry } from "../Geometries/IGeometry";

export interface ILayerChild extends IGeometry {
	addToLayer(layer: ILayer);
	removeFromLayer(layer: ILayer);
}