import { MapComponent } from "../Components/MapComponent";
import { NetworkLink } from "./NetworkLink";
import { KMLGeometryCollection } from "./KMLGeometryCollection";

export class NetworkLinkKMLGeometryCollection extends KMLGeometryCollection {

	constructor(protected mapComponent: MapComponent,
				protected networkLink: NetworkLink) {
		super([], mapComponent);
		this.id = this.networkLink.getId();
	}

	public async setVisibility (val: boolean): Promise<void> {
		if (val && !this.visibility) {
			await this.networkLink.startListen();
			this.visibility = true;
			return;
		}
		if (!val && this.visibility) {
			await this.networkLink.stopListen();
			this.visibility = false;
			return;
		}
	}

	public focus(val: number): Promise<boolean> {
		return this.networkLink.focus(val);
	}
}