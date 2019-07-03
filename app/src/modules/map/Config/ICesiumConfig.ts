import { IMapConfig } from "./IMapConfig";
import { ICesiumTerrainProvider } from "./ICesiumTerrainProvider";

export interface ICesiumConfig extends IMapConfig {
	selectionIndicator?: boolean;
	skyAtmosphere?: boolean;
	skyBox?: boolean;
	creditContainer?: string;
	baseLayerPicker?: boolean;
	navigationHelpButton?: boolean;
	fullscreenButton?: boolean;
	homeButton?: boolean;
	sceneModePicker?: boolean;
	geocoder?: boolean;
	infoBox?: boolean;
	timeline?: boolean;
	animation?: boolean;
	baseLayers?: any;
	terrainProvider?: ICesiumTerrainProvider;
	is2D?: boolean;
	resolution?: number;
	onRenderError?: () => void;
}