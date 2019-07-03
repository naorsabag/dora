import { IActionToken } from "../../Common/IActionToken";
import { GoogleMapsMapComponent } from "../../Components/GoogleMapsMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GMGraphicsUtils } from "../../GraphicsUtils/GMGraphicsUtils";
import { ILayer } from "../../Layers/ILayer";
import { Coordinate } from "../Coordinate";
import { Polygon } from "../Polygon";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import * as turf from "@turf/helpers";
import { MapUtils } from "../../MapUtils/MapUtils";

export class GMPolygon extends Polygon {
	protected geometryOnMap: google.maps.Data.Feature[];
	protected fillGeometry: google.maps.Data.Feature;
	protected outlineGeometry: google.maps.Data.Feature;
	private gmMapComponent: GoogleMapsMapComponent;
	private editablePolygon: google.maps.Polygon;

	constructor(mapComponent: GoogleMapsMapComponent,
				coordinates: Coordinate[] | Coordinate[][],
				design?: IGeometryDesign,
				id?: string) {
		super(mapComponent, coordinates, design, id);

		this.gmMapComponent = mapComponent;

		this.graphicsUtils = new GMGraphicsUtils(mapComponent);
	}

	private get dataLayer(): google.maps.Data {
		return this.gmMapComponent.map.data;
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		this.editablePolygon.setEditable(true);

		token.finish = () => {
			this.finishEditMode();
		};

		token.cancel = () => {
			this.exitEditMode();
		};
	}

	public drag(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		this.editablePolygon.setDraggable(true);

		token.finish = () => {
			this.finishEditMode();
		};

		token.cancel = () => {
			this.exitEditMode();
		};
	}

	public setVisibility(state: boolean): void {
		if (this.isOnMap) {
			this.applyFnToGeometryOnMap((feature) => {
				this.dataLayer.overrideStyle(feature, {visible: state});
			});
		}
		this.iconPoints.forEach(iconPoint => {
			iconPoint.setVisibility(state);
		});
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		const baloonCoords = this.calculateBalloonOpenPosition();
		this.gmMapComponent.utils.openBalloonHtml(html, baloonCoords);
	}

	public setId(value: string): void {
	}

	public getId(): string {
		return null;
	}

	protected addNativeGeometryToMap(): void {
		this.applyFnToGeometryOnMap((feature) => {
			this.dataLayer.add(feature);
		});
	}

	protected removeNativeGeometryFromMap(): void {
		this.applyFnToGeometryOnMap((feature) => {
			this.dataLayer.remove(feature);
		});
	}

	protected addNativeGeometryToLayer(layer: ILayer): void {
		this.applyFnToGeometryOnMap((feature) => {
			this.dataLayer.add(feature);
		});
	}

	protected removeNativeGeometryFromLayer(layer: ILayer): void {
		this.applyFnToGeometryOnMap((feature) => {
			this.dataLayer.remove(feature);
		});
	}

	protected initializeOrCleanGeometryOnMap(): google.maps.Data.Feature[] {
		if (this.geometryOnMap) {
			this.applyFnToGeometryOnMap((feature) => feature.setGeometry(null));
		}
		return [];
	}

	protected initializeSubGeometryOnMap(geometry: google.maps.Data.Feature): google.maps.Data.Feature {
		return geometry || new google.maps.Data.Feature();
	}

	protected addSubGeometriesToGeometryOnMap(geometries: google.maps.Data.Feature[]): void {
		this.geometryOnMap = this.geometryOnMap.concat(geometries);
	}

	protected createNativeMultiPolyline(group: google.maps.Data.Feature, coordinatesMat: Coordinate[][]): void {
		const latLngMat: google.maps.LatLng[][] = this.gmMapComponent.utils.coordinatesRingsTolatlngsRings(coordinatesMat);
		const geometry = new google.maps.Data.MultiLineString(latLngMat);
		group.setGeometry(geometry);
	}

	protected createNativeMultiPolygon(group: google.maps.Data.Feature, coordinatesMat: Coordinate[][]): void {
		const latLngMat: google.maps.LatLng[][] = this.gmMapComponent.utils.coordinatesRingsTolatlngsRings(coordinatesMat);
		const polygons: google.maps.Data.Polygon[] = latLngMat
			.map(latLngArr => new google.maps.Data.Polygon([new google.maps.Data.LinearRing(latLngArr)]));
		const geometry = new google.maps.Data.MultiPolygon(polygons);
		group.setGeometry(geometry);
	}

	protected createNativeOutlinePolygon(group: google.maps.Data.Feature, coordinatesMat: Coordinate[][]): void {
		this.createNativeMultiPolyline(group, coordinatesMat);
	}

	protected createNativeFillPolygon(group: google.maps.Data.Feature, coordinatesMat: Coordinate[][]): void {
		const geometry = this.createNativePolygon(coordinatesMat);
		group.setGeometry(geometry);
		this.dataLayer.overrideStyle(group, {strokeOpacity: 0});
	}

	protected createBackgroundFillPolygon(group: google.maps.Data.Feature, coordinatesMat: Coordinate[][]): void {
		const geometry = this.createNativePolygon(coordinatesMat);
		group.setGeometry(geometry);
		this.dataLayer.overrideStyle(group, {fillOpacity: 0, strokeOpacity: 0});
	}

	protected setLineColor(color: string): void {
		this.dataLayer.overrideStyle(this.outlineGeometry, {strokeColor: color});
		this.dataLayer.overrideStyle(this.outlineGeometry, {fillColor: color});
	}

	protected setLineOpacity(opacity: number): void {
		this.dataLayer.overrideStyle(this.outlineGeometry, {strokeOpacity: opacity});
		this.dataLayer.overrideStyle(this.outlineGeometry, {fillOpacity: opacity});
	}

	protected setLineWidth(width: number): void {
		this.dataLayer.overrideStyle(this.outlineGeometry, {strokeWeight: width});
	}

	protected setFillColor(color: string): void {
		this.dataLayer.overrideStyle(this.fillGeometry, {fillColor: color});
		this.dataLayer.overrideStyle(this.fillGeometry, {strokeColor: color});
	}

	protected setFillOpacity(opacity: number): void {
		this.dataLayer.overrideStyle(this.fillGeometry, {fillOpacity: opacity});
		this.dataLayer.overrideStyle(this.fillGeometry, {strokeOpacity: opacity});
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener("click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener("dblclick", listener);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener("rightclick", listener);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener("mouseover", listener);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener("mouseout", listener);
	}

	private addUserEventListener(eventName: string, listener: (eventArgs?: MapEventArgs) => void): () => void {
		const cancelFunctions = [];
		this.applyFnToGeometryOnMap((feature) => {
			cancelFunctions.push(this.gmMapComponent.utils.attachDataEventListener(feature, eventName, listener));
		});

		return () => {
			cancelFunctions.forEach((fn => fn()));
		};
	}

	private applyFnToGeometryOnMap(callback: (feature: google.maps.Data.Feature) => void) {
		this.geometryOnMap.forEach((feature) => {
			callback(feature);
		});
	}

	private createNativePolygon(coordinatesMat: Coordinate[][]): google.maps.Data.Polygon {
		// the flow is to use geojson, because of bug in google maps in thr standart way which holes filled too
		const ringCoords: GeoJSON.Position[][] = coordinatesMat.map(coordinates => MapUtils.convertCoordinatesToGeoJsonCoordinates(coordinates));
		const geoJson =  turf.polygon(ringCoords);
		const feature = this.dataLayer.addGeoJson(geoJson)[0];
		this.dataLayer.remove(feature);
		return feature.getGeometry() as google.maps.Data.Polygon;
	}

	private exitEditMode() {
		this.editablePolygon.setMap(null);
		this.editablePolygon = null;
		this.setVisibility(true);
	}

	private replacePolygonToEditablePolygon() {
		this.setVisibility(false);
		const latLngMat = this.gmMapComponent.utils.coordinatesRingsTolatlngsRings(this.baseCoordinates);
		this.editablePolygon = new google.maps.Polygon({paths: latLngMat});
		this.editablePolygon.setMap(this.gmMapComponent.nativeMapInstance);
	}

	private finishEditMode() {
		const latLngMat = this.editablePolygon.getPaths().getArray().map(path => path.getArray());

		const coordinateRings = this.gmMapComponent.utils.latlngsRingsToCoordinatesRings(latLngMat);
		this.baseCoordinates = coordinateRings;
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

}