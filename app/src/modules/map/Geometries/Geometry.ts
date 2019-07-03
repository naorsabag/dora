import { IActionToken } from "../Common/IActionToken";
import { IMapComponent } from "../Components/IMapComponent";
import { GeometryDesign } from "../GeometryDesign/GeometryDesign";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../Events/MapEventArgs";
import { IGraphicsUtils } from "../GraphicsUtils/IGraphicsUtils";
import { ILayer } from "../Layers/ILayer";
import { ILayerChild } from "../Layers/ILayerChild";
import { Coordinate } from "./Coordinate";
import { IGeometry } from "./IGeometry";
import bBox from "@turf/bbox";
import { GEOMETRY_TYPES } from "./GeometryTypes";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import { MapError } from "../Common/MapError";
import * as wellknown from "wellknown";

export abstract class Geometry implements IGeometry, ILayerChild {
	protected mapComponent: IMapComponent;

	/**
	 * Was the geometry added to the map or to a layer
	 */
	public get isOnMap(): boolean {
		return this.addedToMap || this.addedToLayers.length > 0;
	}

	/**
	 * Was the geometry added to the map (doesn't indicate whether or not it was added to layers)
	 */
	protected addedToMap: boolean = false;

	protected geometryOnMap: any = null;

	public setGeometryOnMap(nativeEntity: any) {
		this.geometryOnMap = nativeEntity;
		this.addedToMap = true;
	}

	public getGeometryOnMap(): any {
		return this.geometryOnMap;
	}

	protected id: string;

	public abstract setId(value: string): void;

	public abstract getId(): string;

	/**
	 * Array of layers the geometry was added to
	 */
	protected addedToLayers: ILayer[] = [];
	protected visible: boolean = true;
	protected graphicsUtils: IGraphicsUtils;
	protected _design: GeometryDesign = null;
	protected get design(): GeometryDesign {
		if (this._design === null) {
			this._design = new GeometryDesign({});
		}
		return this._design;
	}

	protected set design(value: GeometryDesign) {
		this._design = value;
	}

	/**
	 * Used for restoring the design after a geometry was marked and un-marked
	 */
	protected originalDesign: GeometryDesign;
	protected markFlag: boolean = false;
	protected markerGeom: any = null;
	/**
	 * Dictionary of event name=>array of listeners that need to be set when the geometry is added to the map
	 * (for when the "on" method is called before the geometry was added)
	 */
	protected eventsToSetDic: any = {};
	/**
	 * Dictionary of event name=>array of objects:
	 *    listener: a listener function for the event
	 *    remover: a removal function for the listener
	 */
	protected removeEventsDic: any = {};

	protected constructor(mapComponent: IMapComponent, design?: IGeometryDesign, id?: string) {
		this.mapComponent = mapComponent;

		if (typeof design !== "undefined") {
			this.design.update(design);
		}

		this.id = id;
	}

	protected _geometryType: GEOMETRY_TYPES;
	public get geometryType(): GEOMETRY_TYPES {
		return this._geometryType;
	}

	public set geometryType(type: GEOMETRY_TYPES) {
		this._geometryType = type;
	}

	/**
	 * Adds the geometry object to the map
	 */
	protected abstract addNativeGeometryToMap(): void;

	/**
	 * Removes the geometry object from the map
	 */
	protected abstract removeNativeGeometryFromMap(): void;

	protected abstract dispose(): void;

	/**
	 * Adds the geometry object to a layer
	 */
	protected abstract addNativeGeometryToLayer(layer: ILayer): void;

	/**
	 * Removes the geometry object from a layer
	 */
	protected abstract removeNativeGeometryFromLayer(layer: ILayer): void;

	public abstract getGeoJSON(): GeoJSON.Geometry;

	public abstract getWKT(): string;

	public abstract setGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): void;

	public setWKT(wkt: string): void {
		const geoJson: GeoJSON.Geometry = wellknown.parse(wkt);
		if (geoJson === null) {
			throw new MapError("Invalid wkt", "!!!!!!!!! !! !!!!!");
		}
		this.setGeoJSON({ type: "Feature", geometry: geoJson, properties: {} });
	}

	/**
	 * Creates a geometry object that is ready to be added to the map
	 */
	protected abstract generateGeometryOnMap(): void;

	public abstract edit(token: IActionToken): void;

	public abstract drag(token: IActionToken): void;

	public abstract setDesign(design: IGeometryDesign): void;

	/**
	 * Sets the geometry's line color
	 * @param color css color
	 */
	protected abstract setLineColor(color: string): void;

	/**
	 * Sets the geometry's line opacity
	 * @param opacity opacity between 0-1
	 */
	protected abstract setLineOpacity(opacity: number): void;

	/**
	 * Sets the geometry's line width
	 */
	protected abstract setLineWidth(width: number): void;

	/**
	 * Sets the geometry's fill color
	 * @param color css color
	 */
	protected abstract setFillColor(color: string): void;

	/**
	 * Sets the geometry's fill opacity
	 * @param opacity opacity between 0-1
	 */
	protected abstract setFillOpacity(opacity: number): void;

	public abstract setVisibility(state: boolean): void;

	public abstract setLabel(text: string): void;

	public abstract openBalloonHtml(html: string): void;

	protected abstract addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void;

	protected abstract getIconsCoordinates(): Coordinate[];

	public addToMap(): void {
		if (!this.addedToMap) {
			this.addedToMap = true;
			this.prepareGeometry();
			this.addNativeGeometryToMap();
			if (!this.visible) {
				//if the geometry was set to initially be invisible - hide it
				this.setVisibility(this.visible);
			}
		}
	}

	public addToLayer(layer: ILayer): void {
		if (this.addedToLayers.indexOf(layer) < 0) {
			this.addedToLayers.push(layer);
			this.prepareGeometry();
			this.addNativeGeometryToLayer(layer);
			if (!this.visible) {
				//if the geometry was set to initially be invisible - hide it
				this.setVisibility(this.visible);
			}
		}
	}

	private prepareGeometry(): void {
		this.generateGeometryOnMap();
		for (let i in this.eventsToSetDic) {
			if (this.eventsToSetDic.hasOwnProperty(i)) {
				this.eventsToSetDic[i].forEach(listener => {
					this.on(i, listener);
				});
			}
		}
		this.eventsToSetDic = {};
	}

	public remove(): void {
		if (this.addedToMap) {
			this.removeNativeGeometryFromMap();
			this.addedToMap = false;
		}
		while (this.addedToLayers.length > 0) {
			this.addedToLayers[0].removeGeometry(this);
		}
		this.dispose();
	}

	public removeFromLayer(layer: ILayer): void {
		let index = this.addedToLayers.indexOf(layer);
		if (index >= 0) {
			this.removeNativeGeometryFromLayer(layer);
			this.addedToLayers.splice(index, 1);
			if (!this.addedToMap && this.addedToLayers.length === 0) {
				//if it was removed from the only layer it was added to, dispose of the geometry object
				this.dispose();
			}
		}
	}

	public getDesign(): GeometryDesign {
		return this.design;
	}

	public on(event: string, listener: (eventArgs: MapEventArgs) => void): void {
		if (this.isOnMap) {
			let alreadyExists = false;
			if (this.removeEventsDic.hasOwnProperty(event)) {
				alreadyExists =
					this.removeEventsDic[event].filter(
						e => e.listener === listener
					).length > 0;
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
					case "contextmenu":
						removeFunc = this.addContextMenuListener(listener);
						break;
					case "mouseover":
						removeFunc = this.addMouseOverListener(listener);
						break;
					case "mouseout":
						removeFunc = this.addMouseOutListener(listener);
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
		} else {
			//if the geometry wasn't added yet, save the listener to be created later - when the geometry is added
			if (!this.eventsToSetDic.hasOwnProperty(event)) {
				this.eventsToSetDic[event] = [];
			}
			if (this.eventsToSetDic[event].indexOf(listener) < 0) {
				this.eventsToSetDic[event].push(listener);
			}
		}
	}

	public off(event: string, listener?: (eventArgs: MapEventArgs) => void): void {
		if (this.removeEventsDic.hasOwnProperty(event)) {
			if (typeof listener === "undefined") {
				this.removeEventsDic[event].forEach(e => {
					e.remover();
				});
				delete this.removeEventsDic[event];
			} else {
				for (let i = 0; i < this.removeEventsDic[event].length; i++) {
					if (this.removeEventsDic[event][i].listener === listener) {
						this.removeEventsDic[event][i].remover();
						this.removeEventsDic[event].splice(i, 1);
						break;
					}
				}
			}
		}
		if (this.eventsToSetDic.hasOwnProperty(event)) {
			if (typeof listener === "undefined") {
				delete this.eventsToSetDic[event];
			} else {
				for (let i = 0; i < this.eventsToSetDic[event].length; i++) {
					if (this.eventsToSetDic[event][i] === listener) {
						this.eventsToSetDic[event].splice(i, 1);
						break;
					}
				}
			}
		}
	}

	protected applyDesign(design: IGeometryDesign): void {
		if (this.isOnMap) {
			if (typeof design.line !== "undefined") {
				if (typeof design.line.color !== "undefined") {
					this.setLineColor(design.line.color);
				}
				if (typeof design.line.opacity !== "undefined") {
					this.setLineOpacity(design.line.opacity);
				}
				if (typeof design.line.width !== "undefined") {
					this.setLineWidth(design.line.width);
				}
			}
			if (typeof design.fill !== "undefined") {
				if (typeof design.fill.color !== "undefined") {
					this.setFillColor(design.fill.color);
				}
				if (typeof design.fill.opacity !== "undefined") {
					this.setFillOpacity(design.fill.opacity);
				}
			}
		}
	}

	public getVisibility(): boolean {
		return this.visible;
	}

	public async focusView(): Promise<void> {
		let bbox: number[] = bBox(<any>this.getGeoJSON());
		await this.mapComponent.flyToBounds(
			Coordinate.fromGeoJSON([bbox[0], bbox[3]]),
			Coordinate.fromGeoJSON([bbox[2], bbox[1]])
		);
	}

	public mark(): void {
		if (!this.isMarked()) {
			this.markerGeom = null;
			//TODO: deep clone
			this.originalDesign = JSON.parse(JSON.stringify(this.getDesign()));
			this.setDesign({
				fill: {
					color: "#5ec4ff"
				},
				line: {
					color: "#5ec4ff"
				}
			});
			//for the marker arrow we only select one of the icons
			//TODO: what happened where there is no icon at all
			this.markFlag = true;
			const iconsCoordinates = this.getIconsCoordinates();
			if (iconsCoordinates && iconsCoordinates.length > 0) {
				this.markerGeom = this.graphicsUtils.addMarkArrow(
					iconsCoordinates[0]
				);
			}
		}
	}

	public unMark(): void {
		if (this.isMarked()) {
			this.setDesign(this.originalDesign);
			this.markFlag = false;
			if (this.markerGeom) {
				this.graphicsUtils.removeMarkArrow(this.markerGeom);
			}
		}
	}

	public isMarked(): boolean {
		return this.markFlag;
	}

	public getCollectionContainerId(): string {
		return null;
	}

	public getLabel(): string {
		return null;
	}

	/**
	 * Gets an unknown geo-json shape and return as basic geo-json.
	 * @param geometry Unknown geo-json shape
	 * @returns Basic geo-json structure
	 */
	protected extractBasicGeoJson<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): GeoJSON.Geometry {
		const GEO_JSON_SPECIAL_SHAPES_TYPE_NAME = "Feature";

		if (geometry.type === GEO_JSON_SPECIAL_SHAPES_TYPE_NAME) {
			return (geometry as GeoJSON.Feature<T>).geometry;
		} else {
			return (geometry as T);
		}
	}
}
