import * as GeoJSON from "@turf/helpers/lib/geojson";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { ILayer } from "../../Layers/ILayer";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { GEOMETRY_TYPES } from "../GeometryTypes";
import { IGeometry } from "../IGeometry";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { Geometry } from "../Geometry";

export interface IGeometryBuilder {
	//API break
	buildLayer(): ILayer;

	/**
	 * Builds a point geometry which is ready for use in the map.
	 * @param coordinate the coordinate of the point.
	 * @param  [design] the design of the point to merge to the default design.
	 * @returns point object which suitable for the concrete map
	 */
	buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point;

	/**
	 * Builds a polyline geometry which is ready for use in the map.
	 * @param  coordinates array of coordinates of the polyline.
	 * @param  [design] the design of the polyline to merge to the default design.
	 * @returns line object which suitable for the concrete map
	 */
	buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line;

	/**
	 * Builds an arrow geometry which is ready for use in the map.
	 * @param coordinates array of coordinates of the main line of the arrow.
	 * @param [design] the design of the arrow which includes also the arrow behavior,
	 *                                                    to merge to the default arrow design.
	 * @returns arrow object which suitable for the concrete map
	 */
	buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow;

	/**
	 * Builds a polygon geometry which is ready for use in the map.
	 * @param coordinates coordinates of the polygon.
	 *  Can be array of coordinates to represent the shell of the polygon only,
	 *  or matrix of coordinates to represent hierarchical polygon which the first array is the shell ring,
	 *  and the others are the holes rings
	 * @param [design] the design of the polygon which includes also fill design,
	 *                                            to merge to the default design.
	 * @returns polygon object which suitable for the concrete map
	 */
	buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon;

	/**
	 * Builds a doubled polyline geometry which is ready for use in the map.
	 * @param coordinates array of coordinates of the polyline.
	 * @param [design] the design of the polyline which includes also second line design,
	 * to merge to the default double line design.
	 * @returns double line object which suitable for the concrete map
	 */
	buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine;

	/**
	 * create geometry from native map entity
	 * @param the native map entity
	 * @returns Dora's geometry according to the entity
	 */
	buildFromNativeEntity(entity: any): Geometry;

	/**
	 * Builds geometry from wkt string and design.
	 * @param wkt represents the geometry in well known text standart.
	 * @param [geometryType] dora's geometry type.
	 * when not provided the geomerty type will be guessed by the wkt type and special designs
	 * (ex: arrow is line in wkt, but has arrow design object in design)
	 * @param [design] the design of the geometry to merge to the default design.
	 * @returns dora's geometry object
	 * @throws invalid wkt string
	 */
	buildFromWkt(wkt: string, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry;

	/**
	 * Builds geometry from geoJSON and design.
	 * @deprecated Will be **deprecate on version 1.0.0**, use `buildFromGeoJSON` function instead.
	 * @param  feature represents the geometry in geoJSON feature.
	 * @param [geometryType] dora's geometry type.
	 * when not provided the geomerty type will be guessed by the geoJSON type and special designs
	 * (ex: arrow is line in geoJSON, but has arrow design object in design)
	 * @param [design] the design of the geometry to merge to the default design.
	 * @returns dora's geometry object
	 * @throws Unsupported geometry type
	 */
	buildFromGeoJSONFeature<T extends GeoJSON.Geometry>(feature: GeoJSON.Feature<T>, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry;

	/**
	 * builds `@dora` geometry by a given geoJSON or geoJSONFeature geometry and a @dora design.
	 * @param { GeoJSON.Geometry | GeoJSON.Feature } geometry represents the geoJSON geometry or feature.
	 * @param { GEOMETRY_TYPES? } geometryType [**Optional**] dora's geometry type.
	 * when not provided the geomerty type will be guessed by the geoJSON type and special designs
	 * (ex: arrow is line in geoJSON, but has arrow design object in design)
	 * @param { IGeometryDesign? } design [**Optional**] the design of the geometry to merge to the default design.
	 * @returns dora's geometry object
	 * @throws Unsupported geometry type
	 */
	buildFromGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>, geometryType?: GEOMETRY_TYPES, design?: IGeometryDesign): IGeometry;
}