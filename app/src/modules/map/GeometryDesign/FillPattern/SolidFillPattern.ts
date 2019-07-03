import { FillPattern } from "./FillPattern";
import { IGeometryWithFillPattern } from "../Interfaces/IGeometryWithFillPattern";
import * as GeoJSON from "@turf/helpers/lib/geojson";

export class SolidFillPattern extends FillPattern {
	public applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void {
	}
}