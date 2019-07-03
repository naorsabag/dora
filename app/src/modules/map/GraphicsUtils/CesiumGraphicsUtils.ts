const Cesium = require("cesium/Source/Cesium");

import { IGraphicsUtils } from "./IGraphicsUtils";
import { CesiumMapComponent } from "../Components/CesiumMapComponent";
import { Coordinate } from "../Geometries/Coordinate";

export class CesiumGraphicsUtils implements IGraphicsUtils {
	constructor(private mapComponent: CesiumMapComponent) {
	}

	addMarkArrow(coordinate: Coordinate) {
		// let cartesian = Cesium.Cartesian3.fromDegrees(coordinate.longitude, coordinate.latitude);
		// let eventArgs: MapEventArgs= new MapEventArgs(coordinate.longitude,
		//     coordinate.latitude,coordinate.altitude,null,null,null,null,cartesian.x,cartesian.y);
		// let pickedEntity =  this.pickEntity(eventArgs);
		// pickedEntity.point.color =Cesium.Color.RED;
		// pickedEntity.point.pixelSize +=1;
		// pickedEntity.point.outlineWidth +=1;
		return undefined;
	}

	removeMarkArrow(marker: any): void {
		return undefined;
	}

}