import { IActionToken } from "../../Common/IActionToken";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { Arrow } from "../Arrow";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { DoubleLine } from "../DoubleLine";

export interface IGeometryDrawing {
	drawPoint(design?: IGeometryDesign, token?: IActionToken): Promise<Point>;

	drawLine(design?: IGeometryDesign, token?: IActionToken): Promise<Line>;

	drawArrow(design?: IArrowGeometryDesign, token?: IActionToken): Promise<Arrow>;

	drawPolygon(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon>;

	drawDoubleLine(design?: IDoubleLineGeometryDesign, token?: IActionToken): Promise<DoubleLine>;

	sampleDistance?(onSectionAdded: (total: number, currentSection: number) => void, customDesign?: IGeometryDesign, token?: IActionToken): void;

	drawRectangle(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon>;
}
