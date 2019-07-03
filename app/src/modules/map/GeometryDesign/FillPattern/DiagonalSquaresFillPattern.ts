import { FillPattern } from "./FillPattern";
import { IGeometryWithFillPattern } from "../Interfaces/IGeometryWithFillPattern";
import { FillPatternUtils } from "./FillPatternUtils";
import { PatternDirection } from "../Enums/PatternDirection";
import * as GeoJSON from "@turf/helpers/lib/geojson";

export class DiagonalSquaresFillPattern extends FillPattern {
	constructor(public numberOfSquares: number = 256) {
		super();
	}

	public applyToGeometry(geometry: IGeometryWithFillPattern, polygonGeoJsonFeature: GeoJSON.Feature<GeoJSON.Polygon>): void {

		const firstStripes = FillPatternUtils.generateStripes(Math.sqrt(this.numberOfSquares), polygonGeoJsonFeature, PatternDirection.SE_TO_NW);
		const secondStripes = FillPatternUtils.generateStripes(Math.sqrt(this.numberOfSquares), polygonGeoJsonFeature, PatternDirection.SW_TO_NE);
		this.applyGeneratedCoordinates(geometry, [...firstStripes, ...secondStripes]);
	}

}