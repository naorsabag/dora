import { IActionToken } from "../../Common/IActionToken";
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { IImageDesign } from "../../GeometryDesign/Interfaces/IImageDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { LLGraphicsUtils } from "../../GraphicsUtils/LLGraphicsUtils";
import { LLLayer } from "../../Layers/LLLayer";
import { LLUtilties } from "../../MapUtils/LLUtilities";
import { Coordinate } from "../Coordinate";
import { Point } from "../Point";
import { LLVisibilityUpdater } from "../VisibilityUpdater/LLVisibilityUpdater";
import * as L from "leaflet";

export class LLPoint extends Point {
	private leafletMapComponent: LeafletMapComponent;
	protected geometryOnMap: L.Marker;

	constructor(
		mapComponent: LeafletMapComponent,
		coordinate: Coordinate,
		design?: IGeometryDesign,
		id?: string
	) {
		super(mapComponent, coordinate, design, id);

		this.leafletMapComponent = mapComponent;
		this.graphicsUtils = new LLGraphicsUtils(mapComponent);
	}

	public getId(): string {
		throw Error("Method not implemented.");
	}

	public setId(value: string): void {
		throw Error("Method not implemented.");
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
		let latLng: L.LatLngTuple = LLUtilties.coordinateToLatLng(
			this.coordinate
		);
		if (this.geometryOnMap === null) {
			this.geometryOnMap = new L.Marker(latLng);
		} else {
			this.geometryOnMap.setLatLng(latLng);
		}
		this.applyDesign(this.design);
	}

	public edit(token: IActionToken): void {
		// enter edit mode
		(<any>this.geometryOnMap).editing.enable();

		token.finish = () => {
			this.exitEditMode();
			// Gets point's new coords after edit.
			this.coordinate = LLUtilties.latLngToCoordinate(
				this.geometryOnMap.getLatLng()
			);
		};

		token.cancel = () => {
			this.exitEditMode();
			// Generate back the original coords. [Cuz drag has failed]
			this.generateGeometryOnMap();
		};
	}

	public drag(token: IActionToken): void {
		(<any>this.geometryOnMap).dragging.enable();

		token.finish = () => {
			this.exitEditMode();
			// Gets point's new coords after edit.
			this.coordinate = LLUtilties.latLngToCoordinate(
				this.geometryOnMap.getLatLng()
			);
		};

		token.cancel = () => {
			this.exitEditMode();
			// Generate back the original coords. [Cuz drag has failed]
			this.generateGeometryOnMap();
		};
	}

	/**
	 * Exit edit-mode
	 * @description disable drag & edit abilities.
	 */
	private exitEditMode() {
		(<any>this.geometryOnMap).editing.disable();
		(<any>this.geometryOnMap).dragging.disable();
	}

	protected async renderIcon(): Promise<void> {
		if (!this.design.icons || this.design.icons.length === 0) {
			this.createDefaultIcon();
		} else {
			const promises = this.design.icons.map(async iconDesign => {
				iconDesign.image = iconDesign.image || {};
				await this.createImage(iconDesign.image);

				iconDesign.label = iconDesign.label || {};
				if (iconDesign.label.text && iconDesign.label.visibility) {
					this.setLabel(iconDesign.label.text);
				} else {
					this.geometryOnMap.unbindTooltip();
				}
			});
			await Promise.all(promises);
		}
	}

	private async createImage(imageDesign: IImageDesign): Promise<void> {
		if (imageDesign.visibility) {
			if (!imageDesign.url) {
				imageDesign.url = require("../../../../../assets/placemark.png");
			}
			let iconOptions: L.IconOptions = {
				iconUrl: imageDesign.url
			};

			iconOptions.iconSize = await this.getIconSize(imageDesign);
			iconOptions.iconAnchor = this.getIconAnchor(imageDesign.anchor, iconOptions.iconSize);
			this.createIcon(iconOptions);
		} else {
			this.geometryOnMap.setIcon(new L.DivIcon({ className: "" }));
		}
	}

	private createDefaultIcon(): void {
		const iconUrl: string = require("../../../../../assets/placemark.png");
		const defaultIconSize = { width: 32, height: 32 };
		const iconOptions: L.IconOptions = {
			iconUrl: iconUrl,
			iconSize: new L.Point(
				defaultIconSize.width,
				defaultIconSize.height
			),
			iconAnchor: new L.Point(
				defaultIconSize.width / 2,
				defaultIconSize.height
			)
		};
		this.createIcon(iconOptions);
		this.geometryOnMap.unbindTooltip();
	}

	private async getIconSize(
		imageDesign: IImageDesign
	): Promise<L.Point> {
		if (imageDesign.size !== null) {
			return new L.Point(imageDesign.size.width, imageDesign.size.height);
		} else {
			//if the design doesn't contain an iconSize, we must preload the image to define a correct size and a correct anchor based on its natural size
			//(otherwise it will be distorted and the anchor will be incorrect)
			const img: HTMLImageElement = await this.preloadImage(
				imageDesign.url
			);
			return new L.Point(img.naturalWidth, img.naturalHeight);
		}
	}

	private getIconAnchor(anchor: { x: number; y: number }, size: L.Point): L.Point {
		if (anchor !== null) {
			return new L.Point(anchor.x, anchor.y);
		} else {
			return new L.Point(size.x / 2, size.y);
		}
	}

	protected createIcon(iconOptions: L.IconOptions): void {
		let icon = new L.Icon(iconOptions);
		this.geometryOnMap.setIcon(icon);
	}

	public setVisibility(state: boolean): void {
		let visibilityUpdater = new LLVisibilityUpdater(
			this.leafletMapComponent
		);
		visibilityUpdater.updateVisibility(
			state,
			this.geometryOnMap,
			this.addedToMap,
			<LLLayer[]>this.addedToLayers
		);
		this.visible = state;
	}

	public setLabel(text: string): void {
		if (this.isOnMap) {
			if (!this.geometryOnMap.getTooltip()) {
				const label = new L.Tooltip({
					direction: "left",
					permanent: true,
					className: "map-manger-leaflet-label"
				});
				this.geometryOnMap.bindTooltip(label);
			}
			this.geometryOnMap.setTooltipContent(text);
		}
	}

	public openBalloonHtml(html: string): void {
		L.popup()
			.setLatLng(this.geometryOnMap.getLatLng())
			.setContent(html)
			.openOn(this.leafletMapComponent.nativeMapInstance);
	}

	protected addClickListener(
		listener: (eventArgs?: MapEventArgs) => void
	): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "click", listener);
	}

	protected addDblClickListener(
		listener: (eventArgs?: MapEventArgs) => void
	): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "dblclick", listener);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "mouseover", listener);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return LLUtilties.attachEvent(this.geometryOnMap, "mouseout", listener);
	}

	protected addContextMenuListener(
		listener: (eventArgs?: MapEventArgs) => void
	): () => void {
		return LLUtilties.attachEvent(
			this.geometryOnMap,
			"contextmenu",
			listener
		);
	}
}
