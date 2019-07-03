import { MapUtils } from "../MapUtils/MapUtils";
import { IGeometryDesign } from "../GeometryDesign/Interfaces/IGeometryDesign";
import { isArray } from "util";
import * as wellknown from "wellknown";
import * as GeoJSON from "@turf/helpers/lib/geojson";

export class WktObject {
	id: string;
	wkt: string;
	kmlLineColor: string = "ff0000ff"; // Red
	kmlLineOpacity: string = "ff"; // = 1
	kmlFillColor: string = "0000ff";
	kmlFillOpacity: string = "4f"; // = 0.31;
	kmlIconUrl: string;
	iconSize: { width: number, height: number } = { width: 30, height: 30 };
	lineWidth: number = 4;
	fillColor: string;
	fillOpacity: number = 0;
	iconUrl: string = require("leaflet/dist/images/marker-icon.png");
	lineColor: string = "ff0000ff"; // Red
	lineOpacity: number = 1;

	ICON_SCALE_MULTI = 0.7;

	constructor(id: string, wkt: string, image: string, design: IGeometryDesign) {
		this.id = id;
		this.wkt = wkt;
		this.iconUrl = (image ? encodeURI(image) : `<![CDATA[${this.iconUrl}]]>`);
		this.kmlIconUrl = this.iconUrl;

		if (design) {
			this.lineWidth = design.line.width || this.lineWidth;
			this.lineColor = design.line.color || this.lineColor;
			this.lineOpacity = design.line.opacity || this.lineOpacity;

			this.fillOpacity = design.fill.opacity || this.fillOpacity;
			this.fillColor = design.fill.color || this.fillColor;

			if (isArray(design.icons) && design.icons.length > 0) {
				const image = design.icons[0].image;
				if (image) {
					this.iconUrl = image.url || this.iconUrl;

					if (image.size && image.size.width && image.size.height) {
						this.iconSize = <{ width: number, height: number }>image.size || this.iconSize;
					}
				}
			}


			this.kmlFillOpacity = this.numberToHex(this.fillOpacity);
			this.kmlLineOpacity = this.numberToHex(this.lineOpacity);

			this.lineColor = this.lineColor.replace("#", "");
			this.kmlLineColor = this.kmlLineOpacity + this.lineColor.slice(4, 6) + this.lineColor.slice(2, 4) + this.lineColor.slice(0, 2);

			if (this.fillColor) {
				this.fillColor = this.fillColor.replace("#", "");
				this.kmlFillColor = this.kmlFillOpacity + this.fillColor.slice(4, 6) + this.fillColor.slice(2, 4) + this.fillColor.slice(0, 2);
			}
		} else {
			this.kmlLineColor = this.lineColor;
		}

		this.iconSize.width = this.ICON_SCALE_MULTI * this.iconSize.width;
		this.iconSize.height = this.ICON_SCALE_MULTI * this.iconSize.height;
	}

	private numberToHex(num: number): string {
		let hex: string = Math.round(num * 255).toString(16);
		if (hex.length === 1) {
			hex = "0" + hex;
		}
		return hex;
	}
}

export class WktToKmlConverter {

	public static convertWktLayerToKml(wktLayer: Array<WktObject>): string {
		let kml = `<?xml version="1.0" encoding="UTF-8"?>`;
		kml += `<kml xmlns="LINK">`;
		this.splitWktLayerToKmlPlacemarkByIcon(wktLayer).reverse().forEach(wktItems => {
			kml += `<Placemark id="${wktItems[0].id}">`;
			kml += `<Style>`;
			kml += `<IconStyle><scale>1.0</scale>` +
				`<Icon><href>${wktItems[0].kmlIconUrl}</href></Icon></IconStyle>` +
				`<LineStyle><color>${wktItems[0].kmlLineColor}</color><opacity>${wktItems[0].kmlLineOpacity}</opacity>` +
				`<width>${wktItems[0].lineWidth}</width></LineStyle>` +
				`<PolyStyle><color>${wktItems[0].kmlFillColor}</color></PolyStyle>`;
			kml += `</Style>`;
			kml += "<MultiGeometry>";
			wktItems.map(wktObject => kml += this.wktToKmlGeometry(wktObject.wkt));
			kml += "</MultiGeometry>";
			kml += "</Placemark>";
		});
		kml += "</kml>";
		return kml;
	}

	public static splitWktLayerToKmlPlacemarkByIcon(wktLayer: Array<WktObject>): Array<Array<WktObject>> {
		let splitedLayer: WktObject[][] = [];
		let styleTypes = [];

		wktLayer.forEach(wktItem => {
			let styleString = this.styleToString(wktItem);
			let index = styleTypes.indexOf(styleString);
			if (index === -1) {
				styleTypes.push(styleString);
				splitedLayer.push([]);
				index = splitedLayer.length - 1;
			}
			splitedLayer[index].push(wktItem);
		});

		return splitedLayer;
	}

	public static wktToKmlGeometry(wkt: string): string {
		let wktGeometry = wkt.split("(");
		let kml = "";
		switch (wktGeometry[0]) {
			case "POINT":
			case "POINT ":
				kml += `<Point><coordinates>${this.reverseXY(wktGeometry[1].replace(")", ""))}</coordinates></Point>`;
				break;
			case "POLYGON ":
			case "POLYGON":
				kml += `<Polygon><outerBoundaryIs><LinearRing><coordinates>${this.reverseXY(wktGeometry[2].replace("))", "").replace("(", ""))}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
				break;
			case "LINESTRING ":
			case "LINESTRING":
				kml += `<LineString><coordinates>${this.reverseXY(wktGeometry[1].replace(")", ""))}</coordinates></LineString>`;
				break;
			case "MULTILINESTRING":
			case "MULTILINESTRING ":
				try {
					let geoJstsMultiLine: GeoJSON.MultiLineString = wellknown.parse(wkt);
					kml += "<MultiGeometry>";
					for (let i = 0; i < geoJstsMultiLine.coordinates.length; i++) {
						kml += this.wktToKmlGeometry(wellknown.stringify({type: "LineString" , coordinates: geoJstsMultiLine[i]}));
					}
					kml += "</MultiGeometry>";
				} catch (e) {
				}
				break;
			case "GEOMETRYCOLLECTION":
			case "GEOMETRYCOLLECTION ":
				try {
					let geoJstsGeomCollection: GeoJSON.MultiPolygon = wellknown.parse(wkt);
					kml += "<MultiGeometry>";
					for (let i = 0; i < geoJstsGeomCollection.coordinates.length; i++) {
						kml += this.wktToKmlGeometry(wellknown.stringify({type: "Polygon" , coordinates: geoJstsGeomCollection[i]}));
					}
					kml += "</MultiGeometry>";
				} catch (e) {
				}
				break;
		}
		return kml;
	}

	private static styleToString(wktObj: WktObject): string {
		return JSON.stringify([wktObj.fillColor, wktObj.fillOpacity, wktObj.lineColor, wktObj.iconSize, wktObj.iconUrl]);
	}

	private static reverseXY(coord) {
		let rtCoordStr;
		let points = coord.split(",");
		for (let i = 0; i < points.length; i++) {
			let arrYX = points[i].trim().split(" ");
			rtCoordStr = rtCoordStr ? `${rtCoordStr} ${arrYX[0]},${arrYX[1]},0` : `${arrYX[0]},${arrYX[1]},0`;
		}
		return rtCoordStr;
	}
}