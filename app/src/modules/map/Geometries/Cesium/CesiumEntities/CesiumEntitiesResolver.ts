import { IGeometryDesign } from "../../../GeometryDesign/Interfaces/IGeometryDesign";
import { CesiumUtilities } from "../../../MapUtils/CesiumUtilities";
import { Coordinate } from "../../Coordinate";
import { GeometryDesign } from "../../../GeometryDesign/GeometryDesign";
import { CesiumEntitiesCreator } from "./CesiumEntitiesCreator";
import { IFillDesign } from "../../../GeometryDesign/Interfaces/IFillDesign";
import { ILineDesign } from "../../../GeometryDesign/Interfaces/ILineDesign";
import { IIconDesign } from "../../../GeometryDesign/Interfaces/IIconDesign";
import { ILabelDesign } from "../../../GeometryDesign/Interfaces/ILabelDesign";
import { LabelRelativePosition } from "../../../GeometryDesign/Enums/LabelRelativePosition";
import { GeometryStateData } from "../GeometryStateData";
import { GEOMETRY_TYPES } from "../../GeometryTypes";
import { IImageDesign } from "../../../GeometryDesign/Interfaces/IImageDesign";
import { IconRelativePosition } from "../../../GeometryDesign/Enums/IconRelativePosition";
import { FillPatternName } from "../../../GeometryDesign/Enums/FillPatternName";

const Cesium = require("cesium/Source/Cesium");

export class CesiumEntitiesResolver {
	/**
	 * get the coordinates of polygon
	 * @param {Cesium.PolygonGraphics} polygonProperty the polygon property of entity
	 * @return {Coordinate[][]} the coordinates of the polygon. The first array is the coordinates of the shell, and others are the holes.
	 */
	public static buildPolygonCoordinatesFromEntity(polygonProperty: Cesium.PolygonGraphics): Coordinate[][] {
		const hierarchy: Cesium.PolygonHierarchy = polygonProperty.hierarchy.getValue(Cesium.JulianDate.now());
		const baseCoordinates = hierarchy.positions.map((pos) => CesiumUtilities.toCoordinateFromCartesian(pos));
		const innerRings = hierarchy.holes.map(hole => hole.positions.map(pos => CesiumUtilities.toCoordinateFromCartesian(pos)));

		return [baseCoordinates, ...innerRings];
	}

	/**
	 * get the coordinates of polyline
	 * @param {Cesium.PolylineGraphics} lineProperty the polyline property of entity
	 * @return {Coordinate[]} the coordinates of the polyline
	 */
	public static buildPolylineCoordinatesFromEntity(lineProperty: Cesium.PolylineGraphics): Coordinate[] {
		const positions = lineProperty.positions.getValue(Cesium.JulianDate.now());
		return positions.map((pos) => CesiumUtilities.toCoordinateFromCartesian(pos));
	}

	/**
	 * get the coordinates of point
	 * @param {Cesium.Entity} pointEntity entity that represent point
	 * @return {Coordinate}
	 */
	public static buildPointCoordinateFromEntity(pointEntity: Cesium.Entity): Coordinate {
		const position: Cesium.Cartesian3 = pointEntity.position.getValue(Cesium.JulianDate.now());
		return CesiumUtilities.toCoordinateFromCartesian(position);
	}

	/**
	 * get design object that saved in entity
	 * @param {Cesium.Entity} entity cesium entity that saves the dora geometry data
	 * @return {IGeometryDesign | undefined} design object if exist in entity
	 */
	public static extractSavedDesign(entity: Cesium.Entity): IGeometryDesign | undefined {
		const geometryData: GeometryStateData = this.extractSavedGeometryData(entity);

		if (geometryData) {
			return geometryData.design;
		}
	}

	/**
	 * get dora geometry data that saved in entity
	 * @param {Cesium.Entity} entity cesium entity that saves the dora geometry data
	 * @return {GeometryStateData | undefined} dora geometry data if exist in entity
	 */
	public static extractSavedGeometryData(entity: Cesium.Entity): GeometryStateData | undefined {
		if (entity.properties && entity.properties.hasProperty(CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME)) {
			return entity.properties.getValue(Cesium.JulianDate.now())[CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME];
		}
	}

	public static buildGeometryDataFromEntity(entity: Cesium.Entity): GeometryStateData {
		switch (entity.billboard || entity.polyline || entity.polygon || {}) {
			case(entity.billboard):
				return CesiumEntitiesResolver.buildPointDataFromBillboardEntity(entity);
			case(entity.polyline):
				return CesiumEntitiesResolver.buildPolylineDataFromPolylineEntity(entity);
			case(entity.polygon):
				return CesiumEntitiesResolver.buildPolygonDataFromPolygonEntity(entity);
			default:
				return;
		}
	}

	private static buildPointDataFromBillboardEntity(entity: Cesium.Entity): GeometryStateData {
		return new GeometryStateData(CesiumEntitiesResolver.buildPointCoordinateFromEntity(entity),
			CesiumEntitiesResolver.getPointDesign(entity), GEOMETRY_TYPES.POINT, entity.id);
	}

	private static buildPolylineDataFromPolylineEntity(entity: Cesium.Entity): GeometryStateData {
		return new GeometryStateData(CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(entity.polyline),
			CesiumEntitiesResolver.getPolylineDesign(entity.polyline), GEOMETRY_TYPES.LINE, entity.id);
	}

	private static buildPolygonDataFromPolygonEntity(entity: Cesium.Entity): GeometryStateData {
		return new GeometryStateData(CesiumEntitiesResolver.buildPolygonCoordinatesFromEntity(entity.polygon),
			CesiumEntitiesResolver.getPolygonDesign(entity.polygon), GEOMETRY_TYPES.POLYGON, entity.id);
	}

	/**
	 * get the design of polygon from the cesium design properties of the entity
	 * @param {Cesium.PolygonGraphics} polygonProperty - entity cesium entity represents polygon
	 * @return {IGeometryDesign} design object for fill color and opacity
	 */
	private static getPolygonDesign(polygonProperty: Cesium.PolygonGraphics): IGeometryDesign {

		if (!polygonProperty.material) {
			return new GeometryDesign({});
		}

		const fillColor: Cesium.Color = ((polygonProperty.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property)
			.getValue(Cesium.JulianDate.now());

		const fill: IFillDesign = {
			color: fillColor.withAlpha(1).toCssColorString(),
			opacity: fillColor.alpha
		};

		return new GeometryDesign({fill});
	}

	/**
	 * get the design of polyline from the cesium design properties of the entity
	 * @param {Cesium.PolylineGraphics} lineProperty - cesium entity represents polyline
	 * @return {IGeometryDesign} design object for line color, opacity and width
	 */
	private static getPolylineDesign(lineProperty: Cesium.PolylineGraphics): IGeometryDesign {

		if (!lineProperty.material) {
			return new GeometryDesign({});
		}

		const lineColor: Cesium.Color = ((lineProperty.material as Cesium.ColorMaterialProperty).color as any as Cesium.Property)
			.getValue(Cesium.JulianDate.now());

		let line: ILineDesign = {
			color: lineColor.withAlpha(1).toCssColorString(),
			opacity: lineColor.alpha,
			width: lineProperty.width && (lineProperty.width as any as Cesium.Property).getValue(Cesium.JulianDate.now()) / CesiumEntitiesCreator.WIDTH_SCALAR
		};

		return new GeometryDesign({line});
	}

	/**
	 * get the design of point from the cesium design properties of the entity
	 * @param {Cesium.Entity} entity cesium entity represents point
	 * @return {IGeometryDesign} design object for icon
	 */
	private static getPointDesign(entity: Cesium.Entity): IGeometryDesign {
		//TODO: convert origin
		let cesiumColor: Cesium.Color = entity.billboard.color && entity.billboard.color.getValue(Cesium.JulianDate.now());
		let opacity: number = cesiumColor && cesiumColor.alpha;
		let color: string = cesiumColor && cesiumColor.withAlpha(1).toCssColorString();
		let fillDesign: IFillDesign = {
			pattern: FillPatternName.Solid, color: color, opacity: opacity
		};

		let image = entity.billboard.image.getValue(Cesium.JulianDate.now());
		let imageDesign: IImageDesign = {
			url: image.url || image,
			size: {
				width: entity.billboard.width.getValue(Cesium.JulianDate.now()),
				height: entity.billboard.height.getValue(Cesium.JulianDate.now())
			},
			anchor: {
				x: entity.billboard.verticalOrigin && entity.billboard.verticalOrigin.getValue(Cesium.JulianDate.now()),
				y: entity.billboard.horizontalOrigin && entity.billboard.horizontalOrigin.getValue(Cesium.JulianDate.now())
			},
			opacity: 1,
			angle: 0,
			positionPolicy: IconRelativePosition.Center,
			visibility: entity.show
		};

		let labelDesign: ILabelDesign = CesiumEntitiesResolver.getLabelDesign(entity.label) || {};

		let iconDesign: IIconDesign = {image: imageDesign, label: labelDesign};

		return new GeometryDesign({
			icons: [iconDesign],
			fill: fillDesign
		});
	}

	/**
	 * create label design from cesium label graphics.
	 * @param {Cesium.LabelGraphics} label - cesium's label api
	 * @returns {ILabelDesign}
	 */
	private static getLabelDesign(label: Cesium.LabelGraphics): ILabelDesign {
		if (!label) {
			return;
		}

		let font: string = label.font && (label.font as any as Cesium.Property).getValue(Cesium.JulianDate.now());

		return {
			text: label.text && label.text.getValue(Cesium.JulianDate.now()),
			opacity: label.fillColor && (label.fillColor as any as Cesium.Property).getValue(Cesium.JulianDate.now()).alpha,
			visibility: label.show && label.show.getValue(Cesium.JulianDate.now()),
			fontSize: +font.substr(0, font.indexOf("p")),
			positionPolicy: CesiumEntitiesResolver.getLabelRelativePositionFromVerticalOrigin(label.verticalOrigin && label.verticalOrigin.getValue(Cesium.JulianDate.now())) ||
			CesiumEntitiesResolver.getLabelRelativePositionFromHorizontalOrigin(label.horizontalOrigin && label.horizontalOrigin.getValue(Cesium.JulianDate.now()))
		};
	}

	/**
	 * create label relative position from cesium vertical origin object
	 * in cesium the origin position is opposite to dora's relative position.
	 * @param {Cesium.VerticalOrigin} verticalOrigin - the cesium's api for relative position
	 * @returns {LabelRelativePosition}
	 */
	private static getLabelRelativePositionFromVerticalOrigin(verticalOrigin: Cesium.VerticalOrigin): LabelRelativePosition {
		switch (verticalOrigin) {
			case Cesium.VerticalOrigin.BOTTOM:
				return LabelRelativePosition.Top;
			case  Cesium.VerticalOrigin.TOP:
				return LabelRelativePosition.Bottom;
			default:
				return;
		}
	}

	/**
	 * create label relative position from cesium horizontal origin object
	 * in cesium the origin position is opposite to dora's relative position.
	 * @param {Cesium.HorizontalOrigin} horizontalOrigin - the cesium's api for relative position
	 * @returns {LabelRelativePosition}
	 */
	private static getLabelRelativePositionFromHorizontalOrigin(horizontalOrigin: Cesium.HorizontalOrigin): LabelRelativePosition {
		switch (horizontalOrigin) {
			case Cesium.HorizontalOrigin.LEFT:
				return LabelRelativePosition.Left;
			case Cesium.HorizontalOrigin.RIGHT:
				return LabelRelativePosition.Right;
			default:
				return;
		}
	}

}