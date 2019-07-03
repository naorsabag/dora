import * as turf from "@turf/helpers";
import * as GeoJSON from "@turf/helpers/lib/geojson";
import turfInside from "@turf/inside";
import { MapError } from "../Common/MapError";
import { IMapComponent } from "../Components/IMapComponent";
import { IGeometryWithFillPattern } from "../GeometryDesign/Interfaces/IGeometryWithFillPattern";
import { IGeometryWithLinePattern } from "../GeometryDesign/Interfaces/IGeometryWithLinePattern";
import { SmoothingType } from "../GeometryDesign/Enums/SmoothingType";
import { GeometryDesign } from "../GeometryDesign/GeometryDesign";
import { IconRelativePosition } from "../GeometryDesign/Enums/IconRelativePosition";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { Coordinate } from "./Coordinate";
import { GEOMETRY_TYPES } from "./GeometryTypes";
import { IconOnPathCalculator } from "./IconOnPathCalculator";
import { LinearRing } from "./LinearRing";
import { Path } from "./Path";
import { LinePatternFactory } from "../GeometryDesign/LinePattern/LinePatternFactory";
import { FillPatternFactory } from "../GeometryDesign/FillPattern/FillPatternFactory";
import { FillPatternName } from "../GeometryDesign/Enums/FillPatternName";
import { LinePatternName } from "../GeometryDesign/Enums/LinePatternName";

export abstract class Polygon extends Path
	implements IGeometryWithLinePattern, IGeometryWithFillPattern {
	protected _baseLinearRings: LinearRing[];
	protected _transformedLinearRings: LinearRing[];
	// this 3 drafts are used to build multipolygon/multipolyline of patterns
	protected multilineCoordsDraftForOutline: Coordinate[][] = null;
	protected multipolygonCoordsDraftForOutline: Coordinate[][] = null;
	protected multilineCoordsDraftForFill: Coordinate[][] = null;

	// the geometryOnMap object of polygon is combined of three parts:
	// fill geometry which can be solid built by one polygon or pattern built by multipolylines
	protected fillGeometry: any;
	// background geometry which is transparent for events catching
	protected fillBackgroundPolygon: any;
	// outline geometry which can be solid built by one polyline or pattern built by multipolygon/multipolyline
	protected outlineGeometry: any;

	constructor(mapComponent: IMapComponent,
				coordinates: Coordinate[] | Coordinate[][],
				design?: IGeometryDesign,
				id?: string) {
		super(mapComponent, Array.isArray(coordinates[0]) ? coordinates : [coordinates as Coordinate[]], design, id);

		this._geometryType = GEOMETRY_TYPES.POLYGON;
		if (typeof design !== "undefined") {
			this.design.update(design);
		}
		//TODO: check the correct place
		this.applyTransformations();

		this.design.icons.forEach(icon => {
			this.iconPoints.push(
				this.mapComponent.geometryBuilder.buildPoint(
					IconOnPathCalculator.calculatePositionOnPath(
						this.transformedCoordinates[0],
						icon.image.positionPolicy
					),
					new GeometryDesign({icons: [icon]})
				)
			);
		});

		this.generateIconsCoordinates();
	}

	protected get baseCoordinates(): Coordinate[][] {
		return this._baseLinearRings.map(ring => ring.coordinates);
	}

	protected set baseCoordinates(coordinates: Coordinate[][]) {
		this._baseLinearRings = coordinates.map((ringCoordinates: Coordinate[]) => new LinearRing(ringCoordinates));
	}

	protected get transformedCoordinates(): Coordinate[][] {
		return this._transformedLinearRings.map(ring => ring.coordinates);
	}

	protected set transformedCoordinates(coordinates: Coordinate[][]) {
		this._transformedLinearRings = coordinates.map((ringCoordinates: Coordinate[]) => new LinearRing(ringCoordinates));
	}

	public getCoordinates(): Coordinate[] | Coordinate[][] {
		if (this.baseCoordinates.length > 1) {
			return this.baseCoordinates;
		}
		return this.baseCoordinates[0];
	}

	public setCoordinates(coordinates: Coordinate[] | Coordinate[][]) {
		const coords = Array.isArray(coordinates[0]) ? coordinates : [coordinates as Coordinate[]];
		super.setCoordinates(coords);
	}

	public getWKT(): string {
		const linearRingsString: string[] = this._baseLinearRings.map(
			ring => ring.getWKT()
		);
		const allRingsString = linearRingsString.join(",");
		return `POLYGON(${allRingsString})`;
	}

	public getGeoJSON(): GeoJSON.Polygon {
		return this.getGeoJsonFeature().geometry;
	}

	public setGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): void {
		let geoJsonGeometry: GeoJSON.Geometry;
		geoJsonGeometry = this.extractBasicGeoJson(geometry);

		// Validating the geo json type
		if (geoJsonGeometry.type.toLowerCase() !== "polygon") {
			throw new MapError("Invalid wkt", "!!!!!!!!! !! !!!!!!!");
		}

		this._baseLinearRings = (<GeoJSON.Polygon>geoJsonGeometry).coordinates
			.map(ring => LinearRing.fromGeoJSON(ring));

		this.generateGeometryOnMap();
	}

	public setDesign(design: IGeometryDesign): void {
		//TODO: check it...
		//Case where there are same number of icons as before
		this.design.update(design);
		if (
			!this.isOnMap ||
			(design.line && (design.line.pattern || design.line.smoothing)) ||
			(design.fill && design.fill.pattern)
		) {
			//if the geometry doesn't exist yet or needs to be updated, call the generate function
			this.generateGeometryOnMap();
		} else {
			this.applyDesign(design);
		}
		this.setIconsOnPathDesign(design);
	}

	public applyMultilineLinePattern(coordinates: Coordinate[][]): void {
		this.multilineCoordsDraftForOutline = this.concatOrCreate(this.multilineCoordsDraftForOutline, coordinates);
	}

	public applyMultipolygonLinePattern(coordinates: Coordinate[][]): void {
		this.multipolygonCoordsDraftForOutline = this.concatOrCreate(this.multipolygonCoordsDraftForOutline, coordinates);
	}

	public applyMultilineFillPattern(coordinates: Coordinate[][]): void {
		this.multilineCoordsDraftForFill = coordinates;
	}

	public containsPoint(point: Coordinate): boolean {
		const turfPoint: GeoJSON.Feature<GeoJSON.Point> = turf.point(point.getGeoJSON());
		return turfInside(turfPoint, this.getGeoJsonFeature());
	}

	protected applyTransformations(): void {
		this.multilineCoordsDraftForOutline = null;
		this.multipolygonCoordsDraftForOutline = null;
		this.multilineCoordsDraftForFill = null;

		this.transformedCoordinates = this.baseCoordinates;
		if (this.design.line.smoothing === SmoothingType.Smooth) {
			this.transformToSmooth();
		} else if (this.design.line.smoothing === SmoothingType.Round) {
			this.transformToRound();
		}

		const linePatternObj = LinePatternFactory.getPatternObject(this.design.line.pattern);
		const fillPatternObj = FillPatternFactory.getPatternObject(this.design.fill.pattern);
		this.transformedCoordinates.forEach((coordinates) => {
			linePatternObj.applyToGeometry(this, coordinates);
		});

		fillPatternObj.applyToGeometry(this, this.getTransformedGeoJSONFeature());
	}

	protected transformToSmooth(): void {
		this._transformedLinearRings = this._baseLinearRings.map(ring => ring.transformToSmooth());
	}

	protected transformToRound(): void {
		this._transformedLinearRings = this._baseLinearRings.map(ring => ring.transformToRound());
	}

	protected generateIconsCoordinates(): void {
		//We need to set the icon in place according to the policy
		for (let i = 0; i < Math.min(this.iconPoints.length, this.design.icons.length); i++) {
			const iconPoint = this.iconPoints[i];
			const positionalPolicy = this.design.icons[i].image.positionPolicy;
			const coordinate = IconOnPathCalculator.calculatePositionOnPath(
				this.transformedCoordinates[0],
				positionalPolicy
			);
			iconPoint.setCoordinate(coordinate);
		}
	}

	protected calculateBalloonOpenPosition(): Coordinate {
		let balloonCoords: Coordinate;
		if (this.iconPoints && this.iconPoints.length > 0) {
			balloonCoords = this.iconPoints[0].getCoordinate();
		} else {
			//In case there is no icon, we put the baloon in the center of the line
			balloonCoords = IconOnPathCalculator.calculatePositionOnPath(
				this.transformedCoordinates[0],
				IconRelativePosition.NorthernPoint
			);
		}
		return balloonCoords;
	}

	protected getTransformedGeoJSONFeature(): GeoJSON.Feature<GeoJSON.Polygon> {
		const ringCoords: GeoJSON.Position[][] = this._transformedLinearRings.map(c => c.getGeoJSON());
		return turf.polygon(ringCoords);
	}

	protected isOutlineSolid() {
		return this.design.line.pattern === LinePatternName.Solid;
	}

	protected isFillSolid() {
		return this.design.fill.pattern === FillPatternName.Solid;
	}

	protected isFill() {
		return this.design.fill.pattern !== FillPatternName.Empty;
	}

	protected generateGeometryOnMap(): void {
		this.applyTransformations(); // transformedCoordinates and the drafts will be ready to use after this method
		this.geometryOnMap = this.initializeOrCleanGeometryOnMap(); // geometryOnMap is the container for the polygon geometry parts

		this.fillBackgroundPolygon = this.generateBackgroundFillPolygon();
		this.fillGeometry = this.generatePolygonFill();
		this.outlineGeometry = this.generatePolygonOutline();
		// the order is important, so the outline will be at the end because it should be in front
		this.addSubGeometriesToGeometryOnMap([this.fillBackgroundPolygon, this.fillGeometry, this.outlineGeometry]);

		this.applyDesign(this.design);
		this.generateIconsCoordinates();
	}

	protected generatePolygonOutline(): any {
		const outlineMultiGeometry = this.initializeSubGeometryOnMap(this.outlineGeometry);
		if (this.isOutlineSolid()) {
			this.createNativeOutlinePolygon(outlineMultiGeometry, this.transformedCoordinates);
		}
		else {
			this.createOutlinePattern(outlineMultiGeometry);
		}

		return outlineMultiGeometry;
	}

	protected createOutlinePattern(outlineMultiGeometry: any) {
		if (this.multipolygonCoordsDraftForOutline !== null) {
			this.createNativeMultiPolygon(outlineMultiGeometry, this.multipolygonCoordsDraftForOutline);
		}
		else if (this.multilineCoordsDraftForOutline !== null) {
			this.createNativeMultiPolyline(outlineMultiGeometry, this.multilineCoordsDraftForOutline);
		}
	}

	protected generatePolygonFill(): any {
		const fillMultiGeometry = this.initializeSubGeometryOnMap(this.fillGeometry);
		if (this.isFill()) {
			if (this.isFillSolid()) {
				this.createNativeFillPolygon(fillMultiGeometry, this.transformedCoordinates);
			}
			else {
				this.createNativeMultiPolyline(fillMultiGeometry, this.multilineCoordsDraftForFill);
			}
		}
		return fillMultiGeometry;
	}

	protected generateBackgroundFillPolygon(): any {
		const fillBackgroundPolygon = this.initializeSubGeometryOnMap(this.fillBackgroundPolygon);
		if (this.isFill() && !this.isFillSolid()) {
			this.createBackgroundFillPolygon(fillBackgroundPolygon, this.transformedCoordinates);
		}
		return fillBackgroundPolygon;
	}

	protected abstract initializeOrCleanGeometryOnMap(): any;

	protected abstract initializeSubGeometryOnMap(geometry: any): any;

	protected abstract addSubGeometriesToGeometryOnMap(geometries: any[]): void;

	protected abstract createNativeMultiPolyline(group: any, coordinatesMat: Coordinate[][]): void;

	protected abstract createNativeMultiPolygon(group: any, coordinatesMat: Coordinate[][]): void;

	protected abstract createNativeOutlinePolygon(group: any, coordinatesMat: Coordinate[][]): void;

	protected abstract createNativeFillPolygon(group: any, coordinatesMat: Coordinate[][]): void;

	protected abstract createBackgroundFillPolygon(group: any, coordinatesMat: Coordinate[][]): void;

	private concatOrCreate<T>(sourceArray: T[], addedItems: T[]) {
		return (sourceArray ? sourceArray : []).concat(addedItems);
	}

	private getGeoJsonFeature(): GeoJSON.Feature<GeoJSON.Polygon> {
		const ringCoords: GeoJSON.Position[][] = this._baseLinearRings.map(c => c.getGeoJSON());
		return turf.polygon(ringCoords);
	}
}
