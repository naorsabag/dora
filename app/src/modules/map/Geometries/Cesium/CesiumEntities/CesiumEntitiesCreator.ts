import { IGeometryDesign } from "../../../GeometryDesign/Interfaces/IGeometryDesign";
import { CesiumUtilities } from "../../../MapUtils/CesiumUtilities";
import { Coordinate } from "../../Coordinate";
import { ILabelDesign } from "../../../GeometryDesign/Interfaces/ILabelDesign";
import { LabelRelativePosition } from "../../../GeometryDesign/Enums/LabelRelativePosition";
import { IImageDesign } from "../../../GeometryDesign/Interfaces/IImageDesign";
import { GeometryStateData } from "../GeometryStateData";
import { GEOMETRY_TYPES } from "../../GeometryTypes";

const Cesium = require("cesium/Source/Cesium");

/**
 * handles creation of native cesium entities and properties from coordinates and design objects
 */
export class CesiumEntitiesCreator {
	public static readonly GEOMETRY_DATA_PROPERTY_NAME: string = "dora-data";
	public static readonly WIDTH_SCALAR: number = 2;
	private static readonly DEFAULT_COLOR = "#ff0000";
	private static readonly DEFAULT_ICON_SIZE = null;

	/**
	 * create cesium entity object with polygon with specific coordinates and design
	 * @param {Coordinate[] | Coordinate[][]} coordinates array of coordinates for simple polygon or matrix fot polygon with holes
	 * @param {IGeometryDesign} design design object contains fill color and opacity
	 * @param {string} id id of the entity. id not supplied, cesium will generate id
	 * @returns {Cesium.Entity} cesium entity object with polygon
	 */
	public static createPolygonEntity(coordinates: Coordinate[] | Coordinate[][], design: IGeometryDesign, id?: string): Cesium.Entity {
		const polygon = this.createPolygonGraphics(coordinates, design);
		return new Cesium.Entity({id, polygon});
	}

	/**
	 * create cesium entity object with polyline with specific coordinates and design
	 * @param {Coordinate[]} coordinates array of coordinates of the polyline
	 * @param {IGeometryDesign} design design object contains line color opacity and width
	 * @param {string} id id of the entity. id not supplied, cesium will generate id
	 * @returns {Cesium.Entity} cesium entity object with polyline
	 */
	public static createPolylineEntity(coordinates: Coordinate[], design: IGeometryDesign, id?: string): Cesium.Entity {
		const polyline = this.createPolylineGraphics(coordinates, design);
		return new Cesium.Entity({id, polyline});
	}

	/**
	 * create cesium entity object with billboard icon on specific coordinate with specific design
	 * @param {Coordinate} coordinate the position to mark the icon
	 * @param {IGeometryDesign} design design object contains icons design
	 * @param {string} id id of the entity. id not supplied, cesium will generate id
	 * @returns {Cesium.Entity} cesium entity object with position and billboard
	 */
	public static createPointEntity(coordinate: Coordinate, design: IGeometryDesign, id?: string): Cesium.Entity {
		const position: Cesium.Cartesian3 = CesiumUtilities.toCartesianFromCoordinate(coordinate);
		const billboard: Cesium.BillboardGraphics = this.createBillboard(design);
		const label: Cesium.LabelGraphics = this.createLabel(design.icons && design.icons[0] && design.icons[0].label);
		return new Cesium.Entity({id, position, billboard, label});
	}

	/**
	 * save design object inside native entity by using property bag
	 * @param {Cesium.Entity} entity - the native entity
	 * @param {IGeometryDesign} design - the design to be saved
	 */
	public static saveDesignInsideEntity(entity: Cesium.Entity, design: IGeometryDesign): void {
		if (entity.properties && entity.properties.hasProperty(CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME)) {
			const geometryData : GeometryStateData = entity.properties.getValue(Cesium.JulianDate.now())[CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME];
			geometryData.design = design;
		}
	}


	public static saveGeometryDataInsideEntity(entity: Cesium.Entity,
		coordinates: Coordinate | Coordinate[] | Coordinate[][],
		design: IGeometryDesign,
		type: GEOMETRY_TYPES,
		id: string): void {

		const geometryData: GeometryStateData = new GeometryStateData(coordinates, design, type, id);
		//if property bag is not initialize
		if (!entity.properties) {
			entity.properties = new Cesium.PropertyBag();
		}
		if (entity.properties.hasProperty(CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME)) {
			entity.properties.removeProperty(CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME);
		}
		entity.properties.addProperty(CesiumEntitiesCreator.GEOMETRY_DATA_PROPERTY_NAME, geometryData);
	}

	/**
	 * create cesium label graphics object
	 * @param {ILabelDesign} label - the text and all the design needed
	 * @returns {Cesium.LabelGraphics}
	 */
	public static createLabel(label: ILabelDesign): Cesium.LabelGraphics {
		if (!label) {
			return;
		}

		const text: string = label.text;
		const fontSize: number = label.fontSize || 12;
		const font: string = fontSize + "pt sans-serif";
		const style: Cesium.LabelStyle = Cesium.LabelStyle.FILL_AND_OUTLINE;
		const fillColor: Cesium.Color = new Cesium.Color(1, 1, 1, label.opacity || 1);
		const outlineWidth: number = 2;
		const verticalOrigin: Cesium.VerticalOrigin =
			this.getCesiumOriginFromLabelRelativePosition(label.positionPolicy).vertical;
		const horizontalOrigin: Cesium.HorizontalOrigin =
			this.getCesiumOriginFromLabelRelativePosition(label.positionPolicy).horizontal;
		const pixelOffset: Cesium.Cartesian2 = new Cesium.Cartesian2(0, 0);
		const show: boolean = label.visibility;
		const heightReference: number = Cesium.HeightReference.CLAMP_TO_GROUND;
		return new Cesium.LabelGraphics({
			text,
			font,
			style,
			fillColor,
			outlineWidth,
			verticalOrigin,
			horizontalOrigin,
			pixelOffset,
			show,
			heightReference
		});
	}

	/**
	 * convert LabelRelativePosition to Cesium corresponding values.
	 * in cesium the origin position is opposite to dora's relative position.
	 * @default {vertical: Cesium.VerticalOrigin.TOP, horizontal: Cesium.HorizontalOrigin.CENTER}
	 * @param {LabelRelativePosition} relativePosition
	 * @returns {{vertical: Cesium.VerticalOrigin; horizontal: Cesium.HorizontalOrigin}}
	 */
	public static getCesiumOriginFromLabelRelativePosition(relativePosition: LabelRelativePosition):
		{ vertical: Cesium.VerticalOrigin, horizontal: Cesium.HorizontalOrigin } {

		let retObj = {vertical: Cesium.VerticalOrigin.TOP, horizontal: Cesium.HorizontalOrigin.CENTER};

		switch (relativePosition) {
			case LabelRelativePosition.Top:
				retObj.vertical = Cesium.VerticalOrigin.BOTTOM;
				break;
			case LabelRelativePosition.Bottom:
				retObj.vertical = Cesium.VerticalOrigin.TOP;
				break;
			case LabelRelativePosition.Left:
				retObj.horizontal = Cesium.HorizontalOrigin.RIGHT;
				break;
			case LabelRelativePosition.Right:
				retObj.horizontal = Cesium.HorizontalOrigin.LEFT;
				break;
			default:
				break;
		}

		return retObj;
	}

	/**
	 * creates cesium billboard from dora's design
	 * @param {IGeometryDesign} design - dora geometry design
	 * @returns {Cesium.BillboardGraphics}
	 */
	public static createBillboard(design: IGeometryDesign): Cesium.BillboardGraphics {
		//TODO: In Cesium, we assume there is a single icon for now, need implementation for multi icons
		const imageDesign = design && design.icons && design.icons[0] && design.icons[0].image;
		const fillColor = design.fill && design.fill.color || this.DEFAULT_COLOR;

		const width = (imageDesign && imageDesign.size && imageDesign.size.width) ? imageDesign.size.width : this.DEFAULT_ICON_SIZE;
		const height = (imageDesign && imageDesign.size && imageDesign.size.height) ? imageDesign.size.height : this.DEFAULT_ICON_SIZE;

		const heightReference: number = Cesium.HeightReference.CLAMP_TO_GROUND;

		const relativeOrigin: { vertical: Cesium.VerticalOrigin, horizontal: Cesium.HorizontalOrigin } =
			CesiumEntitiesCreator.convertAnchorToRelativeOrigin(imageDesign);
		const verticalOrigin: number = relativeOrigin.vertical;
		const horizontalOrigin: number = relativeOrigin.horizontal;
		let color: Cesium.Color = Cesium.Color.fromCssColorString(fillColor);
		color.alpha = (design && design.fill && design.fill.opacity) || 1;
		const image = (imageDesign && imageDesign.url) ? imageDesign.url : new Cesium.PinBuilder().fromColor(color, 48).toDataURL();
		const show: boolean = imageDesign && imageDesign.visibility;
		return new Cesium.BillboardGraphics({
			image,
			color,
			width,
			height,
			heightReference,
			verticalOrigin,
			horizontalOrigin,
			show
		});
	}

	/**
	 * create the positions object of polygon
	 * @param {Coordinate[] | Coordinate[][]} coordinates array of coordinates for simple polygon or matrix for polygon with holes
	 * @return {Cesium.PolygonHierarchy}
	 */
	public static createPolygonHierarchy(coordinates: Coordinate[] | Coordinate[][]): Cesium.PolygonHierarchy {
		// case - coordinates is Coordinate[]
		let outerCoordinates: Coordinate[] = coordinates as Coordinate[];
		let innerCoordinates: Coordinate[][] = [];

		// case - coordinates is Coordinate[][]
		if (Cesium.isArray(coordinates[0])) {
			outerCoordinates = coordinates[0] as Coordinate[];
			innerCoordinates = (coordinates as Coordinate[][]).slice(1);
		}

		const positions: Cesium.Cartesian3[] = outerCoordinates.map(coordinate => CesiumUtilities.toCartesianFromCoordinate(coordinate));
		const holes: Cesium.PolygonHierarchy[] = innerCoordinates.map(coordinates => this.createPolygonHierarchy(coordinates));

		return new Cesium.PolygonHierarchy(positions, holes);
	}

	/**
	 * calculate approximation of cesium relative origin from anchor of dora's image design.
	 * if the x value is less than a quarter of the image size the vertical value is TOP
	 * if the x value is more than a three quarter of the image size the vertical value is BOTTOM
	 * otherwise is CENTER
	 * if the y value is less than a quarter of the image size the vertical value is LEFT
	 * if the y value is more than a three quarter of the image size the vertical value is RIGHT
	 * otherwise is CENTER
	 * @default {vertical: Cesium.VerticalOrigin.BOTTOM, horizontal: Cesium.HorizontalOrigin.CENTER}
	 * @param {IImageDesign} imgDesign
	 * @returns {{vertical: Cesium.VerticalOrigin; horizontal: Cesium.HorizontalOrigin}}
	 */
	private static convertAnchorToRelativeOrigin(imgDesign: IImageDesign):
		{ vertical: Cesium.VerticalOrigin, horizontal: Cesium.HorizontalOrigin } {

		let retObj = {vertical: Cesium.VerticalOrigin.BOTTOM, horizontal: Cesium.HorizontalOrigin.CENTER};

		if (!(imgDesign && imgDesign.anchor)) {
			return retObj;
		}

		if (!imgDesign.size) {
			imgDesign.size = {width: this.DEFAULT_ICON_SIZE, height: this.DEFAULT_ICON_SIZE};
		}

		const heightRatio: number = imgDesign.size.height && imgDesign.anchor.x / imgDesign.size.height;
		const widthRatio: number = imgDesign.size.width && imgDesign.anchor.y / imgDesign.size.width;
		const QUARTER: number = 0.25;
		const THREE_QUARTERS: number = 0.75;


		if (heightRatio < QUARTER) {
			retObj.vertical = Cesium.VerticalOrigin.TOP;
		}
		else if (heightRatio > THREE_QUARTERS) {
			retObj.vertical = Cesium.VerticalOrigin.BOTTOM;
		}

		if (widthRatio < QUARTER) {
			retObj.horizontal = Cesium.HorizontalOrigin.LEFT;
		}
		else if (widthRatio > THREE_QUARTERS) {
			retObj.horizontal = Cesium.HorizontalOrigin.RIGHT;
		}

		return retObj;
	}

	private static createPolylineGraphics(coordinates: Coordinate[], design: IGeometryDesign): Cesium.PolylineGraphics {
		const positions = CesiumUtilities.toCartesianArrayFromCoordinates(coordinates);

		const color = (design.line && design.line.color) ? design.line.color : this.DEFAULT_COLOR;
		const opacity = (design.line && design.line.opacity) ? design.line.opacity : 1;
		const width = (design.line && design.line.width) ? design.line.width * CesiumEntitiesCreator.WIDTH_SCALAR : CesiumEntitiesCreator.WIDTH_SCALAR;
		const cesiumColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
		const material = new Cesium.ColorMaterialProperty(cesiumColor);
		const clampToGround = true;

		return new Cesium.PolylineGraphics({positions, width, material, clampToGround});
	}

	private static createPolygonGraphics(coordinates: Coordinate[] | Coordinate[][], design: IGeometryDesign): Cesium.PolygonGraphics {
		const hierarchy = this.createPolygonHierarchy(coordinates);
		const fillColor = (design.fill && design.fill.color) ? design.fill.color : this.DEFAULT_COLOR;
		const fillOpacity = (design.fill && typeof design.fill.opacity === "number") ? design.fill.opacity : 1;
		const cesiumColor = Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity);

		const material = new Cesium.ColorMaterialProperty(cesiumColor);

		return new Cesium.PolygonGraphics({hierarchy, material});
	}
}
