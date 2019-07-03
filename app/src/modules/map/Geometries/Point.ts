import * as turf from "@turf/helpers";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import { MapError } from "../Common/MapError";
import { IMapComponent } from "../Components/IMapComponent";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { Coordinate } from "./Coordinate";
import { Geometry } from "./Geometry";
import { GEOMETRY_TYPES } from "./GeometryTypes";

export abstract class Point extends Geometry {

	protected coordinate: Coordinate;

	protected constructor(mapComponent: IMapComponent, coordinate: Coordinate, design?: IGeometryDesign, id?: string) {
		super(mapComponent, design, id);
		this._geometryType = GEOMETRY_TYPES.POINT;
		this.coordinate = coordinate.clone();
	}

	public getGeoJSON(): GeoJSON.Point {
		let coord: number[] = this.coordinate.getGeoJSON();
		return turf.point(coord).geometry;
	}

	public getWKT(): string {
		return `POINT(${this.coordinate.getWKT()})`;
	}

	public setDesign(design: IGeometryDesign): void {
		this.design.update(design);
		if (!this.addedToMap) {
			//if the geometry doesn't exist yet, call the generate function
			this.generateGeometryOnMap();
		}
		this.applyDesign(design);
	}

	public getCoordinate(): Coordinate {
		return this.coordinate;
	}

	public setCoordinate(coordinate: Coordinate): void {
		this.coordinate = coordinate.clone();
		this.generateGeometryOnMap();
	}

	public setGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): void {
		let geoJsonGeometry: GeoJSON.Geometry;
		geoJsonGeometry = this.extractBasicGeoJson(geometry);

		// Validating the geo json type
		if (geoJsonGeometry.type.toLowerCase() !== "point") {
			throw new MapError("Invalid wkt", "!!!!!!!!! !! !!!!!");
		}
		let coordinate: Coordinate = Coordinate.fromGeoJSON((geoJsonGeometry as GeoJSON.Point).coordinates);
		this.setCoordinate(coordinate);
	}

	protected abstract renderIcon(): void;

	protected applyDesign(design: IGeometryDesign): void {
		//TODO: Set visibility of label...
		super.applyDesign(design);
		//Set visibility of icon
		this.renderIcon();
	}

	protected getIconsCoordinates(): Coordinate[] {
		//In point there is no meaning for position policy
		return [this.coordinate];
	}

	protected setLineColor(color: string): void {
	}

	protected setLineOpacity(opacity: number): void {
	}

	protected setLineWidth(width: number): void {
	}

	protected setFillColor(color: string): void {
	}

	protected setFillOpacity(opacity: number): void {
	}

	protected preloadImage(imgUrl: string): Promise<HTMLImageElement> {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			let imgIcon = new Image();
			imgIcon.onload = () => {
				resolve(imgIcon);
			};
			imgIcon.src = imgUrl;
		});
	}
}