import { MapEventArgs } from "../../Events/MapEventArgs";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";

const Cesium = require("cesium/Source/Cesium");

/**
 * change entities color when mouse hover them.
 * only change billboard and polylines entities of a given datasource.
 */
export class CesiumHoverService {

	private static currentEntity: Cesium.Entity;
	private static toggleCount: number = 0;
	private hoverListener: (eventArgs: MapEventArgs) => void;
	private readonly HOVER_COLOR: string = "rgba(255,2,3,1)";
	private readonly ORIGINAL_DESIGN_PROPERTY_NAME = "original-design";
	constructor(private mapComponent: CesiumMapComponent) {

	}

	/**
	 * check if this service is working for some other datasources
	 * @returns {boolean} true if the service is on false otherwise
	 */
	public static isHoverOn(): boolean {
		return !!CesiumHoverService.toggleCount;
	}


	/**
	 * toggle this service on or off on a given dataSource
	 * @param {boolean} toggle - shut the service on or off
	 * @param {Cesium.DataSource} dataSources - the dataSource on which the hover will be preformed
	 * @returns {void}
	 */
	public toggleHover(toggle: boolean, dataSources: Cesium.DataSource): void {

		if (!toggle) {
			this.inverseHoverDesign(dataSources);

			if (!CesiumHoverService.toggleCount) {
				return;
			}

			--CesiumHoverService.toggleCount;

			if (!CesiumHoverService.toggleCount) {
				this.mapComponent.off("mousemove", this.hoverListener);
				CesiumHoverService.currentEntity = null;
			}
			return;
		}

		this.setHoverDesign(dataSources);

		!CesiumHoverService.toggleCount && this.initHoverListener();
		++CesiumHoverService.toggleCount;
	}

	private initHoverListener(): void {
		this.hoverListener = (eventArgs: MapEventArgs) => {
			let pickedObject: { id: Cesium.Entity } = this.mapComponent.nativeMapInstance.scene.pick(
				new Cesium.Cartesian2(eventArgs.endPosX, eventArgs.endPosY));
			CesiumHoverService.currentEntity = pickedObject && pickedObject.id;
			this.mapComponent.nativeMapInstance.scene.requestRender();
		};

		this.mapComponent.on("mousemove", this.hoverListener);
	}

	/**
	 * change the relevant properties of each entity to be dynamic and transform according to the mouse position.
	 * save the original properties value in a propertyBag inside the entity itself.
	 */
	private setHoverDesign(dataSource: any): void {
		for (let entity of dataSource.entities.values) {

			if (entity.billboard) {
				this.saveOriginalDesignOnEntity(entity, {
					//color: entity.billboard.color.getValue().clone(),
					width: entity.billboard.width.getValue(),
					height: entity.billboard.height.getValue()
				});

				// entity.billboard.color = this.getHoverColorProperty(dataSource, entity, entity.billboard);
				entity.billboard.width =
					this.getHoverCallbackProperty(dataSource, entity,
						entity.billboard.width.getValue(), entity.billboard.width.getValue() + 20);
				entity.billboard.height =
					this.getHoverCallbackProperty(dataSource, entity,
						entity.billboard.height.getValue(), entity.billboard.height.getValue() + 20);
			}

			if (entity.polyline && entity.polyline.material) {
				this.saveOriginalDesignOnEntity(entity, {
					color: entity.polyline.material.color.getValue().clone(),
				});
				entity.polyline.material =
					new Cesium.ColorMaterialProperty(this.getHoverColorProperty(dataSource, entity, entity.polyline.material));
			}
		}
	}

	private inverseHoverDesign(kmlDataSources: any): void {
		for (let entity of kmlDataSources.entities.values) {

			if (!entity.properties || !entity.properties[this.ORIGINAL_DESIGN_PROPERTY_NAME]) {
				continue;
			}

			if (entity.billboard) {
				//entity.billboard.color = new Cesium.ConstantProperty(entity.properties["originalDesign"].getValue().color);
				entity.billboard.width = new Cesium.ConstantProperty(
					entity.properties[this.ORIGINAL_DESIGN_PROPERTY_NAME].getValue().width);
				entity.billboard.height = new Cesium.ConstantProperty(
					entity.properties[this.ORIGINAL_DESIGN_PROPERTY_NAME].getValue().height);
			}

			if (entity.polyline && entity.polyline.material) {
				entity.polyline.material =
					new Cesium.ColorMaterialProperty(new Cesium.ConstantProperty(
						entity.properties[this.ORIGINAL_DESIGN_PROPERTY_NAME].getValue().color));
			}
		}
	}

	private getHoverColorProperty(kmlDataSources: any, entity: any, entityDesignProperty: any) {
		let originalColor = entityDesignProperty.color.getValue().clone();
		let newColor = new Cesium.Color.fromCssColorString(this.HOVER_COLOR);
		return this.getHoverCallbackProperty(kmlDataSources, entity, originalColor, newColor);
	}

	private getHoverCallbackProperty(kmlDataSources, entity, originalProp, newProp) {
		let children: any[] = (!entity.parent || entity.parent.id === kmlDataSources.entities.values[0].id) ?
			[entity] : entity.parent._children;

		return new Cesium.CallbackProperty(() => {
			if (CesiumHoverService.currentEntity) {

				for (let child of children) {
					if (child.id === CesiumHoverService.currentEntity.id) {
						return newProp;
					}
				}
				return originalProp;
			}
			else {
				return originalProp;
			}
		}, false);
	}

	private saveOriginalDesignOnEntity(entity: Cesium.Entity, designObj: any) {
		if (!entity.properties) {
			entity.properties = new Cesium.PropertyBag();
		}
		if (entity.properties.hasProperty(this.ORIGINAL_DESIGN_PROPERTY_NAME)) {
			entity.properties.removeProperty(this.ORIGINAL_DESIGN_PROPERTY_NAME);
		}
		entity.properties.addProperty(this.ORIGINAL_DESIGN_PROPERTY_NAME, designObj);
	}

	// private inverseColor(color: any): any {
	// 	let newColor = Cesium.Color.subtract(Cesium.Color.WHITE, color, new Cesium.Color());
	// 	newColor.alpha = 1;
	// 	return newColor;
	// }
}