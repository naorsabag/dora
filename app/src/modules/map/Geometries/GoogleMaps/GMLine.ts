import { IActionToken } from "../../Common/IActionToken";
import { GoogleMapsMapComponent } from "../../Components/GoogleMapsMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GMGraphicsUtils } from "../../GraphicsUtils/GMGraphicsUtils";
import { Coordinate } from "../Coordinate";
import { ILayer } from "../../Layers/ILayer";
import { Line } from "../Line";
import centroid from "@turf/centroid";

export class GMLine extends Line {
	private gmMapComponent: GoogleMapsMapComponent;
	private editablePolyline: google.maps.Polyline;

	constructor(mapComponent: GoogleMapsMapComponent,
				coordinates: Coordinate[],
				design?: IGeometryDesign,
				id?: string) {
		super(mapComponent, coordinates, design, id);

		this.gmMapComponent = mapComponent;

		this.graphicsUtils = new GMGraphicsUtils(mapComponent);
	}

	protected addNativeGeometryToMap(): void {
		this.gmMapComponent.nativeMapInstance.data.add(this.geometryOnMap);
	}

	protected removeNativeGeometryFromMap(): void {
		this.gmMapComponent.nativeMapInstance.data.remove(this.geometryOnMap);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	protected addNativeGeometryToLayer(layer: ILayer): void {
		this.gmMapComponent.nativeMapInstance.data.add(this.geometryOnMap);
	}

	protected removeNativeGeometryFromLayer(layer: ILayer): void {
		this.gmMapComponent.nativeMapInstance.data.remove(this.geometryOnMap);
	}

	protected generateGeometryOnMap(): void {
		if (this.geometryOnMap === null) {
			this.geometryOnMap = new google.maps.Data.Feature();
		}
		this.applyTransformations();
		if (this.multilineCoordsDraft === null && this.multipolygonCoordsDraft === null) {
			let latLngArr: google.maps.LatLng[] = this.transformedCoordinates.map(c => this.gmMapComponent.utils.coordinateToLatLng(c));
			let lineString: google.maps.Data.LineString = new google.maps.Data.LineString(latLngArr);
			this.geometryOnMap.setGeometry(lineString);
		}
		else {

			if (this.multilineCoordsDraft !== null) {
				let latLngArr: google.maps.LatLng[][] = [];

				this.multilineCoordsDraft.forEach((line: Coordinate[]) => {
					latLngArr.push(line.map(c => this.gmMapComponent.utils.coordinateToLatLng(c)));
				});
				let multiLineString: google.maps.Data.MultiLineString = new google.maps.Data.MultiLineString(latLngArr);
				this.geometryOnMap.setGeometry(multiLineString);
			}

			if (this.multipolygonCoordsDraft !== null) {
				let polygons: google.maps.Data.Polygon[] = [];
				this.multipolygonCoordsDraft.forEach((coords: Coordinate[]) => {
					let latLngs: google.maps.LatLng[] = coords.map(c => this.gmMapComponent.utils.coordinateToLatLng(c));
					let polygon: google.maps.Data.Polygon = new google.maps.Data.Polygon([new google.maps.Data.LinearRing(latLngs)]);
					polygons.push(polygon);
				});
				let multiPolygon: google.maps.Data.MultiPolygon = new google.maps.Data.MultiPolygon(polygons);
				this.geometryOnMap.setGeometry(multiPolygon);
			}
		}
		this.multilineCoordsDraft = null;
		this.multipolygonCoordsDraft = null;

		this.generateIconsCoordinates();
	}

	public edit(token: IActionToken): void {
		this.setVisibility(false);
		let latLngArr: google.maps.LatLng[] = this.baseCoordinates.map(c => this.gmMapComponent.utils.coordinateToLatLng(c));
		this.editablePolyline = new google.maps.Polyline({path: latLngArr});
		this.editablePolyline.setMap(this.gmMapComponent.nativeMapInstance);
		this.editablePolyline.setEditable(true);

		token.finish = () => {
			this.baseCoordinates = this.editablePolyline.getPath().getArray().map(latLng => this.gmMapComponent.utils.latLngToCoordinate(latLng));
			this.generateGeometryOnMap();
			this.editablePolyline.setMap(null);
			this.editablePolyline = null;
			this.setVisibility(true);
		};

		token.cancel = () => {
			this.editablePolyline.setMap(null);
			this.editablePolyline = null;
			this.setVisibility(true);
		};
	}

	public drag(token: IActionToken): void {
		this.setVisibility(false);
		let latLngArr: google.maps.LatLng[] = this.baseCoordinates.map(c => this.gmMapComponent.utils.coordinateToLatLng(c));
		this.editablePolyline = new google.maps.Polyline({path: latLngArr});
		this.editablePolyline.setMap(this.gmMapComponent.nativeMapInstance);
		this.editablePolyline.setDraggable(true);

		token.finish = () => {
			this.baseCoordinates = this.editablePolyline.getPath().getArray().map(latLng => this.gmMapComponent.utils.latLngToCoordinate(latLng));
			this.generateGeometryOnMap();
			this.editablePolyline.setMap(null);
			this.editablePolyline = null;
			this.setVisibility(true);
		};

		token.cancel = () => {
			this.editablePolyline.setMap(null);
			this.editablePolyline = null;
			this.setVisibility(true);
		};
	}

	public setVisibility(state: boolean): void {
		if (this.isOnMap) {
			this.gmMapComponent.nativeMapInstance.data.overrideStyle(this.geometryOnMap, {visible: state});
		}
		this.iconPoints.forEach(iconPoint => {
			iconPoint.setVisibility(state);
		});
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		let center = Coordinate.fromGeoJSON(centroid(this.getGeoJSON()).geometry.coordinates);
		this.gmMapComponent.utils.openBalloonHtml(html, center);
	}

	protected setLineColor(color: string): void {
		this.gmMapComponent.nativeMapInstance.data.overrideStyle(this.geometryOnMap, {
			strokeColor: color
		});
	}

	protected setLineOpacity(opacity: number): void {
		this.gmMapComponent.nativeMapInstance.data.overrideStyle(this.geometryOnMap, {
			strokeOpacity: opacity
		});
	}

	protected setLineWidth(width: number): void {
		this.gmMapComponent.nativeMapInstance.data.overrideStyle(this.geometryOnMap, {
			strokeWeight: width
		});
	}

	protected setFillColor(color: string): void {
		this.gmMapComponent.nativeMapInstance.data.overrideStyle(this.geometryOnMap, {
			fillColor: color
		});
	}

	protected setFillOpacity(opacity: number): void {
		this.gmMapComponent.nativeMapInstance.data.overrideStyle(this.geometryOnMap, {
			fillOpacity: opacity
		});
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachDataEventListener(this.geometryOnMap, "click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachDataEventListener(this.geometryOnMap, "dblclick", listener);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachDataEventListener(this.geometryOnMap, "rightclick", listener);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachDataEventListener(this.geometryOnMap, "mouseover", listener);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachDataEventListener(this.geometryOnMap, "mouseout", listener);
	}

	public setId(value: string): void {}
	public getId(): string {
		return null;
	}
}