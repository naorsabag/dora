import { IActionToken } from "../../Common/IActionToken";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { CesiumGraphicsUtils } from "../../GraphicsUtils/CesiumGraphicsUtils";
import { CesiumLayer } from "../../Layers/CesiumLayer";
import { Coordinate } from "../Coordinate";
import { Line } from "../Line";
import { CesiumGeometryDragger } from "./CesiumGeometryDragger";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { CesiumMultiGeometry } from "./CesiumEntities/CesiumMultiGeometry";
import { CesiumLineEditor } from "./CesiumLineEditor";

const Cesium = require("cesium/Source/Cesium");

export class CesiumLine extends Line {

	/**
	 * Actual line on map, that is consider as multi geometry for cases line has pattern [Like dashed],
	 * Which makes it multi-geometry
	 */
	protected geometryOnMap: CesiumMultiGeometry;
	private editablePolyline: Cesium.Entity;
	private cesiumMapComponent: CesiumMapComponent;
	private cesiumGeometryDragger: CesiumGeometryDragger;
	private cesiumGeometryEditor: CesiumLineEditor;
	private width: number = 3;

	constructor(mapComponent: CesiumMapComponent,
		coordinates: Coordinate[],
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinates, design, id);

		this.cesiumMapComponent = mapComponent;
		this.cesiumGeometryDragger = new CesiumGeometryDragger(this.cesiumMapComponent);
		this.cesiumGeometryEditor = new CesiumLineEditor(mapComponent);
		this.graphicsUtils = new CesiumGraphicsUtils(mapComponent);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();

		this.editablePolyline.show = true;
		const cancelEditFn = this.cesiumGeometryEditor.enableEditPolyline(this.editablePolyline);

		token.finish = () => {
			cancelEditFn();
			this.finishEditMode();
		};

		token.cancel = () => {
			cancelEditFn();
			this.exitEditMode();
		};
	}

	public drag(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		const cancelDragFn = this.cesiumGeometryDragger.enableDragPolyline(this.editablePolyline);

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
			this.cesiumMapComponent.utils.requestRender();
		}
	}

	public openBalloonHtml(html: string): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.getFlattedGeometries().forEach(entity => {
				entity.description = new Cesium.ConstantProperty(html);
			});

			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
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

	public getCollectionContainerId(): string {
		return this.geometryOnMap.getFlattedGeometries()[0].entityCollection.id;
	}

	protected addNativeGeometryToMap(): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.addToMap();
			this.cesiumMapComponent.utils.requestRender();
		}
	}

	protected removeNativeGeometryFromMap(): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.removeFromMap();
			this.geometryOnMap = null;
			this.cesiumMapComponent.utils.requestRender();
		}
	}

	protected addNativeGeometryToLayer(layer: CesiumLayer): void {
		this.geometryOnMap.addToLayer(layer);
		this.cesiumMapComponent.utils.requestRender();
	}

	protected removeNativeGeometryFromLayer(layer: CesiumLayer): void {
		this.geometryOnMap.removeFromLayer(layer);
		this.cesiumMapComponent.utils.requestRender();
	}

	protected generateGeometryOnMap(): void {
		if (!this.baseCoordinates) {
			return;
		}

		if (this.geometryOnMap === null) {
			this.geometryOnMap = new CesiumMultiGeometry(this.cesiumMapComponent, this.id);
		}
		else {
			this.geometryOnMap.cleanMultiGeometry();
		}

		this.applyTransformations();
		if (this.multilineCoordsDraft === null && this.multipolygonCoordsDraft === null) {
			const lineEntity = CesiumEntitiesCreator.createPolylineEntity(this.transformedCoordinates, this.design);
			this.geometryOnMap.appendGeometry(lineEntity);
		}
		else {
			if (this.multilineCoordsDraft !== null) {
				this.multilineCoordsDraft.forEach(coordinatesArray => {
					const polylineEntity = CesiumEntitiesCreator.createPolylineEntity(coordinatesArray, this.design);
					this.geometryOnMap.appendGeometry(polylineEntity);
				});
			}
			if (this.multipolygonCoordsDraft !== null) {
				this.multipolygonCoordsDraft.forEach(coordinatesArray => {
					const polygonEntity = CesiumEntitiesCreator.createPolygonEntity(coordinatesArray, this.design);
					this.geometryOnMap.appendGeometry(polygonEntity);
				});
			}
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
			this.cesiumMapComponent.utils.requestRender();
		}
	}

	protected setLineOpacity(opacity: number): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.setLineOpacity(opacity);
			this.geometryOnMap.setFillOpacity(opacity);
			this.cesiumMapComponent.utils.requestRender();
		}
	}

	protected setLineWidth(width: number): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.setLineWidth(width);
			this.cesiumMapComponent.utils.requestRender();
		}
	}

	protected setFillColor(color: string): void {
	}

	protected setFillOpacity(opacity: number): void {
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({ eventType: Cesium.ScreenSpaceEventType.LEFT_CLICK, listener });
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({ eventType: Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, listener });
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({ eventType: Cesium.ScreenSpaceEventType.RIGHT_CLICK, listener });
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({ eventType: Cesium.ScreenSpaceEventType.MOUSE_MOVE, listener });
		return this.cesiumMapComponent.utils.addEntityMouseEvent(listener,
			Cesium.ScreenSpaceEventType.MOUSE_MOVE, this.geometryOnMap);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geometryOnMap.addMouseEvent({ eventType: Cesium.ScreenSpaceEventType.PICK_END, listener });
	}

	private finishEditMode() {
		this.baseCoordinates = CesiumEntitiesResolver.buildPolylineCoordinatesFromEntity(this.editablePolyline.polyline);
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

	private exitEditMode() {
		this.cesiumMapComponent.nativeMapInstance.entities.remove(this.editablePolyline);
		this.setVisibility(true);
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}

	private replacePolygonToEditablePolygon() {
		this.setVisibility(false);
		this.editablePolyline = CesiumEntitiesCreator.createPolylineEntity(this.baseCoordinates, {});
		this.cesiumMapComponent.nativeMapInstance.entities.add(this.editablePolyline);
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}
}