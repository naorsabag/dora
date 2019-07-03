import { KMLGeometryCollection } from "../KMLGeometryCollection";
import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { IKMLGeometryCollection } from "../IKMLGeometryCollection";
import { CesiumHoverService } from "./CesiumHoverService";

export class CesiumKMLGeometryCollection extends KMLGeometryCollection implements IKMLGeometryCollection {

	private hoverService: CesiumHoverService;

	constructor(protected kmlDataSources: any[],
				protected mapComponent: CesiumMapComponent,
				protected timelineOn?: boolean, hover?: boolean) {
		super(kmlDataSources, mapComponent);

		this.id = this.kmlDataSources[0].entities.id;

		if (hover) {
			this.hoverService = new CesiumHoverService(mapComponent);
			this.hoverService.toggleHover(true, this.kmlDataSources[0]);
		}
	}

	public setVisibility(val: boolean): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (val && !this.visibility) {

				if (this.timelineOn) {
					this.mapComponent.toggleTimeline(true);
				}

				let promiseArr = [];
				for (let datasource of this.kmlDataSources) {
					promiseArr.push(this.mapComponent.nativeMapInstance.dataSources.add(datasource));
				}

				//wait for all dataSource to be added
				Promise.all(promiseArr).then(() => {
					this.hoverService && this.hoverService.toggleHover(true, this.kmlDataSources[0]);
					this.mapComponent.nativeMapInstance.scene.requestRender();
					this.visibility = true;
					resolve();
				});
			}
			else if (!val && this.visibility) {
				this.hoverService && this.hoverService.toggleHover(false, this.kmlDataSources[0]);

				for (let datasource of this.kmlDataSources) {
					this.mapComponent.nativeMapInstance.dataSources.remove(datasource);
				}

				if (this.timelineOn) {
					this.mapComponent.toggleTimeline(false);
				}

				this.mapComponent.nativeMapInstance.scene.requestRender();
				this.visibility = false;
				resolve();
			}
			else {
				resolve();
			}
		});
	}

	public focus(val: number): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.mapComponent.nativeMapInstance.flyTo(this.kmlDataSources).then(() => {
				resolve(true);
			});
		});
	}
}