import { KMLGeometryCollection } from "../KMLGeometryCollection";
import { IKMLGeometryCollection } from "../IKMLGeometryCollection";
import { GoogleEarthMapComponent } from "../../Components/GoogleEarthMapComponent";

export class GEKMLGeometryCollection extends KMLGeometryCollection implements IKMLGeometryCollection {

	constructor(protected kmlObject: google.earth.KmlFeature,
		protected mapComponent: GoogleEarthMapComponent) {

		super([], mapComponent);
		this.id = this.kmlObject.getId();
	}

	public setVisibility = (visibility: boolean) => {

		return new Promise<void>((resolve, reject) => {
			if (this.kmlObject) {

				// check if need to show and is already hidden
				if (visibility && !this.visibility) {
					this.mapComponent.nativeMapInstance.getFeatures().appendChild(this.kmlObject);
				// check if need to hide and is already shown
				} else if (!visibility && this.visibility) {
					this.mapComponent.nativeMapInstance.getFeatures().removeChild(this.kmlObject);
				}
			}

			this.visibility = visibility;
			resolve();
		});
	}

	public focus = () => {

		return new Promise<boolean>((resolve, reject) => {
			if (this.kmlObject.getAbstractView()) {
				this.mapComponent.nativeMapInstance.getView().setAbstractView(this.kmlObject.getAbstractView());
				resolve(true);
			} else {
				resolve(false);
			}
		});
	}
}