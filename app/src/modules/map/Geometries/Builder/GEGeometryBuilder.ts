import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";
import { GELayer } from "../../Layers/GELayer";
import { ILayer } from "../../Layers/ILayer";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { Geometry } from "../Geometry";
import { GEArrow } from "../GoogleEarth/GEArrow";
import { GELine } from "../GoogleEarth/GELine";
import { GEPoint } from "../GoogleEarth/GEPoint";
import { GEPolygon } from "../GoogleEarth/GEPolygon";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { GeometryBuilder } from "./GeometryBuilder";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";

export class GEGeometryBuilder extends GeometryBuilder {
	private mapComponent: GoogleEarthMapComponent;

	constructor(mapComponent: GoogleEarthMapComponent) {
		super();
		this.mapComponent = mapComponent;
	}

	public buildLayer(): ILayer {
		return new GELayer(this.mapComponent);
	}

	public buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point {
		return new GEPoint(this.mapComponent, coordinate, design);
	}

	public buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line {
		return new GELine(this.mapComponent, coordinates, design);
	}

	public buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow {
		return new GEArrow(this.mapComponent, coordinates, design);
	}

	public buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon {
		return new GEPolygon(this.mapComponent, coordinates, design);
	}

	public buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine {
		return new DoubleLine(this.mapComponent, coordinates, design);
	}

	public buildFromNativeEntity(entity: any): Geometry {
		throw("not implemented");
	}
}
