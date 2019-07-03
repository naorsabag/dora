import viewerCesiumNavigationMixin from "cesium-navigation";
import "cesium/Source/Cesium";
import "cesium/Source/Widgets/widgets.css";
import * as $ from "jquery";
import { CesiumConfig } from "../Config/CesiumConfig";
import { CesiumRasterImageryProvider } from "../Config/CesiumRasterImageryProvider";
import { ICesiumConfig } from "../Config/ICesiumConfig";
import { MapEventArgs } from "../Events/MapEventArgs";
import { CesiumGeometryBuilder } from "../Geometries/Builder/CesiumGeometryBuilder";
import { CesiumKMLGeometryCollection } from "../Geometries/Cesium/CesiumKmlGeometryCollection";
import { CesiumNetworkLink } from "../Geometries/Cesium/CesiumNetworkLink";
import { Coordinate } from "../Geometries/Coordinate";
import { CesiumGeometryDrawing } from "../Geometries/Drawing/CesiumGeometryDrawing";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { NetworkLinkKMLGeometryCollection } from "../Geometries/NetworkLinkKMLGeometryCollection";
import { CesiumGraphicsUtils } from "../GraphicsUtils/CesiumGraphicsUtils";
import { CesiumUtilities } from "../MapUtils/CesiumUtilities";
import { MapUtils } from "../MapUtils/MapUtils";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import { CesiumRastersLoader } from "../OverlayLayers/RastersLoaders/CesiumRastersLoader";
import { CesiumVectorsLoader } from "../OverlayLayers/VectorsLoaders/CesiumVectorsLoader";
import { RasterInfo } from "../Utilities/RasterInfo";
import { CesiumControlBuilder } from "./Controls/Builder/CesiumControlBuilder";
import { MapComponent } from "./MapComponent";
import { IViewBounds } from "./View/IViewBounds";
import { ViewBounds } from "./View/ViewBounds";
import { MapType } from "@dora/map-types";

const Cesium = require("cesium/Source/Cesium");

export class CesiumMapComponent extends MapComponent {
	/**
	 * Class internal property for cesium map instance.
	 */
	protected map: any;

	/**
	 * **The cesium native map type** used on background.
	 * @throws Whether can not load map library object from dependencies.
	 */
	public get mapLibraryObject() {
		return Cesium;
	}

	/**
	 * Initialize cesium map instance.
	 * **Used by guest systems. Host systems will use the .load function**
	 * @param {Cesium.Viewer} mapInstance - An actual cesium map instance [any due to abstraction design]. Cannot set as undefined/null.
	 * @throws Whether:
	 * 1. Invalid map-instance object.
	 * 2. When map-instance already exist.
	 */
	public initNativeMapInstance(mapInstance: Cesium.Viewer): void {

		// Check if given 'mapInstance' is undefined/null or not instance of map-instance
		if (!mapInstance) {
			throw new TypeError("Invalid type for cesium's map-instance.");
		}

		// Check whether map already initialized
		if (this.map && this.map.isDestroyed && !this.map.isDestroyed()) {
			throw new Error("Cesium map-instance already initialized");
		}

		this.map = mapInstance;

		this.equalGivenMapInstanceState(mapInstance);
	}

	/**
	 * Equals the state of the given map-instance to dora abstraction map state.
	 * @param mapInstance - the given map-instance at `initNativeMapInstance(...)`
	 */
	private equalGivenMapInstanceState(mapInstance: Cesium.Viewer) {
		// Check actual given cesium map-instance dimension state
		this._is2D = !mapInstance.terrainProvider;
	}

	/**
	 * **The cesium** actual map's instance.
	 * @returns {Cesium.Viewer} cesium map instance
	 * @throws When native map instance has not initialized.
	 */
	public get nativeMapInstance(): Cesium.Viewer {
		// Check whether map-instance initialize
		if (this.map) {
			return this.map;
		}

		throw new Error("Cesium map-instance did not initialize");
	}

	/**
	 * Cesium type
	 * @returns {MapType} Cesium map type
	 */
	public get nativeMapType(): MapType {
		return MapType.CESIUM;
	}

	public utils: CesiumUtilities;

	protected config: CesiumConfig = new CesiumConfig();
	private isLoaded: boolean = false;
	private graphicsUtils: CesiumGraphicsUtils;
	private _is2D: boolean = true;
	private timelineToggleCounter: number = 0;

	private readonly SKY_COLOR = "rgb(81,202,232)";
	private readonly FLY_DURATION = 1.5;

	constructor(config?: ICesiumConfig) {
		super();

		this.utils = new CesiumUtilities(this);
		this.graphicsUtils = new CesiumGraphicsUtils(this);
		this.geometryBuilder = new CesiumGeometryBuilder(this);
		this.geometryDrawing = new CesiumGeometryDrawing(this);
		this.controlBuilder = new CesiumControlBuilder(this);
		this.rastersLoader = new CesiumRastersLoader(this);
		this.vectorsLoader = new CesiumVectorsLoader(this);

		if (typeof config !== "undefined") {
			this.config.update(config);
			this._is2D = this.config.is2D;
		}
	}

	public createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer {
		const layers = this.map.scene.imageryLayers;
		const cesiumProvider = new Cesium.SingleTileImageryProvider({
			url: imageUrl,
			rectangle: Cesium.Rectangle.fromDegrees(bbox.west, bbox.south, bbox.east, bbox.north)
		});
		const imageryLayer = new Cesium.ImageryLayer(cesiumProvider, {});

		const raster: IBaseLayer = {
			name: "image",
			isSelected: false,
			addToMap: async () => {
				layers.add(imageryLayer);
			},
			remove: async () => {
				layers.remove(imageryLayer, true);
			}
		};

		return raster;
	}

	public async load(): Promise<void> {
		if (!this.isLoaded) {
			try {

				this.config.baseLayers = await (new CesiumRasterImageryProvider()).initProvider();
				await this.config.baseLayers.readyPromise;
				this.registerRenderErrors(this.config.baseLayers, this.config.onRenderError);
				const globe = new Cesium.Globe();
				globe.showGroundAtmosphere = false;
				let mapOptions = {
					selectionIndicator: this.config.selectionIndicator,
					skyAtmosphere: this.config.skyAtmosphere,
					skyBox: this.config.skyBox,
					creditContainer: this.config.creditContainer,
					baseLayerPicker: this.config.baseLayerPicker,
					navigationHelpButton: this.config.navigationHelpButton,
					fullscreenButton: this.config.fullscreenButton,
					homeButton: this.config.homeButton,
					sceneModePicker: this.config.sceneModePicker,
					geocoder: this.config.geocoder,
					infoBox: this.config.infoBox,
					timeline: this.config.timeline,
					animation: this.config.animation,
					imageryProvider: this.config.baseLayers,
					terrainProvider: this._is2D ? null : new Cesium.GoogleEarthEnterpriseTerrainProvider(this.config.terrainProvider),
					terrainShadows: Cesium.ShadowMode.DISABLED,
					globe
				};

				this.map = new Cesium.Viewer(this.config.mapDivId, mapOptions);

				this.addNavigationScaleCtrl();
				this.setDefaultCameraView();
				this.setCesiumImprovements();

				let isTileRender = async (): Promise<void> => {

					if (this.map && this.map.cesiumWidget && this.map.terrainProvider.ready &&
						this.map.scene.globe._surface._tilesToRender.length > 0) {
						return;
					}
					else {
						await MapUtils.timeout(100);

						try {
							await isTileRender();
						} catch (e) {
							throw e;
						}
					}
				};
				await isTileRender();
				this.isLoaded = true;
			} catch (e) {
				this.isLoaded = false;
				throw e;
			}
		}
	}

	public getViewBounds(): IViewBounds {
		let rec = this.map.camera.computeViewRectangle();
		let north = Cesium.Math.toDegrees(rec.north);
		let south = Cesium.Math.toDegrees(rec.south);
		let west = Cesium.Math.toDegrees(rec.west);
		let east = Cesium.Math.toDegrees(rec.east);
		return new ViewBounds(north, south, west, east);
	}

	public getViewCenter(): Coordinate {
		return CesiumUtilities.toCoordinateFromCartographic(this.map.camera.positionCartographic);
	}

	public async flyTo(coordinate: Coordinate, flyDuration: number = this.FLY_DURATION): Promise<void> {
		this.map.camera.flyTo({
			destination: CesiumUtilities.toCartesianFromCoordinate(coordinate),
			duration: flyDuration,
		});

		return new Promise<void>(resolve => setTimeout(() => {
			resolve();
		}, flyDuration * 1000));
	}

	public async flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration: number = this.FLY_DURATION, beautify: boolean = true): Promise<void> {

		let rec;
		if (beautify) {

			const lngDiff: number = northEast.longitude - southWest.longitude;
			const latDiff: number = northEast.latitude - southWest.latitude;
			const centerLng: number = southWest.longitude + (lngDiff / 2);
			const centerLat: number = southWest.latitude + (latDiff / 2);
			const centerCoord: Coordinate = new Coordinate(centerLat, centerLng);
			const centerAlt: number = await MapUtils.getAltitude(centerCoord);
			const diffInMeters: number = MapUtils.getLineLength([northEast, southWest], "meters");

			let lngDiffAbs: number = Math.abs(lngDiff);
			let latDiffAbs: number = Math.abs(latDiff);

			if (!this.getIs2D() &&
				((!lngDiffAbs && !lngDiffAbs) || (diffInMeters < centerCoord.altitude))) {

				const minAlt: number = 100;
				centerCoord.altitude = diffInMeters < minAlt ? centerAlt + minAlt : centerAlt + diffInMeters;

				rec = CesiumUtilities.toCartesianFromCoordinate(centerCoord);
			}
			else {
				const minDiff: number = 0.001;

				lngDiffAbs = lngDiffAbs < minDiff ? minDiff : lngDiffAbs;
				latDiffAbs = latDiffAbs < minDiff ? minDiff : latDiffAbs;

				rec = Cesium.Rectangle.fromDegrees(southWest.longitude - (lngDiffAbs / 2), southWest.latitude + (latDiffAbs / 2),
					northEast.longitude + (lngDiffAbs / 2), northEast.latitude - (latDiffAbs / 2));
			}
		}
		else {
			rec = Cesium.Rectangle.fromDegrees(southWest.longitude, southWest.latitude,
				northEast.longitude, northEast.latitude);
		}


		this.map.camera.flyTo({
			destination: rec,
			duration: flyDuration
		});

		return new Promise<void>(resolve => setTimeout(() => {
			this.map.scene.requestRender();
			resolve();
		}, flyDuration * 1000));
	}

	public async setZoom(zoom: number): Promise<void> {
		let currentLocation: Coordinate = this.getViewCenter();
		currentLocation.altitude = zoom;
		await this.flyTo(currentLocation, 0);
	}

	public getHeading(): number {
		return Cesium.Math.toDegrees(this.map.camera.heading);
	}

	public setHeading(azimuth: number): void {
		let radian = Cesium.Math.toRadians(azimuth);
		this.map.camera.setView({
			destination: CesiumUtilities.toCartesianFromCoordinate(this.getViewCenter()),
			orientation: {
				heading: radian
			}
		});
	}

	// TODO: purpose of this method when there is RastersLoader
	public getRasters(): RasterInfo[] {
		// Todo
		return [];
	}

	private async loadNetworklink(kmlDocument: Document, changePolyToLine?: boolean
		, timelineOn?: boolean, url?: string, hover?: boolean): Promise<IKMLGeometryCollection> {

		if (url &&
			url.lastIndexOf("LINK") === 0) {
			hover = false;
		}

		let root: CesiumNetworkLink =
			new CesiumNetworkLink(this, kmlDocument, changePolyToLine, timelineOn, url, hover);
		await root.startListen();
		return new NetworkLinkKMLGeometryCollection(this, root);
	}

	public async loadKML(kml: Document | string, changePolyToLine?: boolean, hover: boolean = true): Promise<IKMLGeometryCollection> {

		let kmlDocument: Document;
		let url: string;

		if (typeof kml === "string") {
			let res: Response = await fetch(kml);
			if (!res.ok) {
				throw new Error(res.statusText);
			}
			let data: string = await res.text();

			let parser: DOMParser = new DOMParser();
			kmlDocument = parser.parseFromString(data, <SupportedType>"text/xml");
			url = kml.substr(0, kml.lastIndexOf("/") + 1);
		}
		else {
			kmlDocument = kml;
		}

		let timelineOn: boolean = false;
		if (kmlDocument.getElementsByTagName("TimeStamp").length ||
			kmlDocument.getElementsByTagName("TimeSpan").length) {
			timelineOn = true;
			this.toggleTimeline(true);
		}

		let networklinkElmList: HTMLCollectionOf<Element> = kmlDocument.getElementsByTagName("NetworkLink");
		if (networklinkElmList.length) {
			return this.loadNetworklink(kmlDocument, changePolyToLine, timelineOn, url, hover);
		}

		const KmlDataSource = new Cesium.KmlDataSource({
			camera: this.map.camera,
			canvas: this.map.canvas
		});

		let dataSource = await KmlDataSource.load(kmlDocument, { clampToGround: !this._is2D });

		if (changePolyToLine) {
			dataSource = this.replacePolyWithLine(dataSource);
		}

		this.utils.makeEntitiesFromDataSourceDoraCompatible(dataSource);

		await this.map.dataSources.add(dataSource);

		this.map.scene.requestRender();

		return new CesiumKMLGeometryCollection([dataSource], this, timelineOn, hover);
	}

	public changeDimension() {
		this._is2D = !this._is2D;

		this.map.terrainProvider = !this._is2D ? new Cesium.GoogleEarthEnterpriseTerrainProvider(
			this.config.terrainProvider) : new Cesium.EllipsoidTerrainProvider();

		this.map.scene.globe.depthTestAgainstTerrain = !this._is2D;

		for (let dataSource of this.map.dataSources._dataSources) {
			this.toggleDatasourceDimension(dataSource, this._is2D);
		}

		this.map.scene.requestRender();
	}

	public getIs2D(): boolean {
		return this._is2D;
	}

	/**
	 * get the map configuration object
	 * @returns {ICesiumConfig} the map configuration object
	 */
	public getConfig(): ICesiumConfig {
		return <ICesiumConfig>super.getConfig();
	}

	public toggleTimeline(toggle: boolean) {
		if (toggle) {
			this.timelineToggleCounter++;
		} else {
			this.timelineToggleCounter = --this.timelineToggleCounter < 0 ? 0 : this.timelineToggleCounter;
		}

		let shouldToggleTimline = !!this.timelineToggleCounter;

		this.map._automaticallyTrackDataSourceClocks = shouldToggleTimline;
		this.map.scene.requestRenderMode = !shouldToggleTimline;
		this.map.scene.maximumRenderTimeChange = shouldToggleTimline ? 0 : Infinity;
		this.map.animation.container.style.visibility = shouldToggleTimline ? "visible" : "hidden";
		this.map.timeline.container.style.visibility = shouldToggleTimline ? "visible" : "hidden";
		this.map.forceResize();
	}

	public orientMapNorth(tilt?: boolean): void {
		this.map.camera.setView({
			orientation: {
				heading: 0.0,
				pitch: tilt ? -Cesium.Math.PI_OVER_TWO : this.map.camera.pitch,
				roll: tilt ? 0.0 : this.map.camera.roll
			}
		});
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent(Cesium.ScreenSpaceEventType.LEFT_CLICK, listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, listener);
	}

	protected addRightClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent(Cesium.ScreenSpaceEventType.RIGHT_CLICK, listener);
	}

	protected addMouseMoveListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent(Cesium.ScreenSpaceEventType.MOUSE_MOVE, listener);
	}

	protected addMouseDownListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent(Cesium.ScreenSpaceEventType.LEFT_DOWN, listener);
	}

	protected addMouseUpListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent(Cesium.ScreenSpaceEventType.LEFT_UP, listener);
	}

	protected addZoomChangedListener(listener: (currentZoom: number) => void): () => void {
		let lastZoom: number = this.getViewCenter().altitude;

		let onZoomChanged = () => {
			let currentAlt: number = this.getViewCenter().altitude;
			if (lastZoom !== currentAlt) {
				lastZoom = currentAlt;
				listener(lastZoom);
			}
		};

		this.map.camera.moveEnd.addEventListener(onZoomChanged);

		return () => {
			this.map.camera.moveEnd.removeEventListener(onZoomChanged);
		};
	}

	protected addViewChangedListener(listener: (bounds: ViewBounds) => void): () => void {

		let onViewChanged = () => {
			// let currentViewBound: ViewBounds = this.getViewBounds();
			// if (!this.lastViewBounds.isEqual(currentViewBound)) {
			// 	this.lastViewBounds = currentViewBound;
			listener(this.getViewBounds());
			// }
		};

		this.map.camera.moveEnd.addEventListener(onViewChanged);

		return () => {
			this.map.camera.moveEnd.removeEventListener(onViewChanged);
		};
	}

	private registerRenderErrors(imageryProvider: any, onRenderError: () => void): void {
		imageryProvider.errorEvent.addEventListener(() => {
			onRenderError();
		});
	}

	private setDefaultCameraView(): void {
		this.flyTo(this.config.center, 0).then(() => {
			Cesium.Camera.DEFAULT_VIEW_RECTANGLE = this.map.camera.computeViewRectangle();
			Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
		});
	}

	public replacePolyWithLine(dataSource): any {
		return this.replaceEntitiesInDataSource(dataSource, (entity) => {
			let returnEntity;
			if (entity.polygon) {
				if (!entity.polygon.material) {
					return;
				}
				let color = entity.polygon.material.color.getValue().clone();
				color.alpha = 1;

				returnEntity = {
					id: entity.id,
					parent: entity.parent,
					polyline: {
						width: 2,
						positions: entity.polygon.hierarchy.getValue().positions,
						material: new Cesium.ColorMaterialProperty(color),
						clampToGround: !this.getIs2D()
					}
				};
				if (entity.parent) {
					let index = entity.parent._children.indexOf(entity);
					entity.parent._children.splice(index, 1);
				}
			}
			else if (entity.billboard) {
				entity.billboard.heightReference =
					this._is2D ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND;
				const position: Cesium.Cartesian3 = entity.position.getValue(Cesium.JulianDate.now());
				position.y += 0.01;
				entity.position.setValue(position);
			}
			if (returnEntity && entity.availability) {
				returnEntity.availability = entity.availability;
			}
			return returnEntity;
		});
	}

	private toggleDatasourceDimension(dataSource: any, toggle2D: boolean): any {
		dataSource._clampToGround = !toggle2D;
		for (let entity of dataSource.entities.values) {
			if (entity.polyline) {
				entity.polyline.clampToGround = new Cesium.ConstantProperty(!toggle2D);
			}
			else if (entity.billboard) {
				entity.billboard.heightReference = new Cesium.ConstantProperty(
					toggle2D ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND);
			}
		}
		return dataSource;
	}

	private replaceEntitiesInDataSource(dataSource: any, compareFunc: (entity: any) => any): any {
		let newEntities = [];
		for (let entity of dataSource._entityCollection.values) {
			let newEntity = compareFunc(entity);
			newEntity && newEntities.push(newEntity);
		}

		//adding the new entities instead of the old once
		for (let newEntity of newEntities) {
			dataSource.entities.removeById(newEntity.id);
			dataSource.entities.add(newEntity);
		}

		return dataSource;
	}

	private addNavigationScaleCtrl() {
		this.map.extend(viewerCesiumNavigationMixin, {});
		$(".compass").css({
			"top": "10px",
			"left": "0"
		});
		$(".navigation-controls").css({
			"top": "115px",
			"left": "30px",
			"background": "rgba(47,53,60,.8)"
		});
		$(".distance-legend").css({
			"right": "0",
			"bottom": "10px",
			"margin": "0 auto",
			"border": "0",
			"background-color": "transparent",
		});
		$(".distance-legend-label").css({
			"font-size": "12px"
		});
	}

	private setCesiumImprovements(): void {

		this.toggleTimeline(false);

		Cesium.Label.enableRightToLeftDetection = true;

		this.map.scene.logarithmicDepthBuffer = true;
		this.map.scene.globe.depthTestAgainstTerrain = false;
		this.map.resolutionScale = this.config.resolution;
		this.map.scene.useDepthPicking = false;
		this.map.scene._oit = undefined;
		this.map.scene.postProcessStages.fxaa.enabled = false;
		this.map.backgroundColor = Cesium.Color.fromCssColorString(this.SKY_COLOR);

		this.map.cesiumWidget.screenSpaceEventHandler
			.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
		this.map.trackedEntityChanged.addEventListener(() => {
			this.map.trackedEntity = undefined;
		});

		let originalRotateUp = Cesium.Camera.prototype.rotateUp;
		Cesium.Camera.prototype.rotateUp = function (angle) {
			let maxAngle = -0.1;
			if (angle > 0 && this.pitch + angle > maxAngle) {
				angle = maxAngle - this.pitch;
			}
			originalRotateUp.call(this, angle);
		};
	}
}