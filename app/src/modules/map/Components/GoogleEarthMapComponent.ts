import { IMapConfig } from "../Config/IMapConfig";
import { MapConfig } from "../Config/MapConfig";
import { MapEventArgs } from "../Events/MapEventArgs";
import { Geodesy } from "../Geodesy/Geodesy";
import { GEGeometryBuilder } from "../Geometries/Builder/GEGeometryBuilder";
import { Coordinate } from "../Geometries/Coordinate";
import { GEUtilities } from "../MapUtils/GEUtilities";
import { XXXMapUtils } from "../MapUtils/XXXMapUtils";
import { RasterInfo } from "../Utilities/RasterInfo";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import { GEGeometryDrawing } from "../Geometries/Drawing/GEGeometryDrawing";
import { MapComponent } from "./MapComponent";
import { IViewBounds } from "./View/IViewBounds";
import { ViewBounds } from "./View/ViewBounds";
import { PROJECTIONS } from "../Geodesy/Consts";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { GEControlBuilder } from "./Controls/Builder/GEControlBuilder";
import { IGoogleEarthConfig } from "../Config/IGoogleEarthConfig";
import { GoogleEarthConfig } from "../Config/GoogleEarthConfig";
import { GEKMLGeometryCollection } from "../Geometries/GoogleEarth/GEKmlGeometryCollection";
import { MapType } from "@dora/map-types";

export class GoogleEarthMapComponent extends MapComponent {
	/**
	 * Class internal property for Google-earth map instance.
	 */
	public map: google.earth.GEPlugin;

	/**
	 * **The Google-Earth native map type** used on background.
	 * @throws Whether can not load map library object from dependencies.
	 */
	public get mapLibraryObject(): typeof google.earth.GEPlugin {
		return google.earth.GEPlugin;
	}

	/**
	 * Initialize Google-Earth map instance.
	 * **Used by guest systems. Host systems will use the .load function**
	 * @param {google.earth.GEPlugin} mapInstance - An actual Google-Earth map instance [any due to abstraction design]. Cannot set as undefined/null.
	 * @throws Whether:
	 * 1. Invalid map-instance object.
	 * 2. When map-instance already exist.
	 */
	public initNativeMapInstance(mapInstance: google.earth.GEPlugin): void {
		// Check if given 'mapInstance' argument is undefined/null or not instance of map-instance
		if (!mapInstance) {
			throw new TypeError("Invalid type for google earth's map-instance.");
		}

		// Check whether map already initialized
		if (this.map) {
			throw new Error("Google Earth map-instance already initialized");
		}

		this.map = mapInstance;
		this.utils = new GEUtilities(this.map, this.config);
		XXXMapUtils["ge"] = this.map;
	}

	/**
	 * **The leaflet** actual map's instance.
	 * @returns {google.earth.GEPlugin} cesium map instance
	 * @throws When native map instance has not initialized.
	 */
	public get nativeMapInstance(): google.earth.GEPlugin {
		// Check whether map-instance initialize
		if (this.map) {
			return this.map;
		}

		throw new Error("Google-Earth map-instance does not initialize");
	}

	/**
	 * Google-Earth type
   	 * @returns {MapType} Google-Earth map type
	 */
	public get nativeMapType(): MapType {
		return MapType.GOOGLE_EARTH;
	}

	public utils: GEUtilities;
	protected config: GoogleEarthConfig = new GoogleEarthConfig();
	private loadPromise: Promise<void> = null;
	private currentZoom: number;

	constructor(config?: IGoogleEarthConfig) {
		super();

		this.geometryBuilder = new GEGeometryBuilder(this);
		this.geometryDrawing = new GEGeometryDrawing(this);
		this.controlBuilder = new GEControlBuilder(this);

		if (typeof config !== "undefined") {
			this.config.update(config);
		}
	}

	public createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer {
		let groundOverlay = this.map.createGroundOverlay("");
		let icon = this.map.createIcon("");
		icon.setHref(imageUrl);
		groundOverlay.setIcon(icon);
		groundOverlay.setLatLonBox(this.map.createLatLonBox(""));
		const latLonBox = groundOverlay.getLatLonBox();
		latLonBox.setBox(bbox.north, bbox.south, bbox.east, bbox.west, 0);

		const raster: IBaseLayer = {
			name: "image",
			isSelected: false,
			addToMap: async () => {
				this.map.getFeatures().appendChild(groundOverlay);
			},
			remove: async () => {
				this.map.getFeatures().removeChild(groundOverlay);
			}
		};

		return raster;
	}

	public load(): Promise<void> {
		if (this.loadPromise === null) {
			this.loadPromise = new Promise<void>((resolve, reject) => {
				XXXMapUtils.initGoogleEarth({
					id: this.config.mapDivId
				}).then(gePlugin => {
					this.map = gePlugin;
					this.utils = new GEUtilities(this.map, this.config);
					resolve();
				}, reject);
			});
		}

		return this.loadPromise;
	}

	public getViewBounds(): IViewBounds {
		let geBounds = this.map.getView().getViewportGlobeBounds();
		return new ViewBounds(geBounds.getNorth(), geBounds.getSouth(), geBounds.getWest(), geBounds.getEast());
	}

	public getViewCenter(): Coordinate {
		let bounds: ViewBounds = this.getViewBounds();
		let lat = (bounds.north + bounds.south) / 2;
		let lon = (bounds.west + bounds.east) / 2;
		return new Coordinate(lat, lon);
	}

	public async flyTo(coordinate: Coordinate): Promise<void> {
		await XXXMapUtils.focusTo(coordinate.longitude, coordinate.latitude, 500, 0, 0);
	}

	public async flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration?: number, beautify?: boolean): Promise<void> {
		let lookAt: google.earth.KmlLookAt = this.map.createLookAt("");

		lookAt.setLatitude((southWest.latitude + northEast.latitude) / 2);
		lookAt.setLongitude((southWest.longitude + northEast.longitude) / 2);
		let southWestUTM = Geodesy.convertCoordinate(southWest, PROJECTIONS.WGS84GEO, PROJECTIONS.PROJDUTMIII).coordinate;
		let northEastUTM = Geodesy.convertCoordinate(northEast, PROJECTIONS.WGS84GEO, PROJECTIONS.PROJDUTMIII).coordinate;

		let range = Math.max(northEastUTM.latitude - southWestUTM.latitude, northEastUTM.longitude - southWestUTM.longitude);

		if (range === 0) {
			range = 100;
		}

		lookAt.setRange(range);
		lookAt.setTilt(0);
		lookAt.setHeading(0);
		await this.map.getView().setAbstractView(lookAt);
	}

	public async setZoom(zoom: number): Promise<void> {
		let coordinate = this.getViewCenter();
		await XXXMapUtils.focusTo(coordinate.longitude, coordinate.latitude, zoom, 0, 0);
	}

	public getHeading(): number {
		const lookAt = this.map
			.getView()
			.copyAsLookAt(this.map.ALTITUDE_RELATIVE_TO_GROUND);
		return lookAt.getHeading();
	}

	public setHeading(azimuth: number): void {
		const lookAt = this.map
			.getView()
			.copyAsLookAt(this.map.ALTITUDE_RELATIVE_TO_GROUND);
		lookAt.setHeading(azimuth);
		this.map.getView().setAbstractView(lookAt);
	}

	public getRasters(): RasterInfo[] {
		// Todo
		return [];
	}

	/**
	 * Loading KML onto the map
	 * @param kmlDocument Can be XML string or an URL to fetch from
	 * @param {boolean} changePolyToLine - change polygons to lines
	 * @param {boolean} hover - indicates if the entities will be highlighted on hover
	 * @return {Promise<IKMLGeometryCollection>} - kml object when finish
	 */
	public loadKML(kmlDocument: Document | string, changePolyToLine?: boolean, hover?: boolean): Promise<IKMLGeometryCollection> {

		// Check if the kmlDocument recieved is not a string,
		// because now only string is supported for loadKML function in GoogleEarthMapComponent
		if (typeof kmlDocument !== "string") {
			throw `The function loadKml is currently supported only for kmlDocument of type 'string' in GoogleEarth map type.
				   Type of kmlDocument that recieved: '${typeof kmlDocument}'.`;
		}

		return new Promise((resolve, reject) => {

			if (kmlDocument.indexOf("LINK") === 0) {

				// Fetching from the url recieved
				google.earth.fetchKml(this.map, kmlDocument, (kmlObject) => {

					if (kmlObject) {
						kmlObject.setOpacity(1);
						this.map.getFeatures().appendChild(kmlObject);
						resolve(new GEKMLGeometryCollection(kmlObject, this));
					} else {
						reject("The KML did not compiled successfully");
					}
				});
			} else {
				const kmlObject = this.map.parseKml(kmlDocument) as google.earth.KmlFeature;

				if (kmlObject) {
					kmlObject.setOpacity(1);
					this.map.getFeatures().appendChild(kmlObject);
					resolve(new GEKMLGeometryCollection(kmlObject, this));
				} else {
					reject("The KML did not compiled successfully");
				}
			}
		});
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("dblclick", listener);
	}

	protected addRightClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addMouseEventListener("rightclick", listener);
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

	protected addZoomChangedListener(listener: (currentZoom: number) => void): () => void {
		let geHandler = () => {
			let lookAt = this.map
				.getView()
				.copyAsLookAt(this.map.ALTITUDE_ABSOLUTE);
			let range = Math.floor(lookAt.getRange());

			if (range !== this.currentZoom) {
				this.currentZoom = range;
				if (this.config.debugMode) {
					setTimeout(() => {
						listener(range);
					}, 100);
				} else {
					listener(range);
				}
			}
		};

		google.earth.addEventListener(this.map.getView(), "viewchangeend", geHandler);

		//return a method that cancels the event
		return () => {
			google.earth.removeEventListener(this.map.getView(), "viewchangeend", geHandler);
		};
	}

	protected addViewChangedListener(listener: ((bounds: ViewBounds) => void)): () => void {
		let geHandler = () => {
			let bounds = this.getViewBounds();
			if (this.config.debugMode) {
				setTimeout(() => {
					listener(bounds);
				}, 100);
			} else {
				listener(bounds);
			}
		};

		google.earth.addEventListener(this.map.getView(), "viewchangeend", geHandler);

		//return a method that cancels the event
		return () => {
			google.earth.removeEventListener(this.map.getView(), "viewchangeend", geHandler);
		};
	}

	private addMouseEventListener(eventName: string, listener: (eventArgs?: MapEventArgs) => void): () => void {
		let checkButton = -1;
		if (eventName === "rightclick") {
			eventName = "click";
			checkButton = 2;
		} else if (eventName === "click") {
			checkButton = 0;
		}
		let geHandler = (event: google.earth.KmlMouseEvent) => {
			if (checkButton !== -1 && event.getButton() !== checkButton) {
				return;
			}
			let mapEventArgs: MapEventArgs = new MapEventArgs(
				event.getLongitude(),
				event.getLatitude(),
				event.getAltitude(),
				event.getButton(),
				event.getCtrlKey(),
				event.getAltKey(),
				event.getShiftKey(),
				event.getClientX(),
				event.getClientY(),
				event.preventDefault,
				event
			);

			if (this.config.debugMode) {
				setTimeout(() => {
					listener(mapEventArgs);
				}, 100);
			} else {
				listener(mapEventArgs);

			}
		};

		google.earth.addEventListener(this.map.getGlobe(), eventName, geHandler);

		//return a method that cancels the event
		return () => {
			google.earth.removeEventListener(this.map.getGlobe(), eventName, geHandler);
		};
	}

	public getConfig(): IGoogleEarthConfig {
		return <IGoogleEarthConfig>super.getConfig();
	}

	public changeDimension() {
	}

	public getIs2D(): boolean {
		return false;
	}

	public orientMapNorth(tilt?: boolean): void {
		throw new Error("Method not implemented.");
	}
}
