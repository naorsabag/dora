import { CesiumUtilities } from "../../MapUtils/CesiumUtilities";
import { NetworkLink } from "../NetworkLink";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { ScreenCoordinate } from "../../GraphicsUtils/ScreenCoordinate";
import { Coordinate } from "../Coordinate";
import { ViewBounds } from "../../Components/View/ViewBounds";
import * as turf from "@turf/helpers";
import intersect from "@turf/intersect";
import boolContains from "@turf/boolean-contains";
import { CesiumHoverService } from "./CesiumHoverService";

const Cesium = require("cesium/Source/Cesium");

export class CesiumNetworkLink extends NetworkLink {

	private cesiumMap: CesiumMapComponent;
	private lastViewBounds: ViewBounds;
	private lastViewCoordinate: Coordinate[];
	private id: string;
	private hoverService: CesiumHoverService;

	constructor(mapComponent: CesiumMapComponent, doc: Document,
				changePolyToLine?: boolean, protected timelineOn?: boolean, url?: string, protected hover?: boolean) {
		super(mapComponent, doc, changePolyToLine, url, hover);

		this.cesiumMap = mapComponent;
	}

	public getId(): string {
		return this.id;
	}

	protected getBoundPixelCountOnView(nodeBounds: ViewBounds, viewBounds: ViewBounds): number {

		if (!this.lastViewBounds) {
			this.lastViewBounds = viewBounds;
		}
		if (!this.lastViewCoordinate || !this.lastViewBounds.isEqual(viewBounds)) {
			this.lastViewCoordinate = this.getMaxCoordinatesOnView();

			//in case there also is sky in the bottom of the screen
			if (!this.lastViewCoordinate) {
				return -1;
			}
		}

		let screenPoly: turf.Feature<turf.Polygon> = turf.polygon([[
			this.lastViewCoordinate[0].getGeoJSON(false),
			this.lastViewCoordinate[1].getGeoJSON(false),
			this.lastViewCoordinate[2].getGeoJSON(false),
			this.lastViewCoordinate[3].getGeoJSON(false),
			this.lastViewCoordinate[0].getGeoJSON(false),
		]]);

		let boundsPoly: turf.Feature<turf.Polygon> = turf.polygon([[
			[nodeBounds.west, nodeBounds.north],
			[nodeBounds.east, nodeBounds.north],
			[nodeBounds.east, nodeBounds.south],
			[nodeBounds.west, nodeBounds.south],
			[nodeBounds.west, nodeBounds.north]
		]]);

		let intersected: turf.Feature<turf.Polygon> = this.getIntersectedPolygons(boundsPoly, screenPoly);
		if (!intersected) {
			return 0;
		}

		let ScreenPos1: ScreenCoordinate = this.cesiumMap.utils.toScreenPosFromCoordinate(
			new Coordinate(intersected.geometry.coordinates[0][0][1],
				intersected.geometry.coordinates[0][0][0]));
		let ScreenPos2: ScreenCoordinate = this.cesiumMap.utils.toScreenPosFromCoordinate(
			new Coordinate(intersected.geometry.coordinates[0][1][1],
				intersected.geometry.coordinates[0][1][0]));
		let ScreenPos3: ScreenCoordinate = this.cesiumMap.utils.toScreenPosFromCoordinate(
			new Coordinate(intersected.geometry.coordinates[0][2][1],
				intersected.geometry.coordinates[0][2][0]));
		let ScreenPos4: ScreenCoordinate = this.cesiumMap.utils.toScreenPosFromCoordinate(
			new Coordinate(intersected.geometry.coordinates[0][3][1],
				intersected.geometry.coordinates[0][3][0]));

		let vertices: ScreenCoordinate[] = [ScreenPos1, ScreenPos2, ScreenPos3, ScreenPos4];

		let area: number = this.getArea(vertices);

		return Math.abs(area * 0.5);
	}

	protected async createDataSource(doc: Document): Promise<any> {
		if (this.id && !doc.getElementsByTagName("Placemark").length) {
			return {};
		}

		if (this.timelineOn) {
			this.cesiumMap.toggleTimeline(true);
		}

		const KmlDataSource = new Cesium.KmlDataSource({
			camera: this.cesiumMap.nativeMapInstance.camera,
			canvas: this.cesiumMap.nativeMapInstance.canvas
		});

		let dataSource = await KmlDataSource.load(doc, {clampToGround: !this.cesiumMap.getIs2D()});

		if (this.changePolyToLine) {
			dataSource = this.cesiumMap.replacePolyWithLine(dataSource);
		}

		if (this.makeEntitiesDoraCompatible) {
			this.cesiumMap.utils.makeEntitiesFromDataSourceDoraCompatible(dataSource);
		}

		if (this.hover) {
			this.hoverService = new CesiumHoverService(this.cesiumMap);
		}

		if (!this.id) {
			this.id = dataSource.entities.id;
		}

		return dataSource;
	}

	protected async showDataSource(dataSource): Promise<void> {
		if (!Object.keys(dataSource).length) {
			return;
		}

		await this.cesiumMap.nativeMapInstance.dataSources.add(dataSource);

		this.hoverService && this.hoverService.toggleHover(true, dataSource);

		this.cesiumMap.nativeMapInstance.scene.requestRender();
	}

	protected hideDataSource(dataSource) {
		if (!Object.keys(dataSource).length) {
			return;
		}

		if (this.timelineOn) {
			this.cesiumMap.toggleTimeline(false);
		}

		this.hoverService && this.hoverService.toggleHover(false, dataSource);

		this.cesiumMap.nativeMapInstance.dataSources.remove(dataSource);
		this.cesiumMap.nativeMapInstance.scene.requestRender();
	}

	protected async focusOnNode(val: number, dataSource: any): Promise<boolean> {
		return this.cesiumMap.nativeMapInstance.flyTo(dataSource);
	}

	protected setPolygonsOpacity(dataSource) {
		if (dataSource.entities) {
			for (let entity of dataSource.entities.values) {
				if (entity._polygon) {
					entity._polygon.material = new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty(() => {
						let alpha: number = 1 + this.cesiumMap.nativeMapInstance.camera.pitch;
						alpha = alpha < 0 ? 0 : alpha;
						return Cesium.Color.GAINSBORO.withAlpha(alpha);
					}, false));
				}
			}
		}
	}

	private getMinScreenPosOnLand(startPos, endPos, sidePos): number {
		let length: number = endPos - startPos;

		if (length <= 1) {
			return endPos;
		}

		let halfLengthPos: number = startPos + (length / 2);

		let pos = this.cesiumMap.utils.toCartesianFromMousePosition(new Cesium.Cartesian2(sidePos, halfLengthPos));

		if (!pos) {
			return this.getMinScreenPosOnLand(halfLengthPos, endPos, sidePos);
		}

		return Math.min(halfLengthPos, this.getMinScreenPosOnLand(startPos, halfLengthPos, sidePos));
	}

	private getMaxCoordinatesOnView(): Coordinate[] {
		let xBegin: number = 0;
		let xEnd: number = this.cesiumMap.nativeMapInstance.container.clientWidth;

		let yBegin: number = 0;
		let yEnd: number = this.cesiumMap.nativeMapInstance.container.clientHeight;

		let cartesianLB = this.cesiumMap.utils.toCartesianFromMousePosition(new Cesium.Cartesian2(xBegin, yEnd));
		let cartesianRB = this.cesiumMap.utils.toCartesianFromMousePosition(new Cesium.Cartesian2(xEnd, yEnd));
		if (!cartesianLB || !cartesianRB) {
			return;
		}

		let leftBottom: Coordinate = CesiumUtilities.toCoordinateFromCartesian(cartesianLB);
		let rightBottom: Coordinate = CesiumUtilities.toCoordinateFromCartesian(cartesianRB);

		let leftTopCartesian = this.cesiumMap.utils.toCartesianFromMousePosition(new Cesium.Cartesian2(xBegin, yBegin));
		let rightTopCartesian = this.cesiumMap.utils.toCartesianFromMousePosition(new Cesium.Cartesian2(xEnd, yBegin));

		leftTopCartesian = leftTopCartesian || this.cesiumMap.utils
			.toCartesianFromMousePosition(new Cesium.Cartesian2(xBegin, this.getMinScreenPosOnLand(yBegin, yEnd / 2, xBegin)));
		rightTopCartesian = rightTopCartesian || this.cesiumMap.utils
			.toCartesianFromMousePosition(new Cesium.Cartesian2(xEnd, this.getMinScreenPosOnLand(yBegin, yEnd / 2, xEnd)));

		if (!leftTopCartesian || !rightTopCartesian) {
			return;
		}

		let leftTop: Coordinate = CesiumUtilities.toCoordinateFromCartesian(leftTopCartesian);
		let rightTop: Coordinate = CesiumUtilities.toCoordinateFromCartesian(rightTopCartesian);

		return [leftBottom, leftTop, rightTop, rightBottom];
	}

	private getIntersectedPolygons(boundsPoly: turf.Feature<turf.Polygon>, screenPoly: turf.Feature<turf.Polygon>):
		turf.Feature<turf.Polygon> {
		let intersected: turf.Feature<turf.Polygon>;
		if (boolContains(screenPoly, boundsPoly)) {
			intersected = boundsPoly;
		}
		else if (boolContains(boundsPoly, screenPoly)) {
			intersected = screenPoly;
		}
		else {
			intersected = intersect(screenPoly, boundsPoly) as turf.Feature<turf.Polygon>;
		}

		return intersected;
	}

	private getArea(vertices: ScreenCoordinate[]): number {
		let area: number = 0;

		for (let i = 0; i < vertices.length; i++) {
			let j: number = i < vertices.length - 1 ? i + 1 : 0;
			if (!vertices[i] || !vertices[j]) {
				return 0;
			}
			area += (vertices[i].x * vertices[j].y - vertices[i].y * vertices[j].x);
		}

		return area;
	}
}