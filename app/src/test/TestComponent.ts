import { MapComponent } from "../modules/map/Components/MapComponent";

export abstract class TestComponent {

	public abstract get mapComponent(): MapComponent;

	public abstract initMapComponent(): Promise<void>;
}