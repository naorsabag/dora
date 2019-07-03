import { IActionToken } from "../../Common/IActionToken";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { GEGraphicsUtils } from "../../GraphicsUtils/GEGraphicsUtils";
import { GELayer } from "../../Layers/GELayer";
import { MapUtils } from "../../MapUtils/MapUtils";
import { Coordinate } from "../Coordinate";
import { Polygon } from "../Polygon";

const GEarthExtensions = require("../../../../../vendor/earth-api-utility-library/extensions.js");

export class GEPolygon extends Polygon {
	protected geometryOnMap: google.earth.KmlPlacemark[];
	protected fillGeometry: google.earth.KmlPlacemark;
	protected outlineGeometry: google.earth.KmlPlacemark;
	private geMapComponent: GoogleEarthMapComponent;

	constructor(mapComponent: GoogleEarthMapComponent,
				coordinates: Coordinate[] | Coordinate[][],
				design?: IGeometryDesign,
				id?: string) {
		super(mapComponent, coordinates, design, id);

		this.geMapComponent = mapComponent;
		this.graphicsUtils = new GEGraphicsUtils(mapComponent);
	}

	private _editablePolygon: google.earth.KmlPlacemark = null;

	private get editablePolygon(): google.earth.KmlPlacemark {
		if (this._editablePolygon === null) {
			this._editablePolygon = this.geMapComponent.nativeMapInstance.createPlacemark("");
			let style: google.earth.KmlStyle = this.geMapComponent.nativeMapInstance.createStyle("");
			style.getLineStyle().setWidth(3);
			style.getLineStyle().getColor().set("9900ffff");
			style.getPolyStyle().setFill(false);
			this._editablePolygon.setStyleSelector(style);
		}
		return this._editablePolygon;
	}

	public dispose(): void {
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		// enter edit mode
		const editablePolygonGeometry = this.editablePolygon.getGeometry() as google.earth.KmlPolygon;
		const outerBoundary = editablePolygonGeometry.getOuterBoundary();
		const innerRings = editablePolygonGeometry
			.getInnerBoundaries()
			.getChildNodes();
		const gex = new GEarthExtensions(this.geMapComponent.nativeMapInstance);
		gex.edit.editLineString(outerBoundary);
		for (let i = 0; i < innerRings.getLength(); i++) {
			gex.edit.editLineString(innerRings.item(i));
		}
		const endEditLines = () => {
			gex.edit.endEditLineString(outerBoundary);
			for (let i = 0; i < innerRings.getLength(); i++) {
				gex.edit.endEditLineString(innerRings.item(i));
			}
		};
		token.finish = () => {
			// cancel edit mode
			endEditLines();
			this.finishEditMode();
		};

		token.cancel = () => {
			// cancel edit mode
			endEditLines();
			this.exitEditMode();
		};
	}

	public drag(token: IActionToken): void {
		this.replacePolygonToEditablePolygon();
		let cancelDrag = this.geMapComponent.utils.dragPlacemark(
			this.editablePolygon
		);

		token.finish = () => {
			cancelDrag();
			// replace coordinates with new coordinates
			this.finishEditMode();
		};

		token.cancel = () => {
			cancelDrag();
			this.exitEditMode();
		};
	}

	public setVisibility(state: boolean): void {
		if (this.isOnMap) {
			this.applyFnToGeometryOnMap(placemark => placemark.setVisibility(state));
		}
		this.iconPoints.forEach(iconPoint => {
			iconPoint.setVisibility(state);
		});
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		this.applyFnToGeometryOnMap(placemark => this.geMapComponent.utils.openBalloonHtml(placemark, html));
	}

	public setId(value: string): void {
	}

	public getId(): string {
		return null;
	}

	protected addNativeGeometryToMap(): void {
		this.applyFnToGeometryOnMap(placemark => this.geMapComponent.nativeMapInstance.getFeatures().appendChild(placemark));
	}

	protected removeNativeGeometryFromMap(): void {
		this.applyFnToGeometryOnMap(placemark => this.geMapComponent.nativeMapInstance.getFeatures().removeChild(placemark));
	}

	protected addNativeGeometryToLayer(layer: GELayer): void {
		this.applyFnToGeometryOnMap(placemark => layer.addPlacemark(placemark));
	}

	protected removeNativeGeometryFromLayer(layer: GELayer): void {
		this.applyFnToGeometryOnMap(placemark => layer.removePlacemark(placemark));
	}

	protected initializeOrCleanGeometryOnMap(): google.earth.KmlPlacemark[] {
		if (this.geometryOnMap) {
			this.applyFnToGeometryOnMap(placemark => placemark.setGeometry(null));
		}
		return [];
	}

	protected initializeSubGeometryOnMap(geometry: google.earth.KmlPlacemark): google.earth.KmlPlacemark {
		if (!geometry) {
			geometry = this.geMapComponent.nativeMapInstance.createPlacemark("");
			geometry.setStyleSelector(this.geMapComponent.nativeMapInstance.createStyle(""));
		}

		return geometry;
	}

	protected addSubGeometriesToGeometryOnMap(geometries: google.earth.KmlPlacemark[]) {
		this.geometryOnMap = this.geometryOnMap.concat(geometries);
	}


	protected createNativeMultiPolyline(group: google.earth.KmlPlacemark, coordinatesMat: Coordinate[][]): void {
		const kmlMultiGeometry: google.earth.KmlMultiGeometry = this.geMapComponent.nativeMapInstance.createMultiGeometry("");
		coordinatesMat.forEach((line: Coordinate[]) => {
			const lineGeometry: google.earth.KmlLineString = this.geMapComponent.utils.createLineGeometry(line);
			kmlMultiGeometry.getGeometries().appendChild(lineGeometry);
		});
		group.setGeometry(kmlMultiGeometry);
	}

	protected createNativeMultiPolygon(group: google.earth.KmlPlacemark, coordinatesMat: Coordinate[][]): void {
		const kmlMultiGeometry: google.earth.KmlMultiGeometry = this.geMapComponent.nativeMapInstance.createMultiGeometry("");
		this.multipolygonCoordsDraftForOutline.forEach((polygon: Coordinate[]) => {
			const polygonGeometry: google.earth.KmlPolygon = this.geMapComponent.utils.createPolygonGeometry(polygon);
			kmlMultiGeometry.getGeometries().appendChild(polygonGeometry);
		});
		group.setGeometry(kmlMultiGeometry);
	}

	protected createNativeOutlinePolygon(group: google.earth.KmlPlacemark, coordinatesMat: Coordinate[][]): void {
		this.createNativeMultiPolyline(group, coordinatesMat);
	}

	protected createNativeFillPolygon(group: google.earth.KmlPlacemark, coordinatesMat: Coordinate[][]): void {
		const kmlPolygon: google.earth.KmlPolygon = this.geMapComponent.utils.createHierarchicalPolygonGeometry(this.transformedCoordinates);
		group.setGeometry(kmlPolygon);
		(group.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().setOutline(false);
		(group.getStyleSelector() as google.earth.KmlStyle).getLineStyle().setWidth(3);
	}

	protected createBackgroundFillPolygon(group: google.earth.KmlPlacemark, coordinatesMat: Coordinate[][]): void {
		const kmlPolygon: google.earth.KmlPolygon = this.geMapComponent.utils.createHierarchicalPolygonGeometry(this.transformedCoordinates);
		group.setGeometry(kmlPolygon);
		(group.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().setOutline(false);
		const colorFillObj = (group.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorFillObj, 0.1);
	}

	protected setLineColor(color: string): void {
		const colorOutlineObj = (this.outlineGeometry.getStyleSelector() as google.earth.KmlStyle).getLineStyle().getColor();
		this.geMapComponent.utils.setColor(colorOutlineObj, color);

		const colorFillObj = (this.outlineGeometry.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().getColor();
		this.geMapComponent.utils.setColor(colorFillObj, color);
	}

	protected setLineOpacity(opacity: number): void {
		const colorOutlineObj = (this.outlineGeometry.getStyleSelector() as google.earth.KmlStyle).getLineStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorOutlineObj, opacity);

		const colorFillObj = (this.outlineGeometry.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorFillObj, opacity);
	}

	protected setLineWidth(width: number): void {
		(this.outlineGeometry.getStyleSelector() as google.earth.KmlStyle).getLineStyle().setWidth(width);
	}

	protected setFillColor(color: string): void {
		const colorFillObj = (this.fillGeometry.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().getColor();
		this.geMapComponent.utils.setColor(colorFillObj, color);

		const colorOutlineObj = (this.fillGeometry.getStyleSelector() as google.earth.KmlStyle).getLineStyle().getColor();
		this.geMapComponent.utils.setColor(colorOutlineObj, color);
	}

	protected setFillOpacity(opacity: number): void {
		const colorFillObj = (this.fillGeometry.getStyleSelector() as google.earth.KmlStyle).getPolyStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorFillObj, opacity);

		const colorOutlineObj = (this.fillGeometry.getStyleSelector() as google.earth.KmlStyle).getLineStyle().getColor();
		this.geMapComponent.utils.setOpacity(colorOutlineObj, opacity);
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener((feature: google.earth.KmlPlacemark) => {
			return this.geMapComponent.utils.attachOnClickEvent(feature, listener);
		});
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener((feature: google.earth.KmlPlacemark) => {
			return this.geMapComponent.utils.attachOnDoubleClickEvent(feature, listener);
		});
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener((feature: google.earth.KmlPlacemark) => {
			return this.geMapComponent.utils.attachOnRightClickEvent(feature, listener);
		});
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener((feature: google.earth.KmlPlacemark) => {
			return this.geMapComponent.utils.attachOnMouseOverEvent(feature, listener);
		});
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.addUserEventListener((feature: google.earth.KmlPlacemark) => {
			return this.geMapComponent.utils.attachOnMouseOutEvent(feature, listener);
		});
	}

	private applyFnToGeometryOnMap(callback: (feature: google.earth.KmlPlacemark) => void) {
		this.geometryOnMap.forEach((feature) => {
			callback(feature);
		});
	}

	private addUserEventListener(eventRegisterFn: (feature: google.earth.KmlPlacemark) => () => void): () => void {
		const cancelFunctions = [];
		this.applyFnToGeometryOnMap((feature) => {
			cancelFunctions.push(eventRegisterFn(feature));
		});

		return () => {
			cancelFunctions.forEach((fn => fn()));
		};
	}

	private replacePolygonToEditablePolygon() {
		this.setVisibility(false);

		let editablePolygonGeometry: google.earth.KmlPolygon = this.geMapComponent.utils.createHierarchicalPolygonGeometry(this.baseCoordinates);
		this.editablePolygon.setGeometry(editablePolygonGeometry);
		this.geMapComponent.nativeMapInstance.getFeatures().appendChild(this.editablePolygon);
	}

	private finishEditMode() {
		const editablePolygonGeometry = this.editablePolygon.getGeometry() as google.earth.KmlPolygon;
		const outerCoordinates = this.geMapComponent.utils.latLngsToCoordinates(
			editablePolygonGeometry.getOuterBoundary().getCoordinates()
		);

		const innerRings = editablePolygonGeometry.getInnerBoundaries().getChildNodes();
		const innerCoordsMat: Coordinate[][] = [];
		for (let i = 0; i < innerRings.getLength(); i++) {
			const innerCoordsArr = this.geMapComponent.utils.latLngsToCoordinates(
				innerRings.item(i).getCoordinates()
			);
			innerCoordsMat.push(innerCoordsArr);
		}

		this.baseCoordinates = [outerCoordinates, ...innerCoordsMat];
		this.generateGeometryOnMap();
		this.exitEditMode();
	}

	private exitEditMode() {
		this.geMapComponent.nativeMapInstance.getFeatures().removeChild(this.editablePolygon);
		this.setVisibility(true);
	}
}