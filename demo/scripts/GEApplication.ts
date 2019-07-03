import { GoogleEarthMapComponent } from "../../app/src/modules/map/Components/GoogleEarthMapComponent";
import { Application } from "./Application";
import { IMapConfig } from "../../app/src/modules/map/Config/IMapConfig";

let config: IMapConfig = {
	mapDivId: "map"
};

export class GEApplication extends Application {
	constructor() {
		super(new GoogleEarthMapComponent(config));
	}
}