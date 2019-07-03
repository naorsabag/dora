import * as GeoJSON from "@turf/helpers/lib/geojson";
import { FillPattern } from "./FillPattern";
import { IGeometryWithFillPattern } from "../Interfaces/IGeometryWithFillPattern";
import { FillPatternUtils } from "./FillPatternUtils";
import { PatternDirection } from "../Enums/PatternDirection";

export class SquaresFillPattern extends FillPattern {
	constructor(public numberOfSquares: number = 256) {
		super();
	}

	public applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void {

		const verticalStripes = FillPatternUtils.generateStripes(Math.sqrt(this.numberOfSquares), polygonGeoJsonFeature, PatternDirection.S_TO_N);
		const horizontalStripes = FillPatternUtils.generateStripes(Math.sqrt(this.numberOfSquares), polygonGeoJsonFeature, PatternDirection.W_TO_E);
		this.applyGeneratedCoordinates(geometry, [...verticalStripes, ...horizontalStripes]);
	}

}