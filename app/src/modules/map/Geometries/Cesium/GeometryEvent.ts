import { MapEventArgs } from "../../Events/MapEventArgs";

export class GeometryEvent {
	eventType: Cesium.ScreenSpaceEventType;
	listener: (eventArgs?: MapEventArgs) => void;
}