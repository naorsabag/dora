import { GoogleMapsMapComponent } from "../../Components/GoogleMapsMapComponent";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { GMLayer } from "../../Layers/GMLayer";
import { ILayer } from "../../Layers/ILayer";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { Geometry } from "../Geometry";
import { GMArrow } from "../GoogleMaps/GMArrow";
import { GMLine } from "../GoogleMaps/GMLine";
import { GMPoint } from "../GoogleMaps/GMPoint";
import { GMPolygon } from "../GoogleMaps/GMPolygon";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { GeometryBuilder } from "./GeometryBuilder";

export class GMGeometryBuilder extends GeometryBuilder {
	private mapComponent: GoogleMapsMapComponent;

	constructor(mapComponent: GoogleMapsMapComponent) {
		super();
		this.mapComponent = mapComponent;
	}

	public buildLayer(): ILayer {
		return new GMLayer(this.mapComponent);
	}

	public buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point {
		return new GMPoint(this.mapComponent, coordinate, design);
	}

	public buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line {
		return new GMLine(this.mapComponent, coordinates, design);
	}

	public buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow {
		return new GMArrow(this.mapComponent, coordinates, design);
	}

	public buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon {
		return new GMPolygon(this.mapComponent, coordinates, design);
	}

	public buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine {
		return new DoubleLine(this.mapComponent, coordinates, design);
	}

	public buildFromNativeEntity(entity: any): Geometry {
		throw ("not implemented");
	}
}
