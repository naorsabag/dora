import { GoogleMapsMapComponent } from "../../app/src/modules/map/Components/GoogleMapsMapComponent";
import { Application } from "./Application";
import { IMapConfig } from "../../app/src/modules/map/Config/IMapConfig";

let config: IMapConfig = {
	mapDivId: "map"
};

export class GMApplication extends Application {
	constructor() {
		super(new GoogleMapsMapComponent(config));
	}
}