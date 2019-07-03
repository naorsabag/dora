import { IMapConfig } from "../Config/IMapConfig";
import { MapConfig } from "../Config/MapConfig";
import { MapEventArgs } from "../Events/MapEventArgs";
import { GMGeometryBuilder } from "../Geometries/Builder/GMGeometryBuilder";
import { Coordinate } from "../Geometries/Coordinate";
import { GMUtilities } from "../MapUtils/GMUtilities";
import { RasterInfo } from "../Utilities/RasterInfo";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import { GMGeometryDrawing } from "../Geometries/Drawing/GMGeometryDrawing";
import { MapComponent } from "./MapComponent";
import { IViewBounds } from "./View/IViewBounds";
import { ViewBounds } from "./View/ViewBounds";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { GMControlBuilder } from "./Controls/Builder/GMControlBuilder";
import { MapType } from "@dora/map-types";

declare const geeServerDefs;
declare const GFusionMap;

export class GoogleMapsMapComponent extends MapComponent {
	/**
	* Class internal property for google-maps map instance
	*/
	public map: google.maps.Map;

	/**
	* **The google-map native map type** used on background.
	* @throws Whether can not load map library object from dependencies.
	*/
	public get mapLibraryObject(): typeof google.maps {
		return google.maps;
	}

	/**
	 * Initialize cesium map instance.
	 * **Used by guest systems. Host systems will use the .load function**
	 * @param {google.maps.Map} mapInstance - An actual google-maps map instance [any due to abstraction design]. Cannot set as undefined/null.
	 * @throws Whether:
	 * 1. Invalid map-instance object.
	 * 2. When map-instance already exist.
	 */
	public initNativeMapInstance(mapInstance: google.maps.Map): void {
		// Check if given 'mapInstance' argument is undefined/null or not instance of map-instance
		if (!mapInstance) {
			throw new TypeError("Invalid type for google maps's map-instance.");
		}

		// Check whether map already initialized
		if (this.map) {
			throw new Error("Google Maps map-instance already initialized");
		}

		this.map = mapInstance;
		this.utils = new GMUtilities(this.map);
	}

	/**
	 * **The google-maps** actual map's instance.
	 * @returns {google.maps.Map} Google-map map instance
	 * @throws When native map instance has not initialized.
	 */
	public get nativeMapInstance(): google.maps.Map {
		// Check whether map-instance initialize
		if (this.map) {
			return this.map;
		}

		throw new Error("Google-Maps map-instance does not initialize");
	}

	/**
	 * Map type
   	 * @returns {MapType} Google-maps map type
	 */
	public get nativeMapType(): MapType {
		return MapType.GOOGLE_MAPS;
	}

	public utils: GMUtilities;
	protected config: MapConfig = new MapConfig();

	constructor(config?: IMapConfig) {
		super();
		this.geometryBuilder = new GMGeometryBuilder(this);
		this.geometryDrawing = new GMGeometryDrawing(this);
		this.controlBuilder = new GMControlBuilder(this);

		if (typeof config !== "undefined") {
			this.config.update(config);
		}
	}

	public createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer {
		let overlay = new google.maps.GroundOverlay(imageUrl, new google.maps.LatLngBounds(
			new google.maps.LatLng(bbox.south, bbox.west), new google.maps.LatLng(bbox.north, bbox.east)
		));
		const raster: IBaseLayer = {
			name: "image",
			isSelected: false,
			addToMap: async () => {
				overlay.setMap(this.map);
			},
			remove: async () => {
				overlay.setMap(null);
			}
		};
		return raster;
	}

	public load(): Promise<void> {
		let options: google.maps.MapOptions = {
			zoom: 8,
			minZoom: 4,
			center: new google.maps.LatLng(this.config.center.latitude, this.config.center.longitude),
			zoomControl: false,
			mapTypeControl: false,
			streetViewControl: false,
			scaleControl: false,
			disableDefaultUI: true
		};

		let gFusionObj = new GFusionMap(this.config.mapDivId, geeServerDefs, options);
		this.map = gFusionObj.map;
		this.utils = new GMUtilities(this.map);

		return new Promise<void>((resolve, reject) => {
			google.maps.event.addListenerOnce(this.map, "tilesloaded", () => {
				resolve();
			});
		});
	}

	public getViewBounds(): IViewBounds {
		let bounds = this.map.getBounds();
		let north = bounds.getNorthEast().lat();
		let east = bounds.getNorthEast().lng();
		let south = bounds.getSouthWest().lat();
		let west = bounds.getSouthWest().lng();
		return new ViewBounds(north, south, west, east);
	}

	public getViewCenter(): Coordinate {
		return this.utils.latLngToCoordinate(this.map.getCenter());
	}

	public async flyTo(coordinate: Coordinate): Promise<void> {
		await this.map.panTo(this.utils.coordinateToLatLng(coordinate));
	}

	public async flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration?: number, beautify?: boolean): Promise<void> {
		let bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds(this.utils.coordinateToLatLng(southWest),
			this.utils.coordinateToLatLng(northEast));
		await this.map.fitBounds(bounds);
	}

	public async setZoom(zoom: number): Promise<void> {
		await this.map.setZoom(zoom);
	}

	public getHeading(): number {
		throw new Error("Google Maps does not support rotating the map");
	}

	public setHeading(azimuth: number): void {
		throw new Error("Google Maps does not support rotating the map");
	}

	public getRasters(): RasterInfo[] {
		// Todo

		return [];
	}

	public loadKML(kmlDocument: Document | string, changePolyToLine?: boolean, hover?: boolean): Promise<IKMLGeometryCollection> {
		throw Error("Method not implemented.");
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("dblclick", listener);
	}

	protected addRightClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addrightMouseEventListener(listener);
	}

	protected addMouseMoveListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("mousemove", listener);
	}

	protected addMouseDownListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("mousedown", listener);
	}

	protected addMouseUpListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("mouseup", listener);
	}

	protected addZoomChangedListener(callback: (currentZoom: number) => void): () => void {
		let onZoomChanged = (eventParams) => {
			if (callback != null && typeof callback === "function") {
				callback(this.map.getZoom());
			}
		};

		let listener = google.maps.event.addListener(this.map, "zoom_changed", onZoomChanged);

		const closeEvent = () => {
			google.maps.event.removeListener(listener);
		};

		return closeEvent;
	}

	protected addViewChangedListener(callback: (bounds: ViewBounds) => void): () => void {
		let onViewChanged = (eventParams) => {
			if (callback != null && typeof callback === "function") {
				callback(this.getViewBounds());
			}
		};

		let listener = google.maps.event.addListener(this.map, "dragend", onViewChanged);

		const closeEvent = () => {
			google.maps.event.removeListener(listener);
		};

		return closeEvent;
	}

	private addrightMouseEventListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		let gmHandler = (event: any) => {
			let latLng = this.utils.mapPixelsToLatLng(event.x, event.y);
			const mapEvent: MapEventArgs = new MapEventArgs(
				latLng.lng(),
				latLng.lat(),
				0,
				event.button,
				event.ctrlKey,
				event.altKey,
				event.shiftKey,
				event.x,
				event.y, event.preventDefault, event);
			listener(mapEvent);
		};

		let nativeEventListener = google.maps.event.addListener(this.map, "rightclick", gmHandler);

		let closeEvent = () => {
			google.maps.event.removeListener(nativeEventListener);
		};

		return closeEvent;
	}

	private addMouseEventListener(eventName: string, listener: (eventArgs?: MapEventArgs) => void): () => void {
		let gmHandler = (event: any) => {
			let latLng = this.utils.mapPixelsToLatLng(event.x, event.y);
			const mapEvent: MapEventArgs = new MapEventArgs(
				latLng.lng(),
				latLng.lat(),
				0,
				event.button,
				event.ctrlKey,
				event.altKey,
				event.shiftKey,
				event.x,
				event.y, event.preventDefault, event);
			listener(mapEvent);
		};

		let nativeEventListener = google.maps.event.addDomListener(this.map.getDiv(), eventName, gmHandler);

		let closeEvent = () => {
			google.maps.event.removeListener(nativeEventListener);
		};

		return closeEvent;
	}

	public changeDimension() {
	}

	public getIs2D(): boolean {
		return true;
	}

	public orientMapNorth(tilt?: boolean): void {
		throw new Error("Method not implemented.");
	}
}