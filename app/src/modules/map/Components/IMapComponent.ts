import { IGeometryBuilder } from "../Geometries/Builder/IGeometryBuilder";
import { Coordinate } from "../Geometries/Coordinate";
import { IGeometryDrawing } from "../Geometries/Drawing/IGeometryDrawing";
import { RasterInfo } from "../Utilities/RasterInfo";
import { IViewBounds } from "./View/IViewBounds";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { IMapConfig } from "../Config/IMapConfig";
import { IControlBuilder } from "./Controls/Builder/IControlBuilder";
import { IBaseLayersLoader } from "../OverlayLayers/IBaseLayersLoader";
import { RasterLayer } from "../OverlayLayers/RasterLayer";
import { VectorLayer } from "../OverlayLayers/VectorLayer";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import { IUtilities } from "../MapUtils/IUtilities";
import { MapType } from "@dora/map-types";

export interface IMapComponent {
	geometryBuilder: IGeometryBuilder;
	geometryDrawing: IGeometryDrawing;
	controlBuilder: IControlBuilder;
	rastersLoader: IBaseLayersLoader<RasterLayer>;
	vectorsLoader: IBaseLayersLoader<VectorLayer>;
	utils: IUtilities;

	/**
	 * Initialize the native map instance.
	 * **Used by guest systems. Host systems will use the .load function**
	 * @param {any} mapInstance - An actual map instance [any due to abstraction design]. Cannot set as undefined/null.
	 * @throws Whether:
	 * 1. Invalid map-instance object.
	 * 2. When map-instance already exist.
	 */
	initNativeMapInstance(mapInstance: any): void;

	/**
	 * **The native map** actual map's instance.
	 * @returns The native map instance
	 * @throws When native map instance has not initialized.
	 */
	readonly nativeMapInstance: any;

	/**
	 * **The map library object** [Returned value from require.].
   	 * @returns Library's object
	 */
	readonly nativeMapType: MapType;

	/**
	 * **The native map type** used on background.
	 * @throws Whether can not load map library object from dependencies.
	 */
	readonly mapLibraryObject: any;

	/**
	 * Loads dora's map-component by initialize map-object
	 * **Used by host system.**
	 */
	load(): Promise<void>;

	createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer;

	/**
	 * Attach map event
	 * @param event event type
	 * @param listener function to be executed
	 */
	on(event: string, listener: (eventArgs: any) => void): void;

	/**
	 * Detach map event
	 * @param event event type
	 * @param listener the function to detach
	 */
	off(event: string, listener?: (eventArgs: any) => void): void;

	getViewBounds(): IViewBounds;

	flyTo(coordinate: Coordinate, flyDuration?: number): Promise<void>;

	flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration?: number, beautify?: boolean): Promise<void>;

	setZoom(zoom: number): Promise<void>;

	getViewCenter(): Coordinate;

	getHeading(): number;

	setHeading(azimuth: number): void;

	getRasters(): RasterInfo[];

	loadKML(kmlDocument: Document | string, changePolyToLine?: boolean, hover?: boolean): Promise<IKMLGeometryCollection>;

	/**
	 * get the map mode
	 * @returns {boolean} true if the map isn't on terrain mode, false otherwise
	 */
	getIs2D(): boolean;

	orientMapNorth(tilt?: boolean): void;

	changeDimension();

	/**
	 * get the map configuration object
	 * @returns {IMapConfig} the map configuration object
	 */
	getConfig(): IMapConfig;
}