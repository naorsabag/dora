import { Coordinate } from "../Geometries/Coordinate";

export interface IMapConfig {
	mapDivId: string;
	debugMode?: boolean;
	center?: Coordinate;
	XXXVectorLayersUrl?: string;
}