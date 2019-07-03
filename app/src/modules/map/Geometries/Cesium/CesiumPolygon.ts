import { IActionToken } from "../../Common/IActionToken";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { CesiumGraphicsUtils } from "../../GraphicsUtils/CesiumGraphicsUtils";
import { CesiumLayer } from "../../Layers/CesiumLayer";
import { Coordinate } from "../Coordinate";
import { Polygon } from "../Polygon";
import { CesiumGeometryDragger } from "./CesiumGeometryDragger";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { CesiumMultiGeometry } from "./CesiumEntities/CesiumMultiGeometry";
import { CesiumPolygonEditor } from "./CesiumPolygonEditor";

const Cesium = require("cesium/Source/Cesium");

export class CesiumPolygon extends Polygon {
	protected geometryOnMap: CesiumMultiGeometry;
	protected fillGeometry: CesiumMultiGeometry;
	protected outlineGeometry: CesiumMultiGeometry;
	private readonly EDIT_DESIGN = {
		fill: {
			opacity: 0.4,
			color: "blue"
		}
	};
	private cesiumMapComponent: CesiumMapComponent;
	private cesiumGeometryDragger: CesiumGeometryDragger;
	private cesiumPolygonEditor: CesiumPolygonEditor;
	private editablePolygon: Cesium.Entity;

	constructor(mapComponent: CesiumMapComponent, coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign, id?: string) {
		super(mapComponent, coordinates, design, id);

		this.cesiumMapComponent = mapComponent;
		this.cesiumGeometryDragger = new CesiumGeometryDragger(this.cesiumMapComponent);
		this.cesiumPolygonEditor = new CesiumPolygonEditor(mapComponent);
		this.graphicsUtils = new CesiumGraphicsUtils(mapComponent);
	}

	public dispose(): void {
		//TODO: remove all events
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();

		this.editablePolygon.show = true;
		const cancelEditFn = this.cesiumPolygonEditor.enableEditPolygon(this.editablePolygon);

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
		const cancelDragFn = this.cesiumGeometryDragger.enableDragPolygon(this.editablePolygon);

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

	public getCollectionContainerId(): string {
		return this.geometryOnMap.getFlattedGeometries()[0].entityCollection.id;
	}

	protected initializeOrCleanGeometryOnMap(): CesiumMultiGeometry {
		return this.initOrClearFeatureGroup(this.geometryOnMap, this.id);
	}

	protected initializeSubGeometryOnMap(geometry: CesiumMultiGeometry): CesiumMultiGeometry {
		return this.initOrClearFeatureGroup(geometry);
	}

	protected addSubGeometriesToGeometryOnMap(geometries: CesiumMultiGeometry[]): void {
		geometries.forEach(geometry => {
			if (geometry) {
				this.geometryOnMap.appendGeometry(geometry);
			}
		});
	}

	protected createNativeMultiPolyline(group: CesiumMultiGeometry, coordinatesMat: Coordinate[][]): void {
		coordinatesMat.forEach(coordinatesArray => {
			const polylineEntity = CesiumEntitiesCreator.createPolylineEntity(coordinatesArray, this.design);
			group.appendGeometry(polylineEntity);
		});
	}

	protected createNativeMultiPolygon(group: CesiumMultiGeometry, coordinatesMat: Coordinate[][]): void {
		coordinatesMat.forEach(coordinatesArray => {
			const polygonEntity = CesiumEntitiesCreator.createPolygonEntity(coordinatesArray, this.design);
			group.appendGeometry(polygonEntity);
		});
		this.createNativeMultiPolyline(group, coordinatesMat);
	}

	protected createNativeOutlinePolygon(group: CesiumMultiGeometry, coordinatesMat: Coordinate[][]): void {
		this.createNativeMultiPolyline(group, coordinatesMat);
	}

	protected createNativeFillPolygon(group: CesiumMultiGeometry, coordinatesMat: Coordinate[][]): void {
		const polygonEntity = CesiumEntitiesCreator.createPolygonEntity(coordinatesMat, {});
		group.appendGeometry(polygonEntity);
	}

	protected createBackgroundFillPolygon(group: CesiumMultiGeometry, coordinatesMat: Coordinate[][]): void {
		const polygonEntity = CesiumEntitiesCreator.createPolygonEntity(coordinatesMat, {
			fill: {opacity: 0}
		});
		group.appendGeometry(polygonEntity);
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

	protected generateGeometryOnMap() {
		super.generateGeometryOnMap();
		this.geometryOnMap.getFlattedGeometries().forEach(entity => CesiumEntitiesCreator.saveGeometryDataInsideEntity(entity, this.baseCoordinates, this.design, this.geometryType, this.id));
	}

	protected applyDesign(design: IGeometryDesign) {
		super.applyDesign(design);
		this.geometryOnMap.getFlattedGeometries().forEach(entity => CesiumEntitiesCreator.saveDesignInsideEntity(entity, this.design));
	}

	protected setLineColor(color: string): void {
		if (!this.outlineGeometry) {
			this.geometryOnMap.setLineColor(color);
			this.geometryOnMap.setFillColor(color);
			return;
		}
		else {
			this.outlineGeometry.setLineColor(color);
			this.outlineGeometry.setFillColor(color);
		}
		this.cesiumMapComponent.utils.requestRender();
	}

	protected setLineOpacity(opacity: number): void {
		if (!this.outlineGeometry) {
			this.geometryOnMap.setLineOpacity(opacity);
			this.geometryOnMap.setFillOpacity(opacity);
		}
		else {
			this.outlineGeometry.setLineOpacity(opacity);
			this.outlineGeometry.setFillOpacity(opacity);
		}
		this.cesiumMapComponent.utils.requestRender();
	}

	protected setLineWidth(outlineWidth: number): void {
		if (!this.outlineGeometry) {
			this.geometryOnMap.setLineWidth(outlineWidth);
		}
		else {
			this.outlineGeometry.setLineWidth(outlineWidth);
		}
		this.cesiumMapComponent.utils.requestRender();
	}

	protected setFillColor(color: string): void {
		if (!this.fillGeometry) {
			this.geometryOnMap.setFillColor(color);
			this.geometryOnMap.setLineColor(color);
		}
		else {
			this.fillGeometry.setFillColor(color);
			this.fillGeometry.setLineColor(color);
		}
		this.cesiumMapComponent.utils.requestRender();
	}

	protected setFillOpacity(opacity: number): void {
		if (!this.fillGeometry) {
			this.geometryOnMap.setFillOpacity(opacity);
			this.geometryOnMap.setLineOpacity(opacity);
		}
		else {
			this.fillGeometry.setFillOpacity(opacity);
			this.fillGeometry.setLineOpacity(opacity);
		}
		this.cesiumMapComponent.utils.requestRender();
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
		return this.geometryOnMap.addMouseEvent({eventType: Cesium.ScreenSpaceEventType.PICK_END, listener});
	}

	private initOrClearFeatureGroup(group: CesiumMultiGeometry, id?: string): CesiumMultiGeometry {
		if (!group) {
			group = new CesiumMultiGeometry(this.cesiumMapComponent, id);
		} else {
			group.cleanMultiGeometry();
		}

		return group;
	}

	private finishEditMode() {
		this.baseCoordinates = CesiumEntitiesResolver.buildPolygonCoordinatesFromEntity(this.editablePolygon.polygon);
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

	private exitEditMode() {
		this.cesiumMapComponent.nativeMapInstance.entities.remove(this.editablePolygon);
		this.setVisibility(true);
		this.cesiumMapComponent.utils.requestRender();
	}

	private replacePolygonToEditablePolygon() {
		this.setVisibility(false);
		this.editablePolygon = CesiumEntitiesCreator.createPolygonEntity(this.baseCoordinates, this.EDIT_DESIGN);
		this.cesiumMapComponent.nativeMapInstance.entities.add(this.editablePolygon);
		this.cesiumMapComponent.utils.requestRender();
	}
}