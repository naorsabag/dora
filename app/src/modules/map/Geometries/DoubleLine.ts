import { IActionToken } from "../Common/IActionToken";
import { IMapComponent } from "../Components/IMapComponent";
import { DoubleLineGeometryDesign } from "../GeometryDesign/DoubleLineGeometryDesign";
import { IDoubleLineGeometryDesign } from "../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { ILineDesign } from "../GeometryDesign/Interfaces/ILineDesign";
import { MapEventArgs } from "../Events/MapEventArgs";
import { GeometryDesign } from "../GeometryDesign/GeometryDesign";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { Coordinate } from "./Coordinate";
import { IGeometry } from "./IGeometry";
import { Line } from "./Line";
import * as turf from "@turf/helpers";
import { ILayerChild } from "../Layers/ILayerChild";
import { ILayer } from "../Layers/ILayer";
import * as _ from "underscore";
import { Geometry } from "./Geometry";
import { GEOMETRY_TYPES } from "./GeometryTypes";
import * as GeoJSON from "@turf/helpers/lib/geojson";

export class DoubleLine extends Geometry implements IGeometry, ILayerChild {
	protected mapComponent: IMapComponent;
	protected baseCoordinates: Coordinate[];
	protected design: DoubleLineGeometryDesign = new DoubleLineGeometryDesign({});
	private lines: Line[] = [];
	private line2OriginalDesign: GeometryDesign = null;

	constructor(mapComponent: IMapComponent, coordinates: Coordinate[], design?: IDoubleLineGeometryDesign) {
		super(mapComponent, design);
		this.mapComponent = mapComponent;
		this._geometryType = GEOMETRY_TYPES.DOUBLE_LINE;
		this.baseCoordinates = coordinates;

		if (typeof design !== "undefined") {
			this.design.update(design);
		}

		this.lines.push(this.mapComponent.geometryBuilder.buildLine(coordinates, this.design));
		let secondDesign: ILineDesign = this.getSecondDesign();
		this.lines.push(this.mapComponent.geometryBuilder.buildLine(coordinates, {line: secondDesign}));
	}

	private getSecondDesign(): ILineDesign {
		return _.clone(this.design.secondLine);
	}

	public addToMap(): void {
		this.lines.forEach(line => {
			line.addToMap();
		});
	}

	public addToLayer(layer: ILayer) {
		this.lines.forEach(line => {
			line.addToLayer(layer);
		});
	}

	public removeFromLayer(layer: ILayer) {
		this.lines.forEach(line => {
			line.removeFromLayer(layer);
		});
	}

	public getGeoJSON(): GeoJSON.LineString {
		let coords: number[][] = this.baseCoordinates.map(c => c.getGeoJSON());
		return turf.lineString(coords).geometry;
	}

	public getWKT(): string {
		const coordsString = this.baseCoordinates.map(c => c.getWKT()).join(",");
		return `LINESTRING(${coordsString})`;
	}

	public setGeoJSON<T extends GeoJSON.Geometry>(geometry: T | GeoJSON.Feature<T>): void {
		this.lines.forEach(line => {
			line.setGeoJSON(geometry);
		});
	}

	public setWKT(wkt: string): void {
		this.lines.forEach(line => {
			line.setWKT(wkt);
		});
	}

	public edit(token: IActionToken): void {
		this.lines[1].setVisibility(false);
		let passedToken: IActionToken = {};
		this.lines[0].edit(passedToken);

		token.finish = () => {
			passedToken.finish();
			this.lines[1].setCoordinates(this.lines[0].getCoordinates());
			this.lines[1].setVisibility(true);
		};

		token.cancel = () => {
			passedToken.cancel();
			this.lines[1].setVisibility(true);
		};
	}

	public drag(token: IActionToken): void {
		this.lines[1].setVisibility(false);
		let passedToken: IActionToken = {};
		this.lines[0].drag(passedToken);

		token.finish = () => {
			passedToken.finish();
			this.lines[1].setCoordinates(this.lines[0].getCoordinates());
			this.lines[1].setVisibility(true);
		};

		token.cancel = () => {
			passedToken.cancel();
			this.lines[1].setVisibility(true);
		};
	}

	public remove(): void {
		this.lines.forEach(line => {
			line.remove();
		});
	}

	public getCoordinates() {
		return this.baseCoordinates;
	}

	public setCoordinates(coordinates: Coordinate[]) {
		this.baseCoordinates = coordinates;
		this.lines.forEach(line => {
			line.setCoordinates(coordinates);
		});
	}

	public on(event: string, listener: (eventArgs: MapEventArgs) => void): void {
		this.lines[0].on(event, listener);
		this.lines[1].on(event, listener);
	}

	public off(event: string, listener?: (eventArgs: MapEventArgs) => void): void {
		this.lines[0].off(event, listener);
		this.lines[1].off(event, listener);
	}

	public getDesign(): GeometryDesign {
		return this.design;
	}

	public setDesign(design: IGeometryDesign): void {
		//TODO: double line is not supporting icon for now
		this.design.update(design);
		this.lines[0].setDesign(design);
		let secondDesign: ILineDesign = this.getSecondDesign();
		this.lines[1].setDesign({line: secondDesign});
	}

	public getVisibility(): boolean {
		return this.lines[0].getVisibility();
	}

	public setVisibility(state: boolean): void {
		this.lines.forEach(line => {
			line.setVisibility(state);
		});
	}

	public setLabel(text: string): void {
		this.lines[0].setLabel(text);
	}

	public openBalloonHtml(html: string): void {
		this.lines[0].openBalloonHtml(html);
	}

	public async focusView(): Promise<void> {
		await this.lines[0].focusView();
	}

	public mark(): void {
		if (!this.lines[0].isMarked()) {
			this.lines[0].mark();
			this.line2OriginalDesign = _.clone(this.lines[1].getDesign());
			this.lines[1].setDesign({
				line: {
					color: "#5ec4ff"
				}
			});
		}
	}

	public unMark(): void {
		if (this.lines[0].isMarked()) {
			this.lines[0].unMark();
			this.lines[1].setDesign(this.line2OriginalDesign);
		}
	}

	public isMarked(): boolean {
		return this.lines[0].isMarked();
	}

	public addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		throw ("not implemented");
	}

	public addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		throw ("not implemented");
	}

	public addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		throw ("not implemented");
	}

	public addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		throw ("not implemented");
	}

	public addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		throw ("not implemented");
	}

	public addNativeGeometryToLayer(layer: ILayer): void {
		throw ("not implemented");
	}

	public addNativeGeometryToMap(): void {
		throw ("not implemented");
	}

	public dispose(): void {
		throw ("not implemented");
	}

	public generateGeometryOnMap(): void {
		throw ("not implemented");
	}

	public getIconsCoordinates(): Coordinate[] {
		throw ("not implemented");
	}

	public hideLabel(): void {
		throw ("not implemented");
	}

	public removeNativeGeometryFromLayer(layer: ILayer): void {
		throw ("not implemented");
	}

	public removeNativeGeometryFromMap(): void {
		throw ("not implemented");
	}

	public setFillColor(color: string): void {
		throw ("not implemented");
	}

	public setFillOpacity(opacity: number): void {
		throw ("not implemented");
	}

	public setLineOpacity(opacity: number): void {
		throw ("not implemented");
	}

	public setLineColor(color: string): void {
		throw ("not implemented");
	}

	public setLineWidth(width: number): void {
		throw ("not implemented");
	}

	public setId(value: string): void {}
	public  getId(): string {
		return null;
	}
}