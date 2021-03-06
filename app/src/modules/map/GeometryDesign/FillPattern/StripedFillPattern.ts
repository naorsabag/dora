import * as GeoJSON from "@turf/helpers/lib/geojson";
import { FillPattern } from "./FillPattern";
import { IGeometryWithFillPattern } from "../Interfaces/IGeometryWithFillPattern";
import { FillPatternUtils } from "./FillPatternUtils";
import { PatternDirection } from "../Enums/PatternDirection";

export class StripedFillPattern extends FillPattern {
	constructor(public numberOfStripes: number = 16) {
		super();
	}

	public applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void {

		const stripesCoordinates = FillPatternUtils.generateStripes(this.numberOfStripes, polygonGeoJsonFeature, PatternDirection.NE_TO_SW);
		this.applyGeneratedCoordinates(geometry, stripesCoordinates);
	}

}