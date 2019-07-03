import { MapComponent } from "../Components/MapComponent";
import { IKMLGeometryCollection } from "./IKMLGeometryCollection";

export abstract class KMLGeometryCollection implements IKMLGeometryCollection {
	protected visibility: boolean = true;
	protected opacity: number = 1;
	protected id: string;

	protected constructor(protected kmlDataSources: any[]
		, protected mapComponent: MapComponent) {
	}

	public getId(): string {
		return this.id;
	}

	public getVisibility(): boolean {
		return this.visibility;
	}

	public abstract setVisibility(val: boolean): Promise<void>;

	public abstract focus(val: number): Promise<boolean>;
}