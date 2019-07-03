import * as GeoJSON from "@turf/helpers/lib/geojson";
import { IGeometryWithFillPattern } from "./IGeometryWithFillPattern";

export interface IFillPattern {
	applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void;
}