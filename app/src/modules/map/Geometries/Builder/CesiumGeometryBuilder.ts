import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { CesiumLayer } from "../../Layers/CesiumLayer";
import { ILayer } from "../../Layers/ILayer";
import { Arrow } from "../Arrow";
import { CesiumLine } from "../Cesium/CesiumLine";
import { CesiumPoint } from "../Cesium/CesiumPoint";
import { CesiumPolygon } from "../Cesium/CesiumPolygon";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { Geometry } from "../Geometry";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { GeometryBuilder } from "./GeometryBuilder";
import { CesiumEntitiesResolver } from "../Cesium/CesiumEntities/CesiumEntitiesResolver";
import { CesiumArrow } from "../Cesium/CesiumArrow";
import { GeometryStateData } from "../Cesium/GeometryStateData";
import { GEOMETRY_TYPES } from "../GeometryTypes";

export class CesiumGeometryBuilder extends GeometryBuilder {
	constructor(private mapComponent: CesiumMapComponent) {
		super();
	}

	public buildLayer(): ILayer {
		return new CesiumLayer(this.mapComponent);
	}

	public buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point {
		return new CesiumPoint(this.mapComponent, coordinate, design);
	}

	public buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line {
		return new CesiumLine(this.mapComponent, coordinates, design);
	}

	public buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow {
		return new CesiumArrow(this.mapComponent, coordinates, design);
	}

	public buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon {
		return new CesiumPolygon(this.mapComponent, coordinates, design);
	}

	public buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine {
		return new DoubleLine(this.mapComponent, coordinates, design);
	}

	/**
	 * create geometry from native map entity
	 * @param {Cesium.Entity} entity - the native map entity
	 * @returns {Geometry} Dora's geometry according to the entity
	 */
	public buildFromNativeEntity(entity: Cesium.Entity): Geometry {
		const geometryData: GeometryStateData = CesiumEntitiesResolver.extractSavedGeometryData(entity);
		if (!geometryData) {
			return;
		}
		let geometry: Geometry = this.buildFromGeometryData(geometryData);
		geometry.setGeometryOnMap(entity);
		return geometry;
	}

	private buildFromGeometryData(geometryData: GeometryStateData): Geometry {
		let geometry: Geometry = null;
		switch (geometryData.type) {
			case GEOMETRY_TYPES.POINT:
				geometry = this.buildPoint(geometryData.coordinates as Coordinate, geometryData.design);
				break;
			case GEOMETRY_TYPES.LINE:
				geometry = this.buildLine(geometryData.coordinates as Coordinate[], geometryData.design);
				break;
			case GEOMETRY_TYPES.ARROW:
				geometry = this.buildArrow(geometryData.coordinates as Coordinate[], geometryData.design as IArrowGeometryDesign);
				break;
			case GEOMETRY_TYPES.POLYGON:
			case GEOMETRY_TYPES.RECTANGLE:
				geometry = this.buildPolygon(geometryData.coordinates as Coordinate[][], geometryData.design);
				break;
			case GEOMETRY_TYPES.DOUBLE_LINE:
				geometry = this.buildDoubleLine(geometryData.coordinates as Coordinate[], geometryData.design as IDoubleLineGeometryDesign);
				break;
			default:
				throw new Error("Unsupported geometry type");
		}

		return geometry;
	}
}
