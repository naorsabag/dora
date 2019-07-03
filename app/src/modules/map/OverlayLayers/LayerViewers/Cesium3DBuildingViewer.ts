import { IBaseLayerViewer } from "./IBaseLayerViewer";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IKMLGeometryCollection } from "../../Geometries/IKMLGeometryCollection";

export class Cesium3DBuildingViewer implements IBaseLayerViewer {

	private readonly BUILDINGS_3D_KML_PATH: string = "LINK";
	private readonly BUILDINGS_2D_KML_PATH: string = "LINK";
	private KMLGeometryCollection: IKMLGeometryCollection;
	private BUILDINGS_KML_PATH: string;
	private is2D: boolean;

	constructor(private mapComponent: CesiumMapComponent) {
		this.is2D = this.mapComponent.getIs2D();
	}

	public async addToMap(onError: () => void): Promise<void> {

		let is2D: boolean = this.mapComponent.getIs2D();
		if (!this.KMLGeometryCollection || this.is2D !== is2D) {
			this.is2D = is2D;
			this.BUILDINGS_KML_PATH = this.is2D ? this.BUILDINGS_2D_KML_PATH : this.BUILDINGS_3D_KML_PATH;

			try {

				this.KMLGeometryCollection = await this.mapComponent.loadKML(this.BUILDINGS_KML_PATH, false);
				} catch (e) {
				await this.remove();
				delete this.KMLGeometryCollection;
				throw e;
			}
		} else {
			await this.KMLGeometryCollection.setVisibility(true);
			return;
		}
	}

	public async remove(): Promise<void> {
		if (this.KMLGeometryCollection) {
			await this.KMLGeometryCollection.setVisibility(false);
		}
	}
}