import * as GeoJSON from "@turf/helpers/lib/geojson";
import { FillPattern } from "./FillPattern";
import { IGeometryWithFillPattern } from "../Interfaces/IGeometryWithFillPattern";
import { FillPatternUtils } from "./FillPatternUtils";
import { PatternDirection } from "../Enums/PatternDirection";

export class HorizontalStripedFillPattern extends FillPattern {
	constructor(public numberOfStripes: number = 16) {
		super();
	}

	public applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void {
		const stripesCoordinates = FillPatternUtils.generateStripes(this.numberOfStripes, polygonGeoJsonFeature, PatternDirection.W_TO_E);
		this.applyGeneratedCoordinates(geometry, stripesCoordinates);
	}

}