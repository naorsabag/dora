import { IActionToken } from "../../Common/IActionToken";
import { GoogleMapsMapComponent } from "../../Components/GoogleMapsMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GMGraphicsUtils } from "../../GraphicsUtils/GMGraphicsUtils";
import { ILayer } from "../../Layers/ILayer";
import { IImageDesign } from "../../GeometryDesign/Interfaces/IImageDesign";
import { Coordinate } from "../Coordinate";
import { Point } from "../Point";

let MarkerWithLabel;

export class GMPoint extends Point {
	private gmMapComponent: GoogleMapsMapComponent;

	constructor(mapComponent: GoogleMapsMapComponent,
		coordinate: Coordinate,
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinate, design, id);

		this.gmMapComponent = mapComponent;
		MarkerWithLabel = require("../../../../../vendor/markerwithlabel/markerwithlabel-modified.js")(google.maps);

		this.graphicsUtils = new GMGraphicsUtils(mapComponent);
	}

	public getId(): string {
		throw Error("Method not implemented.");
	}

	public setId(value: string): void {
		throw Error("Method not implemented.");
	}

	protected addNativeGeometryToMap(): void {
		this.geometryOnMap.setMap(this.gmMapComponent.nativeMapInstance);
	}

	protected removeNativeGeometryFromMap(): void {
		this.geometryOnMap.setMap(null);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	protected addNativeGeometryToLayer(layer: ILayer): void {
		this.geometryOnMap.setMap(this.gmMapComponent.nativeMapInstance);
	}

	protected removeNativeGeometryFromLayer(layer: ILayer): void {
		this.geometryOnMap.setMap(null);
	}

	protected generateGeometryOnMap(): void {
		let latLng: google.maps.LatLng = this.gmMapComponent.utils.coordinateToLatLng(this.coordinate);
		if (this.geometryOnMap === null) {
			this.geometryOnMap = new MarkerWithLabel({
				position: latLng,
				labelClass: "google-maps-point-label-hide"
			});
		}
		else {
			this.geometryOnMap.setPosition(latLng);
		}
	}

	public edit(token: IActionToken): void {
		this.drag(token);
	}

	public drag(token: IActionToken): void {
		this.geometryOnMap.setDraggable(true);

		token.finish = () => {
			this.geometryOnMap.setDraggable(false);
			this.coordinate = this.gmMapComponent.utils.latLngToCoordinate(this.geometryOnMap.getPosition());
		};

		token.cancel = () => {
			this.geometryOnMap.setDraggable(false);
			this.generateGeometryOnMap();
		};
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
					this.geometryOnMap.set("labelVisible", false);
				}
			});
			await Promise.all(promises);
		}
	}

	private async createImage(imageDesign: IImageDesign): Promise<void> {
		let icon: google.maps.Icon;

		if (imageDesign.visibility) {
			if (!imageDesign.url) {
				imageDesign.url = require("../../../../../assets/placemark.png");
			}
			icon = { url: imageDesign.url };

			icon.scaledSize = await this.getIconSize(imageDesign);
			icon.anchor = this.getIconAnchor(imageDesign.anchor, icon.scaledSize);
		} else {
			icon = this.geometryOnMap.getIcon();
			if (icon) {
				icon.url = "";
			}
		}
		this.geometryOnMap.setIcon(icon);
	}

	private createDefaultIcon(): void {
		let iconUrl: string = require("../../../../../assets/placemark.png");
		let defaultIconSize = { width: 32, height: 32 };
		let iconSize = new google.maps.Size(
			defaultIconSize.width,
			defaultIconSize.height
		);
		let iconAnchor = new google.maps.Point(
			defaultIconSize.width / 2,
			defaultIconSize.height
		);
		this.geometryOnMap.setIcon({
			url: iconUrl,
			scaledSize: iconSize,
			anchor: iconAnchor
		});
		this.geometryOnMap.set("labelVisible", false);
	}

	private async getIconSize(
		imageDesign: IImageDesign
	): Promise<google.maps.Size> {
		if (imageDesign.size !== null) {
			return new google.maps.Size(
				imageDesign.size.width,
				imageDesign.size.height
			);
		} else {
			//if the design doesn't contain an iconSize, we must preload the image to define a correct size and a correct anchor based on its natural size
			//(otherwise it will be distorted and the anchor will be incorrect)
			const img: HTMLImageElement = await this.preloadImage(imageDesign.url);
			return new google.maps.Size(img.naturalWidth, img.naturalHeight);
		}
	}

	private getIconAnchor(
		anchor: { x: number; y: number },
		size: google.maps.Size
	): google.maps.Point {
		if (anchor !== null) {
			return new google.maps.Point(anchor.x, anchor.y);
		} else {
			return new google.maps.Point(size.width / 2, size.height);
		}
	}

	public setVisibility(state: boolean): void {
		this.geometryOnMap.setVisible(state);
		this.visible = state;
	}

	public setLabel(text: string): void {
		if (this.isOnMap) {
			this.geometryOnMap.set("labelContent", text);
			this.geometryOnMap.set("labelClass", "google-maps-point-label");
			this.geometryOnMap.set("labelVisible", true);
		}
	}

	public openBalloonHtml(html: string): void {
		this.gmMapComponent.utils.openBalloonHtml(html, this.coordinate);
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachEventListener(this.geometryOnMap, "click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachEventListener(this.geometryOnMap, "dblclick", listener);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachEventListener(this.geometryOnMap, "rightclick", listener);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachEventListener(this.geometryOnMap, "mouseover", listener);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.gmMapComponent.utils.attachEventListener(this.geometryOnMap, "mouseout", listener);
	}
}