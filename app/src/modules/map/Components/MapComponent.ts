import { MapEventArgs } from "../Events/MapEventArgs";
import { IGeometryBuilder } from "../Geometries/Builder/IGeometryBuilder";
import { Coordinate } from "../Geometries/Coordinate";
import { IGeometryDrawing } from "../Geometries/Drawing/IGeometryDrawing";
import { RasterInfo } from "../Utilities/RasterInfo";
import { IMapComponent } from "./IMapComponent";
import { IViewBounds } from "./View/IViewBounds";
import { ViewBounds } from "./View/ViewBounds";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { IMapConfig } from "../Config/IMapConfig";
import { IControlBuilder } from "./Controls/Builder/IControlBuilder";
import "jstree/dist/themes/default/style.min.css";
import "jstree/dist/jstree.min";
import { RasterLayer } from "../OverlayLayers/RasterLayer";
import { IBaseLayersLoader } from "../OverlayLayers/IBaseLayersLoader";
import { VectorLayer } from "../OverlayLayers/VectorLayer";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import { IUtilities } from "../MapUtils/IUtilities";
import { MapType } from "@dora/map-types";

export abstract class MapComponent implements IMapComponent {

	public geometryBuilder: IGeometryBuilder;
	public geometryDrawing: IGeometryDrawing;
	public controlBuilder: IControlBuilder;

	public rastersLoader: IBaseLayersLoader<RasterLayer>;
	public vectorsLoader: IBaseLayersLoader<VectorLayer>;
	public utils: IUtilities;

	protected config: IMapConfig;

	/**
	 * Dictionary of event name=>array of objects:
	 *    listener: a listener function for the event
	 *    remover: a removal function for the listener
	 */
	protected removeEventsDic: any = {};

	/**
	 * Initialize the native map instance.
	 * **Used by guest systems.**
	 * @param {any} mapInstance - An actual map instance [any due to abstraction design].
	 * @throws Error when map-instance is already initialized
	 */
	public abstract initNativeMapInstance(mapInstance: any): void;

	public abstract get nativeMapInstance(): any;

	public abstract get nativeMapType(): MapType;

	public abstract get mapLibraryObject(): any;

	/**
	 * The native map instance for internal use only.
	 */
	protected abstract map: any;

	public abstract load(): Promise<void>;

	public abstract getViewBounds(): IViewBounds;

	public abstract getViewCenter(): Coordinate;

	public abstract flyTo(coordinate: Coordinate, flyDuration?: number): Promise<void>;

	public abstract flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration?: number, beautify?: boolean): Promise<void>;

	public abstract setZoom(zoom: number): Promise<void>;

	public abstract getHeading(): number;

	public abstract setHeading(azimuth: number): void;

	public abstract getRasters(): RasterInfo[];

	public abstract createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer;

	public abstract loadKML(kmlDocument: Document | string, changePolyToLine?: boolean, hover?: boolean): Promise<IKMLGeometryCollection>;

	public abstract changeDimension();

	/**
	 * get the map mode
	 * @returns {boolean} true if the map isn't on terrain mode, false otherwise
	 */
	public abstract getIs2D(): boolean;

	public abstract orientMapNorth(tilt?: boolean): void;

	protected abstract addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addRightClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addMouseMoveListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addMouseDownListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addMouseUpListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addZoomChangedListener(listener: (currentZoom: number) => void): () => void;

	protected abstract addViewChangedListener(listener: ((bounds: ViewBounds) => void)): () => void;

	public on(event: string, listener: (eventArgs: any) => void): void {
		let alreadyExists = false;
		if (this.removeEventsDic.hasOwnProperty(event)) {
			alreadyExists = this.removeEventsDic[event].filter(e => e.listener === listener).length > 0;
		}
		if (!alreadyExists) {
			let removeFunc: () => void;
			switch (event) {
				case "click":
					removeFunc = this.addClickListener(listener);
					break;
				case "dblclick":
					removeFunc = this.addDblClickListener(listener);
					break;
				case "rightclick":
					removeFunc = this.addRightClickListener(listener);
					break;
				case "mousemove":
					removeFunc = this.addMouseMoveListener(listener);
					break;
				case "mousedown":
					removeFunc = this.addMouseDownListener(listener);
					break;
				case "mouseup":
					removeFunc = this.addMouseUpListener(listener);
					break;
				case "zoomChanged":
					removeFunc = this.addZoomChangedListener(listener);
					break;
				case "viewChanged":
					removeFunc = this.addViewChangedListener(listener);
					break;
				default:
					throw new Error("Unsupported event type");
			}

			if (!this.removeEventsDic.hasOwnProperty(event)) {
				this.removeEventsDic[event] = [];
			}
			this.removeEventsDic[event].push({
				listener: listener,
				remover: removeFunc
			});
		}
	}

	public off(event: string, listener?: (eventArgs: any) => void): void {
		if (this.removeEventsDic.hasOwnProperty(event)) {
			if (typeof listener === "undefined") {
				this.removeEventsDic[event].forEach(e => {
					e.remover();
				});
				delete this.removeEventsDic[event];
			}
			else {
				for (let i = 0; i < this.removeEventsDic[event].length; i++) {
					if (this.removeEventsDic[event][i].listener === listener) {
						this.removeEventsDic[event][i].remover();
						this.removeEventsDic[event].splice(i, 1);
						break;
					}
				}
			}
		}
	}

	/**
	 * get the map configuration object
	 * @returns {IMapConfig} the map configuration object
	 */
	public getConfig(): IMapConfig {
		return this.config;
	}
}