import * as GeoJSON from "@turf/helpers/lib/geojson";
import * as wellknown from "wellknown";
import { MapError } from "../../Common/MapError";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { ILayer } from "../../Layers/ILayer";
import { MapUtils } from "../../MapUtils/MapUtils";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { Geometry } from "../Geometry";
import { GEOMETRY_TYPES } from "../GeometryTypes";
import { IGeometry } from "../IGeometry";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { IGeometryBuilder } from "./IGeometryBuilder";

export abstract class GeometryBuilder implements IGeometryBuilder {
	public abstract buildLayer(): ILayer;

	public abstract buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point;

	public abstract buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line;

	public abstract buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow;

	public abstract buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon;

	public abstract buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine;

	/**
	 * @param {any} the native map entity
	 * @returns {Geometry} Dora's geometry according to the entity
	 */
	public abstract buildFromNativeEntity(entity: any): Geometry;

	public buildFromWkt(wkt: string, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry {
		let geoJsonGeometry: GeoJSON.Geometry = wellknown.parse(wkt);
		if (geoJsonGeometry === null) {
			throw new MapError("Invalid wkt", "!!!!!!!!! !! !!!!!");
		}
		return this.buildFromGeoJSON(geoJsonGeometry, geometryType, design);
	}

	public buildFromGeoJSONFeature<T extends GeoJSON.Geometry>(feature: GeoJSON.Feature<T>, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry {
		return this.buildFromGeoJSON(feature, geometryType, design);
	}

	public buildFromGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry {
		let geoJsonGeometry: GeoJSON.Geometry;
		const GEO_JSON_SPECIAL_SHAPES_TYPE_NAME = "Feature";

		if (geometry.type === GEO_JSON_SPECIAL_SHAPES_TYPE_NAME) {
			geoJsonGeometry = (geometry as GeoJSON.Feature<T>).geometry;
		} else {
			geoJsonGeometry = (geometry as T);
		}

		if (geometryType === null || geometryType === undefined) {
			geometryType = this.getGeometryType(geoJsonGeometry, design);
		}
		return this.getGeometryByType(geoJsonGeometry, geometryType, design);
	}

	private getGeometryType(geoJsonGeometry: GeoJSON.Geometry, design: IGeometryDesign): GEOMETRY_TYPES {
		let geometryType: GEOMETRY_TYPES;
		const geometryTypeStr = geoJsonGeometry.type;
		switch (geometryTypeStr) {
			case "Point":
				geometryType = GEOMETRY_TYPES.POINT;
				break;
			case "Polygon":
				geometryType = GEOMETRY_TYPES.POLYGON;
				break;
			case "LineString":
				geometryType = GEOMETRY_TYPES.LINE;
				if (design && (<IDoubleLineGeometryDesign>design).secondLine) {
					geometryType = GEOMETRY_TYPES.DOUBLE_LINE;
				}
				if (design && (<IArrowGeometryDesign>design).arrow) {
					geometryType = GEOMETRY_TYPES.ARROW;
				}
				break;
			default:
				throw new Error(
					"Unsupported geometry type: " + geometryTypeStr
				);
		}
		return geometryType;
	}

	private getGeometryByType(geoJsonGeometry: GeoJSON.Geometry, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry {
		let geometry: IGeometry;

		switch (geometryType) {
			case GEOMETRY_TYPES.POINT:
				const coordinate: Coordinate = Coordinate.fromGeoJSON((geoJsonGeometry as GeoJSON.Point).coordinates);

				geometry = this.buildPoint(coordinate, design);
				break;
			case GEOMETRY_TYPES.LINE:
				const lineCoordinates: Coordinate[] = MapUtils.convertGeoJsonCoordinatesToCoordinates((geoJsonGeometry as GeoJSON.LineString).coordinates);
				geometry = this.buildLine(lineCoordinates, design);
				break;
			case GEOMETRY_TYPES.ARROW:
				const arrowCoordinates: Coordinate[] = MapUtils.convertGeoJsonCoordinatesToCoordinates((geoJsonGeometry as GeoJSON.LineString).coordinates);
				geometry = this.buildArrow(arrowCoordinates, <IArrowGeometryDesign>design);
				break;
			case GEOMETRY_TYPES.POLYGON:
				const ringsCoordinates: Coordinate[][] = (geoJsonGeometry as GeoJSON.Polygon).coordinates.map(
					ring => MapUtils.convertGeoJsonCoordinatesToCoordinates(ring));

				geometry = this.buildPolygon(ringsCoordinates, design);
				break;
			case GEOMETRY_TYPES.DOUBLE_LINE:
				const dblLineCoordinates: Coordinate[] = MapUtils.convertGeoJsonCoordinatesToCoordinates((geoJsonGeometry as GeoJSON.LineString).coordinates);
				geometry = this.buildDoubleLine(dblLineCoordinates, <IDoubleLineGeometryDesign>design);
				break;
			default:
				throw new Error("Unsupported geometry type");
		}
		return geometry;
	}
}
