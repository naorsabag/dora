import { MapUtils } from "../../MapUtils/MapUtils";
import { GEGraphicsUtils } from "../../GraphicsUtils/GEGraphicsUtils";
import { Coordinate } from "../Coordinate";
import { IActionToken } from "../../Common/IActionToken";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GELayer } from "../../Layers/GELayer";
import { Line } from "../Line";

const GEarthExtensions = require("../../../../../vendor/earth-api-utility-library/extensions.js");

export class GELine extends Line {
	private geMapComponent: GoogleEarthMapComponent;
	private _editableLine: google.earth.KmlPlacemark = null;
	private get editableLine(): google.earth.KmlPlacemark {
		if (this._editableLine === null) {
			this._editableLine = this.geMapComponent.nativeMapInstance.createPlacemark("");
			let style: google.earth.KmlStyle = this.geMapComponent.nativeMapInstance.createStyle("");
			style.getLineStyle().setWidth(3);
			style.getLineStyle().getColor().set("9900ffff");
			this._editableLine.setStyleSelector(style);
		}
		return this._editableLine;
	}

	constructor(mapComponent: GoogleEarthMapComponent,
				coordinates: Coordinate[],
				design?: IGeometryDesign,
				id?: string) {
		super(mapComponent, coordinates, design, id);

		this.geMapComponent = mapComponent;
		this.graphicsUtils = new GEGraphicsUtils(mapComponent);
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
			this.geometryOnMap.setStyleSelector(this.geMapComponent.nativeMapInstance.createStyle(""));
		}
		this.applyTransformations();

		if (this.multilineCoordsDraft === null && this.multipolygonCoordsDraft === null) {
			let kmlLineString: google.earth.KmlLineString = this.geMapComponent.utils.createLineGeometry(this.transformedCoordinates);
			this.geometryOnMap.setGeometry(kmlLineString);
		}
		else {
			let kmlMultiGeometry: google.earth.KmlMultiGeometry = this.geMapComponent.nativeMapInstance.createMultiGeometry("");
			if (this.multilineCoordsDraft !== null) {
				this.multilineCoordsDraft.forEach((line: Coordinate[]) => {
					let lineGeometry: google.earth.KmlLineString = this.geMapComponent.utils.createLineGeometry(line);
					kmlMultiGeometry.getGeometries().appendChild(lineGeometry);
				});
			}
			if (this.multipolygonCoordsDraft !== null) {
				this.multipolygonCoordsDraft.forEach((polygon: Coordinate[]) => {
					let polygonGeometry: google.earth.KmlPolygon = this.geMapComponent.utils.createPolygonGeometry(polygon);
					kmlMultiGeometry.getGeometries().appendChild(polygonGeometry);
				});
			}
			this.geometryOnMap.setGeometry(kmlMultiGeometry);
		}
		this.multilineCoordsDraft = null;
		this.multipolygonCoordsDraft = null;

		this.generateIconsCoordinates();
	}

	public edit(token: IActionToken): void {
		this.setVisibility(false);
		let editableLineGeometry: google.earth.KmlLineString = this.geMapComponent.utils.createLineGeometry(this.baseCoordinates);
		this.editableLine.setGeometry(editableLineGeometry);
		this.geMapComponent.nativeMapInstance.getFeatures().appendChild(this.editableLine);
		// enter edit mode
		let gex = new GEarthExtensions(this.geMapComponent.nativeMapInstance);
		gex.edit.editLineString(this.editableLine.getGeometry());

		token.finish = () => {
			// cancel edit mode
			gex.edit.endEditLineString(this.editableLine.getGeometry());

			// replace coordinates with new coordinates
			this.baseCoordinates = this.geMapComponent.utils.latLngsToCoordinates(editableLineGeometry.getCoordinates());
			this.geMapComponent.nativeMapInstance.getFeatures().removeChild(this.editableLine);
			this.generateGeometryOnMap();
			this.setVisibility(true);
		};

		token.cancel = () => {
			// cancel edit mode
			gex.edit.endEditLineString(this.editableLine.getGeometry());
			this.geMapComponent.nativeMapInstance.getFeatures().removeChild(this.editableLine);
			this.setVisibility(true);
		};
	}

	public drag(token: IActionToken): void {
		this.setVisibility(false);
		let editableLineGeometry: google.earth.KmlLineString = this.geMapComponent.utils.createLineGeometry(this.baseCoordinates);
		this.editableLine.setGeometry(editableLineGeometry);
		this.geMapComponent.nativeMapInstance.getFeatures().appendChild(this.editableLine);
		let cancelDrag = this.geMapComponent.utils.dragPlacemark(this.editableLine);

		token.finish = () => {
			cancelDrag();
			// replace coordinates with new coordinates
			this.baseCoordinates = this.geMapComponent.utils.latLngsToCoordinates(editableLineGeometry.getCoordinates());
			this.geMapComponent.nativeMapInstance.getFeatures().removeChild(this.editableLine);
			this.generateGeometryOnMap();
			this.setVisibility(true);
		};

		token.cancel = () => {
			cancelDrag();
			this.geMapComponent.nativeMapInstance.getFeatures().removeChild(this.editableLine);
			this.setVisibility(true);
		};
	}

	public setVisibility(state: boolean): void {
		if (this.isOnMap) {
			this.geometryOnMap.setVisibility(state);
		}
		this.iconPoints.forEach(iconPoint => {
			iconPoint.setVisibility(state);
		});
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		this.geMapComponent.utils.openBalloonHtml(this.geometryOnMap, html);
	}

	protected setLineColor(color: string): void {
		let colorObj = (<google.earth.KmlStyle>this.geometryOnMap.getStyleSelector()).getLineStyle().getColor();
		this.geMapComponent.utils.setColor(colorObj, color);
	}

	protected setLineOpacity(opacity: number): void {
		let colorObj = (<google.earth.KmlStyle>this.geometryOnMap.getStyleSelector()).getLineStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorObj, opacity);
	}

	protected setLineWidth(width: number): void {
		(<google.earth.KmlStyle>this.geometryOnMap.getStyleSelector()).getLineStyle().setWidth(width);
	}

	protected setFillColor(color: string): void {
		let colorObj = (<google.earth.KmlStyle>this.geometryOnMap.getStyleSelector()).getPolyStyle().getColor();
		this.geMapComponent.utils.setColor(colorObj, color);
	}

	protected setFillOpacity(opacity: number): void {
		let colorObj = (<google.earth.KmlStyle>this.geometryOnMap.getStyleSelector()).getPolyStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorObj, opacity);
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnClickEvent(this.geometryOnMap, listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnDoubleClickEvent(this.geometryOnMap, listener);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnRightClickEvent(this.geometryOnMap, listener);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnMouseOverEvent(this.geometryOnMap, listener);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.geMapComponent.utils.attachOnMouseOutEvent(this.geometryOnMap, listener);
	}

	public setId(value: string): void {}
	public getId(): string {
		return null;
	}
}