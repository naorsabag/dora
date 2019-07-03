import { CesiumTestComponent } from "../../../../test/CesiumTestComponent";
import { DEFAULT_GEOMETRY_DESIGN, POLY_COORDINATES } from "../../../../test/TestConsts";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { CesiumPoint } from "../Cesium/CesiumPoint";
import { Coordinate } from "../Coordinate";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";

describe("Cesium geometry drawing", () => {
	let cesiumTestComponent: CesiumTestComponent;
	beforeEach((done) => {
		cesiumTestComponent = new CesiumTestComponent({mapDivId: "map"});
		cesiumTestComponent.initMapComponent().then(() => {
			spyOn(cesiumTestComponent.mapComponent, "on")
				.and.callFake((event: string, listener: (eventArgs: any) => void) => {
				switch (event) {
					case "click": {
						[...POLY_COORDINATES, POLY_COORDINATES[POLY_COORDINATES.length - 1]].forEach((coordinate: Coordinate) => {
							listener(new MapEventArgs(coordinate.longitude,
								coordinate.latitude, coordinate.altitude,
								null, true, null, null,
								0, 0, null, null, 0, 0));
						});
					}
					case "mousedown": {
						listener(new MapEventArgs(POLY_COORDINATES[0].longitude,
							POLY_COORDINATES[0].latitude, POLY_COORDINATES[0].altitude,
							null, null, null, null,
							0, 0, null, null, 0, 0));
						break;
					}
					case "mousemove":
					case "mouseup": {
						listener(new MapEventArgs(POLY_COORDINATES[2].longitude,
							POLY_COORDINATES[2].latitude, POLY_COORDINATES[2].altitude,
							null, null, null, null,
							0, 0, null, null, 0, 0));
						break;
					}
					default:
						break;
				}
			});
			done();
		});

		const lastCoordId: string = "lastCoordinateID";
		spyOn(CesiumPoint.prototype, "getId").and.returnValue(lastCoordId);
		let pointsIndex = 0;
		spyOn(cesiumTestComponent.mapComponent.utils, "pickNativeEntity").and.callFake((eventArgs: MapEventArgs) => {
			if (pointsIndex === POLY_COORDINATES.length) {
				return { id: lastCoordId };
			}
			pointsIndex++;
		});
	});
	afterEach(() => {
		if (!cesiumTestComponent.mapComponent.nativeMapInstance.isDestroyed()) {
			cesiumTestComponent.mapComponent.nativeMapInstance.destroy();
			cesiumTestComponent = null;
		}
	});


	it("measure total sum", (done) => {
		let callbackCount = 0;
		cesiumTestComponent.mapComponent.geometryDrawing.sampleDistance((total, currentSection) => {
			callbackCount++;
			if (callbackCount === POLY_COORDINATES.length - 1) {
				expect(total).toEqual(315645.85);
				done();
			}
		}, null, null);
	});

	it("measure current section", (done) => {
		let callbackCount = 0;
		let POLY_COORDINATES_LENGTHS = [111195.08, 93255.69, 111195.08, 0];
		cesiumTestComponent.mapComponent.geometryDrawing.sampleDistance((total, currentSection) => {
			expect(currentSection).toEqual(POLY_COORDINATES_LENGTHS[callbackCount]);
			callbackCount++;
			if (callbackCount === POLY_COORDINATES.length - 1) {
				done();
			}
		}, null, null);
	});

	it("draw point", (done) => {
		cesiumTestComponent.mapComponent.geometryDrawing
			.drawPoint(DEFAULT_GEOMETRY_DESIGN).then((point: Point) => {
			point.addToMap();
			cesiumTestComponent.expectGeometry(point, [POLY_COORDINATES[0]]);
			done();
		});
	});

	it("draw line", (done) => {
		cesiumTestComponent.mapComponent.geometryDrawing
			.drawLine(DEFAULT_GEOMETRY_DESIGN).then((line: Line) => {
			cesiumTestComponent.expectGeometry(line);
			done();
		});
	});

	it("draw polygon", (done) => {
		cesiumTestComponent.mapComponent.geometryDrawing
			.drawPolygon(DEFAULT_GEOMETRY_DESIGN).then((poly: Polygon) => {
			expect(poly).toBeDefined();
			cesiumTestComponent.expectGeometry(poly, [...POLY_COORDINATES, POLY_COORDINATES[0]]);
			done();
		});
	});

	it("draw rectangle", (done) => {
		cesiumTestComponent.mapComponent.geometryDrawing
			.drawRectangle(DEFAULT_GEOMETRY_DESIGN).then((poly: Polygon) => {
			expect(poly).toBeDefined();
			cesiumTestComponent.expectGeometry(poly, [...POLY_COORDINATES, POLY_COORDINATES[0]]);
			done();
		});
	});
});
