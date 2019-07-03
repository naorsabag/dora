import { IActionToken } from "../../Common/IActionToken";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { CesiumGraphicsUtils } from "../../GraphicsUtils/CesiumGraphicsUtils";
import { CesiumLayer } from "../../Layers/CesiumLayer";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { CesiumMultiGeometry } from "./CesiumEntities/CesiumMultiGeometry";
import { CesiumGeometryDragger } from "./CesiumGeometryDragger";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";

const Cesium = require("cesium/Source/Cesium");

export class CesiumArrow extends Arrow {
	protected geometryOnMap: CesiumMultiGeometry;
	private cesiumMapComponent: CesiumMapComponent;
	private editablePolyline: Cesium.Entity;
	private cesiumGeometryDragger: CesiumGeometryDragger;

	constructor(mapComponent: CesiumMapComponent, coordinates: Coordinate[], design?: IArrowGeometryDesign, id?: string) {
		super(mapComponent, coordinates, design, id);
		this.cesiumMapComponent = mapComponent;
		this.cesiumGeometryDragger = new CesiumGeometryDragger(this.cesiumMapComponent);
		this.graphicsUtils = new CesiumGraphicsUtils(mapComponent);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.drag(token);
	}

	public drag(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		const cancelDragFn: () => void = this.cesiumGeometryDragger.enableDragPolyline(this.editablePolyline);

		token.finish = () => {
			cancelDragFn();
			this.finishEditMode();
		};

		token.cancel = () => {
			cancelDragFn();
			this.exitEditMode();
		};
	}

	public setVisibility(state: boolean): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.setVisibility(state);
			this.iconPoints.forEach(iconPoint => {
				iconPoint.setVisibility(state);
			});
			this.visible = state;
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	public openBalloonHtml(html: string): void {
		this.geometryOnMap.getFlattedGeometries().forEach(entity => {
			entity.description = new Cesium.ConstantProperty(html);
		});
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}

	public setGeometryOnMap(nativeEntity: Cesium.Entity) {
		this.id = nativeEntity.id;
		this.geometryOnMap =
			new CesiumMultiGeometry(this.cesiumMapComponent, nativeEntity.id, [nativeEntity]);
		this.addedToMap = true;
	}

	public setId(value: string): void {
		this.id = value;
		if (this.geometryOnMap) {
			this.geometryOnMap.id = value;
		}
	}

	public getId(): string {
		if (this.id) {
			return this.id;
		} else if (this.geometryOnMap) {
			return this.geometryOnMap.id;
		}
		return null;
	}

	protected addNativeGeometryToMap(): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.addToMap();
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected removeNativeGeometryFromMap(): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.removeFromMap();
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected addNativeGeometryToLayer(layer: CesiumLayer): void {
		this.geometryOnMap.addToLayer(layer);
	}

	protected removeNativeGeometryFromLayer(layer: CesiumLayer): void {
		this.geometryOnMap.removeFromLayer(layer);
	}

	protected generateGeometryOnMap(): void {
		if (!this.baseCoordinates) {
			return;
		}
		this.applyTransformations();
		if (!this.geometryOnMap) {
			this.geometryOnMap = new CesiumMultiGeometry(this.cesiumMapComponent);
			if (this.multilineCoordsDraft !== null) {
				this.multilineCoordsDraft.forEach((coords: Coordinate[]) => {
					this.geometryOnMap.appendGeometry(CesiumEntitiesCreator.createPolylineEntity(coords, this.design));
				});
			}
			if (this.multipolygonCoordsDraft !== null) {
				this.multipolygonCoordsDraft.forEach((coords: Coordinate[]) => {
					this.geometryOnMap.appendGeometry(CesiumEntitiesCreator.createPolygonEntity(coords, this.design));
				});
			}
		} else {
			let index = 0;
			this.geometryOnMap.iterateOverPolylines(polyline => {
				const positions = this.multilineCoordsDraft[index].map(coordinate => CesiumUtilities.toCartesianFromCoordinate(coordinate));
				(polyline.positions as Cesium.PositionPropertyArray).setValue(positions);
				index++;
			});
		}
		this.applyDesign(this.design);
		this.multilineCoordsDraft = null;
		this.multipolygonCoordsDraft = null;
		this.generateIconsCoordinates();
		this.geometryOnMap.getFlattedGeometries().forEach(entity => CesiumEntitiesCreator.saveGeometryDataInsideEntity(entity, this.baseCoordinates, this.design, this.geometryType, this.id));
	}

	protected applyDesign(design: IGeometryDesign) {
		super.applyDesign(design);
		this.geometryOnMap.getFlattedGeometries().forEach(entity => CesiumEntitiesCreator.saveDesignInsideEntity(entity, this.design));
	}

	protected setLineColor(color: string): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.setLineColor(color);
			this.geometryOnMap.setFillColor(color);
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected setLineOpacity(opacity: number): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.setLineOpacity(opacity);
			this.geometryOnMap.setFillOpacity(opacity);
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected setLineWidth(width: number): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.setLineWidth(width);
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected setFillColor(color: string): void {
	}

	protected setFillOpacity(opacity: number): void {
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener});
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, listener});
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.RIGHT_CLICK, listener});
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.MOUSE_MOVE, listener});
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.MOUSE_MOVE, listener});
	}

	private finishEditMode() {
		this.baseCoordinates = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(this.editablePolyline.polyline);
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

	private exitEditMode() {
		this.cesiumMapComponent.nativeMapInstance.entities.remove(this.editablePolyline);
		this.setVisibility(true);
	}

	private replacePolygonToEditablePolygon() {
		this.setVisibility(false);
		this.editablePolyline = CesiumEntitiesCreator.createPolylineEntity(this.baseCoordinates, {});
		this.cesiumMapComponent.nativeMapInstance.entities.add(this.editablePolyline);
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}
}
