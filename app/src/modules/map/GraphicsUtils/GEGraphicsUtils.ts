import { Coordinate } from "../Geometries/Coordinate";
import { IGraphicsUtils } from "./IGraphicsUtils";
import { GoogleEarthMapComponent } from "../Components/GoogleEarthMapComponent";
import { Point } from "../Geometries/Point";

export class GEGraphicsUtils implements IGraphicsUtils {
	constructor(private mapComponent: GoogleEarthMapComponent) {
	}

	addMarkArrow(coordinate: Coordinate) {
		const markArrowDesign = {
			icons: [{
				image: {
					size: {width: 500, height: 500},
					anchor: {x: 0, y: 0}
				}
			}]
		};
		const markPoint: Point = this.mapComponent.geometryBuilder.buildPoint(coordinate, markArrowDesign);
		markPoint.addToMap();
		return markPoint;
	}

	removeMarkArrow(marker: any): void {
		marker.remove();
	}
}