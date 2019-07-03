import { IMapComponent } from "../Components/IMapComponent";
import { GeometryDesign } from "../GeometryDesign/GeometryDesign";
import { MapEventArgs } from "../Events/MapEventArgs";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { Coordinate } from "./Coordinate";
import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { ILayer } from "../Layers/ILayer";

export abstract class Path extends Geometry {
	protected baseCoordinates: Coordinate[] | Coordinate[][];
	protected transformedCoordinates: Coordinate[] | Coordinate[][];
	protected iconPoints: Point[] = [];
	private removeIconEvents: Function[] = [];
	private eventsMap: any = {}; //TODO: map
	protected abstract generateIconsCoordinates(): void;

	protected abstract calculateBalloonOpenPosition(): Coordinate;

	constructor(mapComponent: IMapComponent, coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign, id?: string) {
		super(mapComponent, design, id);

		this.baseCoordinates = coordinates;
	}

	public addToMap(): void {
		super.addToMap();

		if (Array.isArray(this.design.icons)) {
			this.iconPoints.forEach((iconPoint) => {
				iconPoint.addToMap();
			});
		}

	}

	public remove(): void {
		super.remove();
		this.iconPoints.forEach((iconPoint) => {
			iconPoint.remove();
		});
	}

	public addToLayer(layer: ILayer): void {
		super.addToLayer(layer);

		this.iconPoints.forEach((iconPoint) => {
			iconPoint.addToLayer(layer);
		});
	}

	public removeFromLayer(layer: ILayer): void {
		super.removeFromLayer(layer);
		this.iconPoints.forEach((iconPoint) => {
			iconPoint.removeFromLayer(layer);
		});
	}

	public getCoordinates() : Coordinate[] | Coordinate[][] {
		return this.baseCoordinates as Coordinate[];
	}

	public setCoordinates(coordinates: Coordinate[] | Coordinate[][]) {
		this.baseCoordinates = coordinates;
		this.generateGeometryOnMap();
	}

	public on(event: string, listener: (eventArgs: MapEventArgs) => void): () => void {
		super.on(event, listener);
		//TODO: case of event attach twice
		if (this.eventsMap[event]) {
			return;
		}
		this.eventsMap[event] = listener;
		this.removeIconEvents = [];
		this.iconPoints.forEach(iconPoint => {
			iconPoint.on(event, listener);
			this.removeIconEvents.push(() => iconPoint.off(event, listener));
		});
	}

	public setIconsOnPathDesign(design: IGeometryDesign): void {
		//Only apply design of icons when this value is set
		if (design.icons) {
			/*If the number of the icons is equal to before, we only change the icons designs,
			  otherwise we create new icons objects and set them on map*/
			if (design.icons.length === this.iconPoints.length) {
				for (let i = 0; i < design.icons.length; i++) {
					this.iconPoints[i].setDesign({ icons: [design.icons[i]] });
				}
				this.generateIconsCoordinates();
			}
			else {
				this.cleanIconPoints();
				const newIconPoints: Point[] = [];
				design.icons.forEach((icon) => {
					newIconPoints.push(this.mapComponent.geometryBuilder.buildPoint(undefined, new GeometryDesign({ icons: [icon] })));
				});
				this.iconPoints = newIconPoints;
				this.generateIconsCoordinates();
				newIconPoints.forEach(iconPoint => {
					iconPoint.addToMap();
				});
				this.setEventsForIconPoints(newIconPoints);
			}
		}
	}

	public setLabel(text: string): void {
		if (this.iconPoints.length > 0) {
			this.iconPoints[0].setLabel(text);
		}
	}

	private cleanIconPoints() {
		//TODO: check removal
		for (let i = 0; i < this.iconPoints.length; i++) {
			this.iconPoints[i].remove();
		}
		this.iconPoints = [];
		this.removeIconEvents.forEach(callback => callback());
		this.removeIconEvents = [];
	}

	private setEventsForIconPoints(newPoints: Point[]) {
		newPoints.forEach(newPoint => {
			//for each of the events
			const that = this;
			Object.keys(this.eventsMap).forEach((event) => {
				newPoint.on(event, that.eventsMap[event]);
				that.removeIconEvents.push(() => newPoint.off(event, that.eventsMap[event]));
			});
		});
		this.iconPoints = newPoints;
	}

	protected getIconsCoordinates(): Coordinate[] {
		if (!this.iconPoints.every(iconPoint => iconPoint.getCoordinate() !== undefined)) {
			this.generateIconsCoordinates();
		}

		return this.iconPoints.map(iconPoint => iconPoint.getCoordinate());
	}

	protected addIconToMap(): void {
		if (this.addedToMap) {
			this.iconPoints.forEach(iconPoint => {
				iconPoint.addToMap();
			});
		}
		this.addedToLayers.forEach(layer => {
			this.iconPoints.forEach(iconPoint => {
				layer.addGeometry(iconPoint);
			});
		});
	}
}