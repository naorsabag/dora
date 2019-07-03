import * as L from "leaflet";
import { IActionToken } from "../../Common/IActionToken";
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { LLGraphicsUtils } from "../../GraphicsUtils/LLGraphicsUtils";
import { LLLayer } from "../../Layers/LLLayer";
import { LLUtilties } from "../../MapUtils/LLUtilities";
import { Coordinate } from "../Coordinate";
import { Polygon } from "../Polygon";
import { LLVisibilityUpdater } from "../VisibilityUpdater/LLVisibilityUpdater";

export class LLPolygon extends Polygon {
	protected geometryOnMap: L.FeatureGroup;
	protected fillGeometry: L.FeatureGroup;
	protected outlineGeometry: L.FeatureGroup;
	private leafletMapComponent: LeafletMapComponent;
	private editablePolygon: L.Polygon;

	constructor(mapComponent: LeafletMapComponent,
		coordinates: Coordinate[] | Coordinate[][],
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinates, design, id);

		this.leafletMapComponent = mapComponent;
		this.graphicsUtils = new LLGraphicsUtils(mapComponent);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		(<any>this.editablePolygon).editing.enable();

		token.finish = () => {
			this.finishEditMode();
		};

		token.cancel = () => {
			this.exitEditMode();
		};
	}

	public drag(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		(<any>this.editablePolygon).makeDraggable();
		(<any>this.editablePolygon).dragging.enable();

		token.finish = () => {
			this.finishEditMode();
		};

		token.cancel = () => {
			this.exitEditMode();
		};
	}

	public setVisibility(state: boolean): void {
		let visibilityUpdater = new LLVisibilityUpdater(this.leafletMapComponent);
		visibilityUpdater.updateVisibility(state, this.geometryOnMap, this.addedToMap, <LLLayer[]>this.addedToLayers, this.iconPoints);
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		const baloonCoords = this.calculateBalloonOpenPosition();
		L.popup().setLatLng(LLUtilties.coordinateToLatLng(baloonCoords)).setContent(html).openOn(this.leafletMapComponent.nativeMapInstance);
	}

	public setId(value: string): void {
	}

	public getId(): string {
		return null;
	}

	protected addNativeGeometryToMap(): void {
		this.leafletMapComponent.nativeMapInstance.addLayer(this.geometryOnMap);
	}

	protected removeNativeGeometryFromMap(): void {
		this.leafletMapComponent.nativeMapInstance.removeLayer(this.geometryOnMap);
	}

	protected addNativeGeometryToLayer(layer: LLLayer): void {
		layer.addLayer(this.geometryOnMap);
	}

	protected removeNativeGeometryFromLayer(layer: LLLayer): void {
		layer.removeLayer(this.geometryOnMap);
	}

	protected initializeOrCleanGeometryOnMap(): L.FeatureGroup {
		return this.initOrClearFeatureGroup(this.geometryOnMap);
	}

	protected initializeSubGeometryOnMap(geometry: L.FeatureGroup): L.FeatureGroup {
		return this.initOrClearFeatureGroup(geometry);
	}

	protected addSubGeometriesToGeometryOnMap(geometries: L.Layer[]): void {
		geometries.forEach(geometry => {
			if (geometry) {
				this.geometryOnMap.addLayer(geometry);
			}
		});
	}

	protected createNativeMultiPolyline(group: L.LayerGroup, coordinatesMat: Coordinate[][]): void {
		const latLngMat: L.LatLngTuple[][] = LLUtilties.coordinatesRingsTolatlngsRings(coordinatesMat);
		group.addLayer(new L.Polyline(<any>latLngMat));
	}

	protected createNativeMultiPolygon(group: L.LayerGroup, coordinatesMat: Coordinate[][]): void {
		const latLngMat: L.LatLngTuple[][] = LLUtilties.coordinatesRingsTolatlngsRings(coordinatesMat);
		group.addLayer(new L.Polygon(<any>[latLngMat]));
	}

	protected createNativeOutlinePolygon(group: L.LayerGroup, coordinatesMat: Coordinate[][]): void {
		this.createNativeMultiPolyline(group, coordinatesMat);
	}

	protected createNativeFillPolygon(group: L.LayerGroup, coordinatesMat: Coordinate[][]): void {
		const polygon = this.createNativePolygon(coordinatesMat, { stroke: false });
		group.addLayer(polygon);
	}

	protected createBackgroundFillPolygon(group: L.LayerGroup, coordinatesMat: Coordinate[][]): void {
		const polygon = this.createNativePolygon(coordinatesMat, { fillOpacity: 0, stroke: false });
		group.addLayer(polygon);
	}

	private createNativePolygon(coordinatesMat: Coordinate[][], options: L.PolylineOptions): L.Polygon {
		const latLngMat: L.LatLngTuple[][] = LLUtilties.coordinatesRingsTolatlngsRings(coordinatesMat);
		return new L.Polygon(latLngMat, options);
	}

	protected setLineColor(color: string): void {
		this.outlineGeometry.setStyle({ color: color });
		this.outlineGeometry.setStyle({ fillColor: color });
	}

	protected setLineOpacity(opacity: number): void {
		this.outlineGeometry.setStyle({ opacity: opacity });
		this.outlineGeometry.setStyle({ fillOpacity: opacity });
	}

	protected setLineWidth(width: number): void {
		this.outlineGeometry.setStyle({ weight: width });
	}

	protected setFillColor(color: string): void {
		this.fillGeometry.setStyle({ fillColor: color });
		this.fillGeometry.setStyle({ color: color });
	}

	protected setFillOpacity(opacity: number): void {
		this.fillGeometry.setStyle({ opacity: opacity });
		this.fillGeometry.setStyle({ fillOpacity: opacity });
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "dblclick", listener);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "contextmenu", listener);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "mouseover", listener);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "mouseout", listener);
	}

	private initOrClearFeatureGroup(group: L.FeatureGroup) {
		if (!group) {
			group = new L.FeatureGroup();
		} else {
			group.clearLayers();
		}

		return group;
	}

	/**
	 * Exit polygon edit-mode
	 * @description remove editable polygon, destroy it, and set original to be visible.
	 */
	private exitEditMode() {
		this.leafletMapComponent.nativeMapInstance.removeLayer(this.editablePolygon);
		this.editablePolygon = null;
		this.setVisibility(true);
	}

	/**
	 * Sets original invisible, duplicate it as editable and add it into layer.
	 */
	private replacePolygonToEditablePolygon() {
		this.setVisibility(false);
		this.editablePolygon = new L.Polygon(
			LLUtilties.coordinatesRingsTolatlngsRings(this.baseCoordinates)
		);
		this.leafletMapComponent.nativeMapInstance.addLayer(this.editablePolygon);
	}

	/**
	 * Finish successfully to edit
	 * @description Sets the new coords, generate on map and exit from edit-mode.
	 */
	private finishEditMode() {
		this.baseCoordinates = LLUtilties.latlngsRingsToCoordinatesRings(<any>this.editablePolygon.getLatLngs());
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

}