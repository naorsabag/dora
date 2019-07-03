import { XXXLayer } from "./XXXLayer";
import { XXXLayerType } from "./XXXLayerType";
import { GoogleEarthMapComponent } from "../../../GoogleEarthMapComponent";
import { NetworkLink } from "./NetworkLink";

export class GEXXXLayer extends XXXLayer {
	protected mapComponent: GoogleEarthMapComponent;
	public parentFolder: GEXXXLayer;
	public layerIds: string;
	private geFeature: google.earth.KmlFeature = null;
	private networkLink: NetworkLink = null;
	public get fromNetworkLink(): boolean {
		return this.networkLink !== null;
	}

	constructor(mapComponent: GoogleEarthMapComponent, originalId: string, text: string, type: XXXLayerType, geFeature: google.earth.KmlFeature = null, parentFolder?: GEXXXLayer, htmlClass?: string, tooltip?: string) {
		super(mapComponent, originalId, text, type, parentFolder, htmlClass, tooltip);

		this.geFeature = geFeature;
	}

	public getChildren(): GEXXXLayer[] {
		return <GEXXXLayer[]>super.getChildren();
	}

	public toggle(state: boolean) {
		if (this.type === XXXLayerType.Layer && this.active !== state) {
			this.active = state;
			if (this.geFeature !== null) {
				this.geFeature.setVisibility(state);

				//in GE, all parent folders' geFeature is a KmlFolder, and must be displayed for the children to be visible
				//when a layer is toggled on, we iterate through the parents and activate them on until an already activated parent is reached
				//when a layer is toggled off, we iterate through the parents and deactivate them if they contain no active children (until we find an active child)
				let parent = this.parentFolder;
				let con = true;
				while (parent !== null && con) {
					if (state) {
						if (!parent.active) {
							parent.active = true;
							if (parent.geFeature !== null) {
								parent.geFeature.setVisibility(true);
							}
						}
						else {
							con = false;
						}
					}
					else {
						let foundActiveChild = false;
						for (let i = 0; i < parent.getChildren().length && !foundActiveChild; i++) {
							if (parent.getChildren()[i].active) {
								foundActiveChild = true;
							}
						}

						if (!foundActiveChild) {
							parent.active = false;
							if (parent.geFeature !== null) {
								parent.geFeature.setVisibility(false);
							}
						}
						else {
							con = false;
						}
					}
					parent = parent.parentFolder;
				}
			}

		}
	}

	public getNetworkLink(): NetworkLink {
		return this.networkLink;
	}

	public setNetworkLink(networkLink: NetworkLink, layerIds: string): void {
		this.networkLink = networkLink;
		this.layerIds = layerIds;
		this.networkLink.addLayer(this);
	}
}