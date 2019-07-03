import { CesiumMapComponent } from "../Components/CesiumMapComponent";

export interface ICesiumImageryProvider {

	options: any;

	initProvider(mapComponent?: CesiumMapComponent): Promise<any>;
}