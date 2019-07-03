import { CesiumMapComponent } from "../modules/map/Components/CesiumMapComponent";
import { ICesiumConfig } from "../modules/map/Config/ICesiumConfig";
import { Coordinate } from "../modules/map/Geometries/Coordinate";
import { Geometry } from "../modules/map/Geometries/Geometry";
import { Path } from "../modules/map/Geometries/Path";
import { Point } from "../modules/map/Geometries/Point";
import { TestComponent } from "./TestComponent";
import { HOVER_COLOR_RGBA, POLY_COORDINATES } from "./TestConsts";
import { CesiumEntitiesCreator } from "../modules/map/Geometries/Cesium/CesiumEntities/CesiumEntitiesCreator";
const Cesium = require("cesium/Source/Cesium");

export class CesiumTestComponent extends TestComponent {

	constructor(private config?: ICesiumConfig) {
		super();
	}

	private _mapComponent: CesiumMapComponent;

	get mapComponent(): CesiumMapComponent {
		return this._mapComponent;
	}

	public initMapComponent(): Promise<void> {
		setFixtures(`<div id = "map" style="overflow: hidden; height: 800px; width: 800px;"></div>
							<div id = "cesium-disableCredits" style="display: none"></div>`);
		this.config.mapDivId = "map";
		this.config.creditContainer = "cesium-disableCredits";
		this.config.resolution = 0.5;

		if ((<any>window).__karma__.config.args[0] === "scene2d") {
			this.config.is2D = true;
		}
		else if ((<any>window).__karma__.config.args[0] === "scene3d") {
			this.config.is2D = false;
		}
		this._mapComponent = new CesiumMapComponent(this.config);
		return this._mapComponent.load();
	}

	public expectGeometry(actualGeometry: Geometry, expectedCoordinates?: Coordinate[] | Coordinate[][], expectedId?: string): void {
		expect(actualGeometry).toBeDefined();
		expectedCoordinates = expectedCoordinates || POLY_COORDINATES;
		const expectedCoordinatesMat = this.isMatrix(expectedCoordinates) ? expectedCoordinates : [expectedCoordinates];
		let testCoordinates: Coordinate[][] = this.getGeometryCoordinates(actualGeometry);

		expect(testCoordinates.length).toBe(expectedCoordinatesMat.length);
		testCoordinates.forEach((coordinates: Coordinate[], i: number) => {
			expect(coordinates.length).toBe(expectedCoordinatesMat[i].length);
			coordinates.forEach((coordinate: Coordinate, j: number) => {
				if (!expectedCoordinatesMat[i][j]) {
					throw "coordinate don't exist";
				}
				this.expectCoordinateToBeCloseToCoordinate(coordinate, expectedCoordinatesMat[i][j]);
			});
		});

		if (expectedId) {
			const geometryOnMap = actualGeometry.getGeometryOnMap();
			expect(geometryOnMap.id).toEqual(expectedId);
		}
	}

	public expectCoordinateToBeCloseToCoordinate(firstCordinate: Coordinate, secondCoordinate: Coordinate, precision = 5) {
		expect(firstCordinate.latitude).toBeCloseTo(secondCoordinate.latitude, precision);
		expect(firstCordinate.longitude).toBeCloseTo(secondCoordinate.longitude, precision);
	}

	/**
	 * checks that entity is rendered on specific coordinate, and is ready for tests on it.
	 * @param {Coordinate} coordinate coordinate that the entity supposed to be on
	 * @return {Promise<Cesium.Cartesian2>} promise which resolved with the screen position of the coordinate when the entity is rendered
	 * and rejected when the promise not rendered in two seconds.
	 */
	public entityInCoordinateRendered(coordinate: Coordinate): Promise<Cesium.Cartesian2> {
		return new Promise((resolve, reject) => {
			let index = 0;
			const interval = setInterval(() => {
				const screenPosition = this._mapComponent.utils.toScreenPosFromCoordinate(coordinate);
				const entityPickedContainer = this._mapComponent.nativeMapInstance.scene.pick(screenPosition);
				const entity = entityPickedContainer && entityPickedContainer.id;

				if (entity) {
					clearInterval(interval);
					resolve(screenPosition);
				} else if (index > 40) {
					reject();
				}

				index++;
			}, 50);

		});
	}

	/**
	 * This function adds a random point on the map and remove it immidiately.
	 * Use this function if you want to wait for the map to render in your test after a change (added point, dragged point, etc).
	 * @returns a promise that completes when the map was rendered with the random point.
	 */
	public async waitRenderTime(): Promise<void> {
		const randomCoordinate: Coordinate = new Coordinate(32.5678678, 35.5678678);
		const randomPoint = CesiumEntitiesCreator.createPointEntity(randomCoordinate, {});
		this.mapComponent.nativeMapInstance.entities.add(randomPoint);
		await this.entityInCoordinateRendered(randomCoordinate);
		this.mapComponent.nativeMapInstance.entities.remove(randomPoint);
	}


	/**
	 * check if the points' parameters changed according to hover definition values
	 * @param {any} pointEntity - cesium entity
	 */
	public assertHoverPoint(pointEntity: any): void {
		expect(pointEntity.billboard.width.getValue()).toEqual(52);
		expect(pointEntity.billboard.height.getValue()).toEqual(52);
	}

	/**
	 * check if the line' parameters changed according to hover definition values
	 * @param {any} lineEntity - cesium entity
	 */
	public assertHoverLine(lineEntity: any): void {
		let expectedColor = lineEntity.polyline.material.color.getValue();
		let assertColor = Cesium.Color.fromCssColorString(HOVER_COLOR_RGBA);
		expect(expectedColor.alpha).toBeCloseTo(assertColor.alpha, 8);
		expect(expectedColor.red).toBeCloseTo(assertColor.red, 8);
		expect(expectedColor.green).toBeCloseTo(assertColor.green, 8);
		expect(expectedColor.blue).toBeCloseTo(assertColor.blue, 8);
	}

	/**
	 * check if the points' parameters changed back according to it's original definition values
	 * @param {any} pointEntity - cesium entity
	 */
	public assertHoverOutOfPoint(pointEntity: any): void {
		expect(pointEntity.billboard.width.getValue()).toEqual(32);
		expect(pointEntity.billboard.height.getValue()).toEqual(32);
	}

	private getGeometryCoordinates(geometry: Geometry): Coordinate[][] {
		let coordinatesToReturn: Coordinate[][];
		if (geometry instanceof Path) {
			const pathCoordinates = (<Path>geometry).getCoordinates();
			if (this.isMatrix(pathCoordinates)) {
				coordinatesToReturn = pathCoordinates;
			}
			else {
				coordinatesToReturn = [pathCoordinates];
			}
		}
		else {
			coordinatesToReturn = [[(<Point>geometry).getCoordinate()]];
		}

		return coordinatesToReturn;
	}

	private isMatrix<T>(arrayOrMat: T[] | T[][]): arrayOrMat is T[][] {
		return Array.isArray(arrayOrMat[0]);
	}
}
