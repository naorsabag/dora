import { GEXXXLayer } from "./GEXXXLayer";
import { GoogleEarthMapComponent } from "../../../GoogleEarthMapComponent";

export class NetworkLink {
	private mapComponent: GoogleEarthMapComponent;
	private layers: GEXXXLayer[] = new Array();
	public kmlUrl: string;
	private kmlNetworkLink: google.earth.KmlNetworkLink;
	private defaultViewFormat: string;

	constructor(mapComponent: GoogleEarthMapComponent, kmlUrl: string) {
		this.mapComponent = mapComponent;
		this.kmlUrl = kmlUrl;
	}

	public addLayer(layer: GEXXXLayer): void {
		if (this.layers.indexOf(layer) < 0) {
			this.layers.push(layer);
		}
	}

	public removeLayer(layer: GEXXXLayer): void {
		let index = this.layers.indexOf(layer);
		if (index >= 0) {
			this.layers.splice(index, 1);
		}
	}

	public addToMap(): Promise<void> {
		return this.fetchKml().then(() => {
			this.defaultViewFormat = this.kmlNetworkLink.getLink().getViewFormat();
			this.mapComponent.nativeMapInstance.getFeatures().appendChild(this.kmlNetworkLink);
		});
	}

	private fetchKml(): Promise<void> {
		let promise = new Promise<void>((resolve, reject) => {
			google.earth.fetchKml(this.mapComponent.nativeMapInstance, this.kmlUrl, (kmlObject) => {
				this.kmlNetworkLink = <google.earth.KmlNetworkLink>kmlObject;
				resolve();
			});
		});
		return promise;
	}

	public updateVisibility(): void {
		let visibleLayers = this.layers.filter(l => l.active).map(l => l.layerIds).join(",");
		let layersToShow = "layers=show:" + visibleLayers;
		let layersToHide = "layers=hide:all";

		let areLayersVisible = (visibleLayers !== "");
		let layers = areLayersVisible ? layersToShow : layersToHide;

		this.kmlNetworkLink.getLink().setViewFormat(this.defaultViewFormat + layers);

		if (areLayersVisible) {
			this.kmlNetworkLink.setVisibility(true);
		}
		else {
			this.kmlNetworkLink.setVisibility(false);
		}
	}
}