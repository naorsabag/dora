import { ILeafletConfig } from "../Config/ILeafletConfig";
import { ITileLayerProvider } from "../Config/ITileLayerProvider";
import { LeafletConfig } from "../Config/LeafletConfig";
import { MapEventArgs } from "../Events/MapEventArgs";
import { LLGeometryBuilder } from "../Geometries/Builder/LLGeometryBuilder";
import { Coordinate } from "../Geometries/Coordinate";
import { LLGeometryDrawing } from "../Geometries/Drawing/LLGeometryDrawing";
import { LLUtilties } from "../MapUtils/LLUtilities";
import { RasterInfo } from "../Utilities/RasterInfo";
import { MapComponent } from "./MapComponent";
import { IViewBounds } from "./View/IViewBounds";
import { ViewBounds } from "./View/ViewBounds";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import * as L from "leaflet";
import * as _ from "underscore";
import * as $ from "jquery";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "../../../../vendor/leaflet-path-drag-fixed/L.Path.Drag-src.fixed";
import "../../../../vendor/leaflet-draw-polygon-fix/index";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { LLControlBuilder } from "./Controls/Builder/LLControlBuilder";
import { MapType } from "@dora/map-types";
import { LLRastersLoader } from "../OverlayLayers/RastersLoaders/LLRastersLoader";
import { HttpUtils } from "../Utilities/HttpUtils";

export class LeafletMapComponent extends MapComponent {
	/**
	 * Class internal property for leaflet map instance.
	 */
	protected map: L.Map;

	/**
	 * **The leaflet native map type** used on background.
	 * @throws Whether can not load map library object from dependencies.
	 */
	public get mapLibraryObject(): typeof L {
		// L is the library object of leaflet
		return L;
	}

	/**
	 * Initialize leaflet map instance.
	 * **Used by guest systems. Host systems will use the .load function**
	 * @param {L.Map} mapInstance - An actual leaflet map instance [any due to abstraction design]. Cannot set as undefined/null.
	 * @throws Whether:
	 * 1. Invalid map-instance object.
	 * 2. When map-instance already exist.
	 */
	public initNativeMapInstance(mapInstance: L.Map): void {
		// Check if given 'mapInstance' is undefined/null or not instance of map-instance
		if (!mapInstance) {
			throw new TypeError("Invalid type for leaflet's map-instance.");
		}

		// Check whether map already initialized
		if (this.map) {
			throw new Error("Leaflet map-instance already initialized");
		}

		this.map = mapInstance;
	}

	/**
	 * **The leaflet** actual map's instance.
	 * @returns {L.Map} cesium map instance
	 * @throws When native map instance has not initialized.
	 */
	public get nativeMapInstance(): L.Map {
		// Check whether map-instance initialize
		if (this.map) {
			return this.map;
		}

		throw new Error("Leaflet map-instance does not initialize");
	}

	/**
	 * Leaflet type
   	 * @returns {MapType} Leaflet map type
	 */
	public get nativeMapType(): MapType {
		return MapType.LEAFLET;
	}

	public useCluster: boolean;
	protected config: LeafletConfig = new LeafletConfig();
	private currentLayer: L.TileLayer.WMS;

	constructor(config?: ILeafletConfig) {
		super();

		this.utils = new LLUtilties();
		this.geometryBuilder = new LLGeometryBuilder(this);
		this.geometryDrawing = new LLGeometryDrawing(this);
		this.controlBuilder = new LLControlBuilder(this);
		this.rastersLoader = new LLRastersLoader(this);
		if (typeof config !== "undefined") {
			this.config.update(config);
			this.useCluster = this.config.useCluster;
		}
	}

	public createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer {
		let overlay = L.imageOverlay(imageUrl, new L.LatLngBounds(new L.LatLng(bbox.south, bbox.west), new L.LatLng(bbox.north, bbox.east)));
		const raster: IBaseLayer = {
			name: "image",
			isSelected: false,
			addToMap: async () => {
				overlay.addTo(this.map);
			},
			remove: async () => {
				overlay.remove();
			}
		};
		return raster;
	}

	public async load(): Promise<void> {
		let loadPromise: Promise<void> = null;

		let baseLayers = this.getLayersFromConfig(this.config.baseLayers);
		let overlayLayers = this.getLayersFromConfig(this.config.overlayLayers);

		let layers = baseLayers.concat(overlayLayers);

		let mapOptions: L.MapOptions = {
			crs: this.config.crs,
			layers: layers,
			minZoom: 5,
			maxZoom: 18,
			zoomControl: false,
			center: [this.config.center.latitude, this.config.center.longitude],
			zoom: 7,
			preferCanvas: this.config.preferCanvas
		};

		this.map = L.map(this.config.mapDivId, mapOptions);

		loadPromise = new Promise<void>((resolve, reject) => {
			baseLayers[0].once("load", () => {
				this.map.invalidateSize({});
				resolve();
			});
		});

		let baseLayersControl = this.getLayersControl(baseLayers);
		let overlayLayersControl = this.getLayersControl(overlayLayers);

		let rasters = await this.rastersLoader.loadLayers().catch(error => {
			// Case there is an error in rasters service, return no rasters
			return [];
		});

		rasters.forEach(rasterLayer => {
			let wmsLink = rasterLayer.links.wms;
			let wmsObj = L.tileLayer.wms(wmsLink);
			baseLayersControl[rasterLayer.name] = wmsObj;
		});

		L.control.layers(baseLayersControl, overlayLayersControl, { position: "topleft" }).addTo(this.map);
		this.addLayerChangedListener();

		LLUtilties.overrideMarkerDefaultIcon();


		return loadPromise;
	}

	private getLayersControl(layers: L.TileLayer[]): { [name: string]: L.TileLayer } {
		let layersControl: { [name: string]: L.TileLayer } = {};
		_.each(layers, (baseLayer) => {
			layersControl[baseLayer.options.attribution] = baseLayer;
		});
		return layersControl;
	}

	private getLayersFromConfig(layersFromConfig: ITileLayerProvider[]): Array<L.TileLayer> {
		let layers = new Array<L.TileLayer>();
		_.each(layersFromConfig, (currentLayer: ITileLayerProvider) => {
			let tileLayer: L.TileLayer;
			if (currentLayer.isWMS) {
				tileLayer = L.tileLayer.wms(currentLayer.url, currentLayer.options);
			}
			else {
				tileLayer = L.tileLayer(currentLayer.url, currentLayer.options);
			}
			layers.push(tileLayer);
		});
		return layers;
	}

	public getViewBounds(): IViewBounds {
		let leafletBounds = this.map.getBounds();
		let bounds = new ViewBounds(leafletBounds.getNorth(),
			leafletBounds.getSouth(),
			leafletBounds.getWest(),
			leafletBounds.getEast());
		return bounds;
	}

	public getViewCenter(): Coordinate {
		return LLUtilties.latLngToCoordinate(this.map.getCenter());
	}

	public async flyTo(coordinate: Coordinate): Promise<void> {
		let latlng = LLUtilties.coordinateToLatLng(coordinate);
		await this.map.flyTo(latlng);
	}

	public async flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration?: number, beautify?: boolean): Promise<void> {
		let bounds: L.LatLngBoundsExpression = L.latLngBounds(LLUtilties.coordinateToLatLng(southWest),
			LLUtilties.coordinateToLatLng(northEast));
		await this.map.flyToBounds(bounds);
	}

	public async setZoom(zoom: number): Promise<void> {
		await this.map.setZoom(zoom);
	}

	// TODO: not supporting or not implemented
	public getHeading(): number {
		throw new Error("Leaflet does not support rotating the map");
	}

	// TODO: not supporting or not implemented
	public setHeading(azimuth: number): void {
		throw new Error("Leaflet does not support rotating the map");
	}

	// TODO: difference between this and RastersLoader
	getRasters(): RasterInfo[] {
		const rasters: Array<RasterInfo> = [];
		this.map.eachLayer((layer: L.Layer) => {
			if (layer instanceof L.TileLayer) {
				let raster = new RasterInfo(layer.options.layers);
				raster.DisplayName = layer.getAttribution();
				rasters.push(raster);
			}
		});
		return rasters;
	}

	// TODO: Not implemented | TODO: more valuable name ?
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
		return this.addMouseEventListener("contextmenu", listener);
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

	protected addZoomChangedListener(listener: ((currentZoom: number) => void)): () => void {
		let onZoomChanged = (eventParams) => {
			listener(this.map.getZoom());
		};

		this.map.on("zoomend", onZoomChanged);

		const closeEvent = () => {
			this.map.off("zoomend", onZoomChanged);
		};

		return closeEvent;
	}

	protected addViewChangedListener(listener: ((bounds: IViewBounds) => void)): () => void {
		let onViewChanged: L.LeafletEventHandlerFn = (eventParams) => {
			listener(this.getViewBounds());
		};

		this.map.on("moveend", onViewChanged);

		const closeEvent = () => {
			this.map.off("moveend", onViewChanged);
		};

		return closeEvent;
	}


	private addMouseEventListener(eventName: string, listener: (eventArgs?: MapEventArgs) => void): () => void {
		let leafletHandler = (event: L.LeafletMouseEvent) => {
			let mapEventArgs: MapEventArgs = new MapEventArgs(
				event.latlng.lng,
				event.latlng.lat,
				event.latlng.alt,
				event.originalEvent.button,
				event.originalEvent.ctrlKey,
				event.originalEvent.altKey,
				event.originalEvent.shiftKey,
				event.containerPoint.x,
				event.containerPoint.y,
				event.originalEvent.preventDefault.bind(event.originalEvent),
				event);

			listener(mapEventArgs);
		};

		this.map.on(eventName, leafletHandler);
		let closeEvent = () => {
			this.map.off(eventName, leafletHandler);
		};

		return closeEvent;
	}

	private addLayerChangedListener = (): void => {
		this.map.on("baselayerchange", (event: L.LayersControlEvent) => {
			if (event.name === "!!!!! !!!!!") {
				if (this.currentLayer) {
					this.map.removeLayer(this.currentLayer);
					this.currentLayer = undefined;
				}
			}
			else {
				const url: string = (<any>event.layer)._url;
				HttpUtils.get(url).then((result: string) => {
					// Get the info from the xml
					let xml = $.parseXML(result);
					let url = xml.getElementsByTagName("OnlineResource")[0].getAttribute("xlink:href");
					let layerName = xml.getElementsByTagName("Name")[1].textContent;

					let wmsObj = L.tileLayer.wms(url, {
						layers: layerName,
						format: "image/png",
						transparent: true,
						crs: L.CRS.EPSG4326,
						id: "1", attribution: "!!!! !!!!", maxZoom: this.map.getMaxZoom(), minZoom: this.map.getMinZoom()
					});

					if (this.currentLayer) {
						this.map.removeLayer(this.currentLayer);
					}

					wmsObj.addTo(this.map);
					this.currentLayer = wmsObj;
				});
			}
		});
	}

	public getConfig(): ILeafletConfig {
		return <ILeafletConfig>super.getConfig();
	}

	// TODO: Not implemented | TODO: more valuable name ?
	public changeDimension() {
		throw Error("Method not implemented.");
	}

	// TODO: Not implemented | TODO: more valuable name ?
	public getIs2D(): boolean {
		return true;
	}

	// TODO: Not implemented | TODO: more valuable name ?
	public orientMapNorth(tilt?: boolean): void {
		throw new Error("Method not implemented.");
	}
}