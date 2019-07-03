import { Layer } from "./Layer";
import { ILayerChild } from "./ILayerChild";
import { CesiumMapComponent } from "../Components/CesiumMapComponent";

const Cesium = require("cesium/Source/Cesium");

export class CesiumLayer extends Layer {
	protected mapComponent: CesiumMapComponent;

	constructor(mapComponent: CesiumMapComponent, private customDataSource?: Cesium.DataSource) {
		super(mapComponent);
	}

	public addGeometry(geometry: ILayerChild): void {
		this.geometries.push(geometry);
		if (this.customDataSource !== undefined) {
			geometry.addToLayer(this);
		}
	}

	public removeGeometry(geometry: ILayerChild): void {
		this.geometries = this.geometries.filter(currGeometry => currGeometry !== geometry);
		if (this.customDataSource !== undefined) {
			geometry.removeFromLayer(this);
		}
	}

	public addEntity(entity): void {
		if (this.customDataSource !== undefined) {
			this.customDataSource.entities.add(entity);
		}
	}

	public removeEntity(entity): void {
		if (this.customDataSource !== undefined) {
			this.customDataSource.entities.remove(entity);
		}
	}

	public show(): void {
		if (this.customDataSource === undefined) {
			this.customDataSource = new Cesium.CustomDataSource("layer");
			this.mapComponent.nativeMapInstance.dataSources.add(this.customDataSource);

			this.geometries.forEach(geometry => {
				geometry.addToLayer(this);
			});

		}
		this.geometries.forEach(geometry => {
			geometry.setVisibility(true);
		});

		this.customDataSource.show = true;
		this.displayed = true;
	}

	public hide(): void {
		if (this.customDataSource !== undefined) {
			this.customDataSource.show = false;
			this.geometries.forEach(geometry => {
				geometry.setVisibility(false);
			});
		}
		this.displayed = false;
	}

	public remove(): void {
		if (this.customDataSource !== undefined) {
			this.mapComponent.nativeMapInstance.dataSources.remove(this.customDataSource);
			this.customDataSource.entities.removeAll();
			this.customDataSource = undefined;
			this.geometries.forEach(geometry => {
				geometry.removeFromLayer(this);
			});
		}
		this.displayed = false;
	}

}