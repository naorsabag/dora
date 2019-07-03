import * as turf from "@turf/helpers";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import { SmoothingUtils } from "./../Utilities/SmoothingUtils";
import { MapError } from "../Common/MapError";
import { IMapComponent } from "../Components/IMapComponent";
import { IGeometryWithLinePattern } from "../GeometryDesign/Interfaces/IGeometryWithLinePattern";
import { SmoothingType } from "../GeometryDesign/Enums/SmoothingType";
import { GeometryDesign } from "../GeometryDesign/GeometryDesign";
import { IconRelativePosition } from "../GeometryDesign/Enums/IconRelativePosition";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { Coordinate } from "./Coordinate";
import { GEOMETRY_TYPES } from "./GeometryTypes";
import { IconOnPathCalculator } from "./IconOnPathCalculator";
import { Path } from "./Path";
import { LinePatternFactory } from "../GeometryDesign/LinePattern/LinePatternFactory";

export abstract class Line extends Path implements IGeometryWithLinePattern {
	protected baseCoordinates: Coordinate[];
	protected transformedCoordinates: Coordinate[];
	protected multilineCoordsDraft: Coordinate[][] = null;
	protected multipolygonCoordsDraft: Coordinate[][] = null;

	protected constructor(
		mapComponent: IMapComponent,
		coordinates: Coordinate[],
		design?: IGeometryDesign,
		id?: string
	) {
		super(mapComponent, coordinates, design, id);
		this._geometryType = GEOMETRY_TYPES.LINE;
		if (typeof design !== "undefined") {
			this.design.update(design);
		}

		this.design.icons.forEach(icon => {
			this.iconPoints.push(
				this.mapComponent.geometryBuilder.buildPoint(
					IconOnPathCalculator.calculatePositionOnPath(
						this.transformedCoordinates,
						icon.image.positionPolicy
					),
					new GeometryDesign({icons: [icon]})
				)
			);
		});
	}

	public getCoordinates(): Coordinate[] {
		return super.getCoordinates() as Coordinate[];
	}

	public setCoordinates(coordinates: Coordinate[]) {
		super.setCoordinates(coordinates);
	}

	public getGeoJSON(): GeoJSON.LineString {
		let coords: number[][] = this.baseCoordinates.map(c => c.getGeoJSON());
		return turf.lineString(coords).geometry;
	}

	public getWKT(): string {
		const coordsString = this.baseCoordinates.map(c => c.getWKT()).join(",");
		return `LINESTRING(${coordsString})`;
	}

	public setGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): void {
		let geoJsonGeometry: GeoJSON.Geometry;
		geoJsonGeometry = this.extractBasicGeoJson(geometry);

		// Validating the geo json type
		if (geoJsonGeometry.type.toLowerCase() !== "linestring") {
			throw new MapError("Invalid wkt", "!!!!!!!!! !! !!");
		}

		let coordinates: Coordinate[] = (geoJsonGeometry as GeoJSON.LineString)
			.coordinates.map(c => Coordinate.fromGeoJSON(c));
		this.setCoordinates(coordinates);
	}

	public setDesign(design: IGeometryDesign): void {
		if (design.icons) {
			for (let icon of design.icons) {
				if (icon.image && icon.image.positionPolicy === IconRelativePosition.Centroid) {
					icon.image.positionPolicy = IconRelativePosition.Center;
				}
			}
		}
		this.design.update(design);
		if (!this.isOnMap || (design.line !== undefined &&
				(design.line.pattern !== undefined ||
					design.line.smoothing !== undefined))
		) {
			//if the geometry doesn't exist yet or needs to be updated, call the generate function
			this.generateGeometryOnMap();
			this.applyDesign(this.design);
		} else {
			this.applyDesign(design);
		}
		this.setIconsOnPathDesign(design);
	}

	public applyMultilineLinePattern(coordinates: Coordinate[][]): void {
		this.multilineCoordsDraft = coordinates;
	}

	public applyMultipolygonLinePattern(coordinates: Coordinate[][]): void {
		this.multipolygonCoordsDraft = coordinates;
	}

	protected applyTransformations(): void {
		this.transformedCoordinates = this.baseCoordinates;
		if (this.design.line.smoothing === SmoothingType.Smooth) {
			this.transformToSmooth();
		}
		const linePatternObj = LinePatternFactory.getPatternObject(this.design.line.pattern);
		linePatternObj.applyToGeometry(this, this.transformedCoordinates);
	}

	/**
	 * @method transformToSmooth - Transform the polyline to be smooth polyline through his original points
	 */
	protected transformToSmooth(): void {
		this.transformedCoordinates = SmoothingUtils.SmoothGeometry(this.baseCoordinates, false, 5);
	}

	protected generateIconsCoordinates(): void {
		//We need to set the icon in place according to the policy
		for (
			let i = 0;
			i < Math.min(this.iconPoints.length, this.design.icons.length);
			i++
		) {
			const iconPoint = this.iconPoints[i];
			const positionalPolicy = this.design.icons[i].image.positionPolicy;
			const coordinate = IconOnPathCalculator.calculatePositionOnPath(
				this.transformedCoordinates,
				positionalPolicy
			);
			iconPoint.setCoordinate(coordinate);
		}
	}

	protected calculateBalloonOpenPosition(): Coordinate {
		let baloonCoords: Coordinate;
		if (this.iconPoints && this.iconPoints.length > 0) {
			baloonCoords = this.iconPoints[0].getCoordinate();
		} else {
			//In case there is no icon, we put the balloon in the center of the line
			baloonCoords = IconOnPathCalculator.calculatePositionOnPath(
				this.transformedCoordinates,
				IconRelativePosition.Center
			);
		}
		return baloonCoords;
	}
}
