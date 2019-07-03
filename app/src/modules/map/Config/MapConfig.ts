import { Coordinate } from "../Geometries/Coordinate";
import { IMapConfig } from "./IMapConfig";
import * as _ from "underscore";

export class MapConfig implements IMapConfig {
	public mapDivId: string;
	public debugMode: boolean = false;
	public center: Coordinate = new Coordinate(31.529825, 34.925014);
	public XXXVectorLayersUrl: string = "LINK";

	public update(config: IMapConfig) {
		_.extend(this, config);
	}
}