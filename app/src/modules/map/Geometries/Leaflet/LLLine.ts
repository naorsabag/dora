import { IActionToken } from "../../Common/IActionToken";
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { LLGraphicsUtils } from "../../GraphicsUtils/LLGraphicsUtils";
import { LLUtilties } from "../../MapUtils/LLUtilities";
import { Coordinate } from "../Coordinate";
import { Line } from "../Line";
import * as L from "leaflet";
import { LLLayer } from "../../Layers/LLLayer";
import { LLVisibilityUpdater } from "../VisibilityUpdater/LLVisibilityUpdater";

export class LLLine extends Line {
	private leafletMapComponent: LeafletMapComponent;
	private editablePolyline: L.Polyline;

	constructor(mapComponent: LeafletMapComponent,
		coordinates: Coordinate[],
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinates, design, id);

		this.leafletMapComponent = mapComponent;
		this.graphicsUtils = new LLGraphicsUtils(mapComponent);
	}

	protected addNativeGeometryToMap(): void {
		this.leafletMapComponent.nativeMapInstance.addLayer(this.geometryOnMap);
	}

	protected removeNativeGeometryFromMap(): void {
		this.leafletMapComponent.nativeMapInstance.removeLayer(this.geometryOnMap);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	protected addNativeGeometryToLayer(layer: LLLayer): void {
		layer.addLayer(this.geometryOnMap);
	}

	protected removeNativeGeometryFromLayer(layer: LLLayer): void {
		layer.removeLayer(this.geometryOnMap);
	}

	protected generateGeometryOnMap(): void {
		if (this.geometryOnMap === null) {
			this.geometryOnMap = new L.FeatureGroup();
		}
		this.applyTransformations();
		this.geometryOnMap.clearLayers();
		if (this.multilineCoordsDraft === null && this.multipolygonCoordsDraft === null) {
			let latLngArr = this.transformedCoordinates.map((coordinate: Coordinate) => LLUtilties.coordinateToLatLng(coordinate));
			this.geometryOnMap.addLayer(new L.Polyline(latLngArr));
		}
		else {
			if (this.multilineCoordsDraft !== null) {
				const latLngArr: L.LatLngTuple[][] = [];
				this.multilineCoordsDraft.forEach((coords: Coordinate[]) => {
					latLngArr.push(coords.map(c => LLUtilties.coordinateToLatLng(c)));
				});
				this.geometryOnMap.addLayer(new L.Polyline(<any>latLngArr));
			}
			if (this.multipolygonCoordsDraft !== null) {
				let latLngArr: L.LatLngTuple[][] = [];
				this.multipolygonCoordsDraft.forEach((coords: Coordinate[]) => {
					latLngArr.push(coords.map(c => LLUtilties.coordinateToLatLng(c)));
				});
				this.geometryOnMap.addLayer(new L.Polygon(<any>latLngArr));
			}
		}
		this.applyDesign(this.design);
		this.multilineCoordsDraft = null;
		this.multipolygonCoordsDraft = null;

		this.generateIconsCoordinates();
	}

	public edit(token: IActionToken): void {
		this.setVisibility(false);
		// enter edit mode
		this.editablePolyline = new L.Polyline(this.baseCoordinates.map(coordinate => LLUtilties.coordinateToLatLng(coordinate)));
		this.leafletMapComponent.nativeMapInstance.addLayer(this.editablePolyline);
		(<any>this.editablePolyline).editing.enable();

		token.finish = () => {
			this.baseCoordinates = this.editablePolyline.getLatLngs().map(latLng => LLUtilties.latLngToCoordinate(latLng));
			this.exitEditMode();
			this.generateGeometryOnMap();
		};

		token.cancel = () => {
			this.exitEditMode();
		};
	}

	private exitEditMode() {
		// Remove editable line from layer
		this.leafletMapComponent.nativeMapInstance.removeLayer(this.editablePolyline);
		// destroy editable line.
		this.editablePolyline = null;
		// Make original visible again
		this.setVisibility(true);
	}

	public drag(token: IActionToken): void {
		this.setVisibility(false);
		// enter drag mode
		this.editablePolyline = new L.Polyline(this.baseCoordinates.map(
			coordinate => LLUtilties.coordinateToLatLng(coordinate))
		);
		(<any>this.editablePolyline).makeDraggable();
		this.leafletMapComponent.nativeMapInstance.addLayer(this.editablePolyline);
		(<any>this.editablePolyline).dragging.enable();

		token.finish = () => {
			// replace coordinates with new coordinates
			this.baseCoordinates = this.editablePolyline.getLatLngs().map(latLng => LLUtilties.latLngToCoordinate(latLng));
			this.exitEditMode();
			this.generateGeometryOnMap();
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

	protected setLineColor(color: string): void {
		this.geometryOnMap.setStyle({ color: color });
	}

	protected setLineOpacity(opacity: number): void {
		this.geometryOnMap.setStyle({ opacity: opacity });
	}

	protected setLineWidth(width: number): void {
		this.geometryOnMap.setStyle({ weight: width });
	}

	protected setFillColor(color: string): void {
		this.geometryOnMap.setStyle({ fillColor: color });
	}

	protected setFillOpacity(opacity: number): void {
		this.geometryOnMap.setStyle({ fillOpacity: opacity });
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


	public setId(value: string): void { }
	public getId(): string {
		return null;
	}
}