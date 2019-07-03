import { IActionToken } from "../../Common/IActionToken";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GELayer } from "../../Layers/GELayer";
import { XXXMapUtils } from "../../MapUtils/XXXMapUtils";
import { Coordinate } from "../Coordinate";
import { Point } from "../Point";
import { IImageDesign } from "../../GeometryDesign/Interfaces/IImageDesign";

export class GEPoint extends Point {
	private geMapComponent: GoogleEarthMapComponent;
	private kmlIcon: google.earth.KmlIcon = null;
	private kmlStyle: google.earth.KmlStyle;
	private kmlPoint: google.earth.KmlPoint = null;

	constructor(mapComponent: GoogleEarthMapComponent,
		coordinate: Coordinate,
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinate, design, id);

		this.geMapComponent = mapComponent;
	}

	public getId(): string {
		throw Error("Method not implemented.");
	}

	public setId(value: string): void {
		throw Error("Method not implemented.");
	}

	protected addNativeGeometryToMap(): void {
		this.geMapComponent.nativeMapInstance.getFeatures().appendChild(this.geometryOnMap);
	}

	protected removeNativeGeometryFromMap(): void {
		this.geMapComponent.nativeMapInstance.getFeatures().removeChild(this.geometryOnMap);
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	protected addNativeGeometryToLayer(layer: GELayer): void {
		layer.addPlacemark(this.geometryOnMap);
	}

	protected removeNativeGeometryFromLayer(layer: GELayer): void {
		layer.removePlacemark(this.geometryOnMap);
	}

	protected generateGeometryOnMap(): void {
		if (this.geometryOnMap === null) {
			this.geometryOnMap = this.geMapComponent.nativeMapInstance.createPlacemark("");
			this.kmlStyle = this.geMapComponent.nativeMapInstance.createStyle("");
			this.geometryOnMap.setStyleSelector(this.kmlStyle);
			this.kmlPoint = this.geMapComponent.nativeMapInstance.createPoint("");
			this.geometryOnMap.setGeometry(this.kmlPoint);
		}
		if (this.coordinate) {
			this.kmlPoint.setLatLngAlt(this.coordinate.latitude, this.coordinate.longitude, this.coordinate.altitude);
		}
	}

	public edit(token: IActionToken): void {
		this.drag(token);
	}

	public drag(token: IActionToken): void {
		this.setVisibility(false);
		let pointToEdit = XXXMapUtils.createPlacemark({
			lon: this.coordinate.longitude,
			lat: this.coordinate.latitude
		});

		token.finish = () => {
			pointToEdit.setIsDraggable(false);
			let editedPoint: google.earth.KmlPoint = pointToEdit.getOriginalObject().getGeometry();
			this.coordinate = new Coordinate(editedPoint.getLatitude(), editedPoint.getLongitude(), editedPoint.getAltitude());

			this.kmlPoint.setLatLngAlt(editedPoint.getLatitude(),
			editedPoint.getLongitude(), editedPoint.getAltitude());

			this.geMapComponent.nativeMapInstance.getFeatures().removeChild(pointToEdit.getOriginalObject());
			this.setVisibility(true);
		};

		pointToEdit.setIsDraggable(true);

		token.cancel = () => {
			// cancel edit mode
			pointToEdit.setIsDraggable(false);
			this.geMapComponent.nativeMapInstance.getFeatures().removeChild(pointToEdit.getOriginalObject());
			this.setVisibility(true);
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
					this.geometryOnMap.setName("");
				}
			});
			await Promise.all(promises);
		}
	}

	private async createImage(imageDesign: IImageDesign): Promise<void> {
		if (this.kmlIcon === null) {
			this.kmlIcon = this.geMapComponent.nativeMapInstance.createIcon("");
			this.kmlStyle.getIconStyle().setIcon(this.kmlIcon);
			this.kmlStyle.getIconStyle().getHotSpot().setXUnits(this.geMapComponent.nativeMapInstance.UNITS_PIXELS);
			this.kmlStyle.getIconStyle().getHotSpot().setYUnits(this.geMapComponent.nativeMapInstance.UNITS_INSET_PIXELS);
		}
		if (imageDesign.visibility) {
			if (!imageDesign.url) {
				this.createDefaultIcon();
			} else {
				this.kmlIcon.setHref(imageDesign.url);
			}

			const img: HTMLImageElement = await this.preloadImage(imageDesign.url);
			const naturalSize = {
				width: img.naturalWidth,
				height: img.naturalHeight
			};
			this.setIconSize(imageDesign.size, naturalSize);
			const scale = this.kmlStyle.getIconStyle().getScale();
			this.setIconAnchor(imageDesign.anchor, scale, naturalSize);
		} else {
			this.kmlIcon.setHref("");
		}
	}

	private createDefaultIcon(): void {
		/*The icon in google earth must be real url, then we cannot set the default icon in case there is no url,
			  we need to use the default underlying google earth icon*/
		this.kmlIcon = null;
		this.kmlStyle.getIconStyle().setIcon(null);
	}

	private setIconSize(
		imageSize: { width: number; height: number },
		naturalSize: { width: number; height: number }
	): void {
		if (imageSize === null) {
			imageSize = {
				width: 60,
				height: 80
			};
		}

		//convert the provided pixel size to scale, which is supported by Google Earth, based on the image's natural size
		let scaleWidth = imageSize.width / naturalSize.width;
		let scaleHeight = imageSize.height / naturalSize.height;
		this.kmlStyle
			.getIconStyle()
			.setScale(Math.max(scaleWidth, scaleHeight));
	}

	private setIconAnchor(
		anchor: { x: number; y: number },
		scale: number,
		naturalSize: { width: number; height: number }
	): void {
		if (anchor !== null) {
			//in Google Earth the anchor is relative to the unscaled (natural) image so we need to "unscale" the provided value
			this.kmlStyle
				.getIconStyle()
				.getHotSpot()
				.setX(anchor.x / scale);
			this.kmlStyle
				.getIconStyle()
				.getHotSpot()
				.setY(anchor.y / scale);
		} else {
			//the anchor is based on the image's size (not influenced by the scaled size)
			this.kmlStyle
				.getIconStyle()
				.getHotSpot()
				.setX(naturalSize.width / 2);
			this.kmlStyle
				.getIconStyle()
				.getHotSpot()
				.setY(naturalSize.height);
		}
	}

	public setVisibility(state: boolean): void {
		if (this.isOnMap) {
			this.geometryOnMap.setVisibility(state);
		}
		this.visible = state;
	}

	public setLabel(text: string): void {
		if (this.isOnMap) {
			this.geometryOnMap.setName(text);
		}
	}

	public openBalloonHtml(html: string): void {
		this.geMapComponent.utils.openBalloonHtml(this.geometryOnMap, html);
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnClickEvent(this.geometryOnMap, listener, true);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnDoubleClickEvent(this.geometryOnMap, listener, true);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnRightClickEvent(this.geometryOnMap, listener, true);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnMouseOverEvent(this.geometryOnMap, listener, true);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnMouseOutEvent(this.geometryOnMap, listener, true);
	}
}