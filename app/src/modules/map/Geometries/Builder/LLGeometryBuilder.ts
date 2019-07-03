
import { LeafletMapComponent } from "../../Components/LeafletMapComponent";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { Arrow } from "../Arrow";
import { Coordinate } from "../Coordinate";
import { DoubleLine } from "../DoubleLine";
import { LLArrow } from "../Leaflet/LLArrow";
import { LLLine } from "../Leaflet/LLLine";
import { LLPoint } from "../Leaflet/LLPoint";
import { LLPolygon } from "../Leaflet/LLPolygon";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { GeometryBuilder } from "./GeometryBuilder";
import { ILayer } from "../../Layers/ILayer";
import { LLLayer } from "../../Layers/LLLayer";
import { Geometry } from "../Geometry";

export class LLGeometryBuilder extends GeometryBuilder {
	private mapComponent: LeafletMapComponent;

	constructor(mapComponent: LeafletMapComponent) {
		super();
		this.mapComponent = mapComponent;
	}

	public buildLayer(): ILayer {
		return new LLLayer(this.mapComponent);
	}

	public buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point {
		return new LLPoint(this.mapComponent, coordinate, design);
	}

	public buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line {
		return new LLLine(this.mapComponent, coordinates, design);
	}

	public buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow {
		return new LLArrow(this.mapComponent, coordinates, design);
	}

	public buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon {
		return new LLPolygon(this.mapComponent, coordinates, design);
	}

	public buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine {
		return new DoubleLine(this.mapComponent, coordinates, design);
	}

	public buildFromNativeEntity(entity: any): Geometry {
		throw "not implemented";
	}
}
