
const Cesium = require("cesium/Source/Cesium");
import { IActionToken } from "../../Common/IActionToken";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { CesiumGraphicsUtils } from "../../GraphicsUtils/CesiumGraphicsUtils";
import { CesiumLayer } from "../../Layers/CesiumLayer";
import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { Coordinate } from "../Coordinate";
import { Point } from "../Point";
import { CesiumGeometryDragger } from "./CesiumGeometryDragger";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";

export class CesiumPoint extends Point {
	protected geometryOnMap: Cesium.Entity;
	private cesiumMapComponent: CesiumMapComponent;
	private cesiumGeometryDragger: CesiumGeometryDragger;
	private editablePoint: Cesium.Entity;

	constructor(mapComponent: CesiumMapComponent,
		coordinate: Coordinate,
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinate, design, id);

		this.cesiumMapComponent = mapComponent;
		this.cesiumGeometryDragger = new CesiumGeometryDragger(this.cesiumMapComponent);
		this.graphicsUtils = new CesiumGraphicsUtils(mapComponent);
	}

	public addToMap(): void {
		if (this.coordinate) {
			super.addToMap();
		}
	}

	public setGeometryOnMap(nativeEntity: any) {
		this.id = nativeEntity.id;
		this.geometryOnMap = nativeEntity;
		this.addedToMap = true;
	}

	public setId(value: string): void {
		if (this.id === value) {
			return;
		}
		this.id = value;
		if (!this.geometryOnMap) {
			return;
		}
		let oldNativeEntity = this.geometryOnMap;
		this.cesiumMapComponent.nativeMapInstance.entities.remove(this.geometryOnMap);
		this.geometryOnMap = this.cesiumMapComponent.nativeMapInstance.entities.getOrCreateEntity(this.id);
		this.geometryOnMap.merge(oldNativeEntity);
	}

	public getId(): string {
		if (this.id) {
			return this.id;
		} else if (this.geometryOnMap) {
			return this.geometryOnMap.id;
		}
		return null;
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.drag(token);
	}

	public drag(token: IActionToken): void {
		if (!this.geometryOnMap) {
			return;
		}

		this.replaceGeometryToEditableGeometry();

		// Make editable point to be draggable.
		const cancelDragFn = this.cesiumGeometryDragger.enableDragPoint(this.editablePoint);

		token.finish = () => {
			cancelDragFn();
			this.finishEditMode();
		};

		token.cancel = () => {
			cancelDragFn();
			this.exitEditMode();
		};
	}

	public setVisibility(value: boolean): void {
		if (this.isOnMap) {
			this.geometryOnMap.show = value;
			this.visible = value;

			this.design.update({
				icons: [{
					image: {
						visibility: value
					}
				}]
			});

			CesiumEntitiesCreator.saveDesignInsideEntity(this.geometryOnMap, this.design);

			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	public setLabel(text: string): void {
		if (this.isOnMap) {

			this.design.update({
				icons: [{
					label: {
						text: text,
						visibility: true
					}
				}]
			});

			this.geometryOnMap.label = CesiumEntitiesCreator.createLabel(this.design.icons[0].label);
			CesiumEntitiesCreator.saveDesignInsideEntity(this.geometryOnMap, this.design);

			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	public getLabel(): string {
		if (this.isOnMap && this.geometryOnMap.label && this.geometryOnMap.label.text) {
			return this.geometryOnMap.label.text.getValue(Cesium.JulianDate.now());
		}
		return;
	}

	public openBalloonHtml(html: string): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.description = new Cesium.ConstantProperty(html);
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	//override
	public setCoordinate(coordinate: Coordinate): void {
		super.setCoordinate(coordinate);
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}

	public getCollectionContainerId(): string {
		return this.geometryOnMap.entityCollection.id;
	}

	protected addNativeGeometryToMap(): void {
		if (this.geometryOnMap) {
			this.cesiumMapComponent.nativeMapInstance.entities.add(this.geometryOnMap);
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected removeNativeGeometryFromMap(): void {
		if (this.geometryOnMap) {
			this.geometryOnMap.entityCollection.removeById(this.getId());
			this.geometryOnMap = null;
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected addNativeGeometryToLayer(layer: CesiumLayer): void {
		layer.addEntity(this.geometryOnMap);
	}

	protected removeNativeGeometryFromLayer(layer: CesiumLayer): void {
		layer.removeEntity(this.geometryOnMap);
	}

	protected generateGeometryOnMap(): void {
		if (!this.coordinate) {
			return;
		}

		if (this.geometryOnMap === null) {
			this.geometryOnMap = CesiumEntitiesCreator.createPointEntity(this.coordinate, this.design, this.id);
		}
		else {
			const position = CesiumUtilities.toCartesianFromCoordinate(this.coordinate);
			(this.geometryOnMap.position as Cesium.Property as Cesium.ConstantProperty).setValue(position);
		}

		this.applyDesign(this.design);
	}

	//TODO: In Cesium, we assume there is a single icon for now, need implementation for multi icons
	protected renderIcon(): void {
		this.geometryOnMap.billboard = CesiumEntitiesCreator.createBillboard(this.design);
		this.geometryOnMap.label = CesiumEntitiesCreator.createLabel(this.design.icons && this.design.icons[0] && this.design.icons[0].label);

		CesiumEntitiesCreator.saveGeometryDataInsideEntity(this.geometryOnMap, this.coordinate, this.design, this.geometryType, this.id);

		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}

	protected setFillColor(color: string): void {
		if (this.geometryOnMap) {

			this.design.update({
				fill: {
					color: color
				}
			});

			(this.geometryOnMap.billboard.color as Cesium.ConstantProperty).setValue(Cesium.Color.fromCssColorString(color));
			this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
		}
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.cesiumMapComponent.utils.addEntityMouseEvent(listener,
			Cesium.ScreenSpaceEventType.LEFT_CLICK, this.geometryOnMap);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.cesiumMapComponent.utils.addEntityMouseEvent(listener,
			Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, this.geometryOnMap);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.cesiumMapComponent.utils.addEntityMouseEvent(listener,
			Cesium.ScreenSpaceEventType.RIGHT_CLICK, this.geometryOnMap);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.cesiumMapComponent.utils.addEntityMouseEvent(listener,
			Cesium.ScreenSpaceEventType.MOUSE_MOVE, this.geometryOnMap);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.cesiumMapComponent.utils.addEntityMouseOutEvent(listener,
			Cesium.ScreenSpaceEventType.PICK_END, this.geometryOnMap);
	}

	/**
	 * When edit should be happen
	 * @description Sets point's new coords, then generates and exit edit-mode.
	 */
	private finishEditMode() {
		this.coordinate = CesiumEntitiesResolver.buildPointCoordinateFromEntity(this.editablePoint);
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

	/**
	 * Exit edit mode
	 * @description remove editable point,
	 */
	private exitEditMode() {
		this.cesiumMapComponent.nativeMapInstance.entities.remove(this.editablePoint);
		this.setVisibility(true);
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}

	/**
	 * Replacing original point to point for edit.
	 */
	private replaceGeometryToEditableGeometry() {
		this.setVisibility(false);
		this.editablePoint = CesiumEntitiesCreator.createPointEntity(this.coordinate, {});
		this.cesiumMapComponent.nativeMapInstance.entities.add(this.editablePoint);
		this.cesiumMapComponent.nativeMapInstance.scene.requestRender();
	}
}