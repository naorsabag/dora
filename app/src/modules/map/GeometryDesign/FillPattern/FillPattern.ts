import { Coordinate } from "../../Geometries/Coordinate";
import { IFillPattern } from "../Interfaces/IFillPattern";
import { IGeometryWithFillPattern } from "../Interfaces/IGeometryWithFillPattern";
import * as GeoJSON from "@turf/helpers/lib/geojson";

export abstract class FillPattern implements IFillPattern {
	public abstract applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void;

	protected applyGeneratedCoordinates(geometry: IGeometryWithFillPattern, generatedCoordinates: Coordinate[][]): void {
		geometry.applyMultilineFillPattern(generatedCoordinates);
	}
}