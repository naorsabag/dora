import { CesiumApplication } from "./CesiumApplication";
import { LLApplication } from "./LLApplication";
import { Application } from "./Application";
import { GEApplication } from "./GEApplication";
import { GMApplication } from "./GMApplication";
import * as $ from "jquery";

$(document).ready( () => {
	let mapType: string = location.search.split("map=")[1];
	let app: Application;
	switch (mapType) {
		case "leaflet":
			app = new LLApplication();
			break;
		case "google-earth":
			app = new GEApplication();
			break;
		case "google-maps":
			app = new GMApplication();
			break;
		case "cesium":
			app = new CesiumApplication();
			break;
		default:
			alert("!!! !!! !! !!!!, !!! !!!!!! !! ! leaflet");
			console.error("Unsupported map type in the \"map\" get parameter");
			location.search = "?map=leaflet";
			break;
	}
	app.load();
});
