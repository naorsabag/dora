/* tslint:disable:no-string-literal */

import {Application} from "./Application";
import {CesiumMapComponent} from "../../app/src/modules/map/Components/CesiumMapComponent";
import {ICesiumConfig} from "../../app/src/modules/map/Config/ICesiumConfig";


let config: ICesiumConfig = {
	mapDivId: "map",
	creditContainer: "cesium-disableCredits",
	onRenderError: () => {
		console.log("!!!!! !!!! !!!!! !!!!!! !!!!! :(");
	}
};

export class CesiumApplication extends Application {
	constructor() {
		super(new CesiumMapComponent(config));
	}
}