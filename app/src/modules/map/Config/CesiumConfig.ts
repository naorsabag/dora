import { MapConfig } from "./MapConfig";
import { ICesiumConfig } from "./ICesiumConfig";
import { ICesiumTerrainProvider } from "./ICesiumTerrainProvider";
import { CesiumTerrainProvider } from "./CesiumTerrainProvider";

export class CesiumConfig extends MapConfig implements ICesiumConfig {

	public selectionIndicator: boolean = false;
	public skyAtmosphere: boolean = false;
	public skyBox: boolean = false;
	public creditContainer: string = null;
	public baseLayerPicker: boolean = false;
	public navigationHelpButton: boolean = false;
	public fullscreenButton: boolean = false;
	public homeButton: boolean = false;
	public sceneModePicker: boolean = false;
	public geocoder: boolean = false;
	public infoBox: boolean = true;
	public timeline: boolean = true;
	public animation: boolean = true;
	public baseLayers: any;
	public is2D: boolean = true;
	public terrainProvider: ICesiumTerrainProvider = new CesiumTerrainProvider();
	public resolution: number = 1.0;
	public onRenderError?: () => void;

	constructor() {
		super();
		this.center.altitude = 500000;
	}

}