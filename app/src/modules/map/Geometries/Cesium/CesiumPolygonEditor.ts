import { CesiumMapComponent } from "../../Components/CesiumMapComponent";
import { CesiumLineEditor } from "./CesiumLineEditor";
import { CesiumEntitiesResolver } from "./CesiumEntities/CesiumEntitiesResolver";
import { Coordinate } from "../Coordinate";
import { CesiumEntitiesCreator } from "./CesiumEntities/CesiumEntitiesCreator";

const Cesium = require("cesium/Source/Cesium");

export class CesiumPolygonEditor {
	private cesiumLineEditor: CesiumLineEditor;

	constructor(private mapComponent: CesiumMapComponent) {
		this.cesiumLineEditor = new CesiumLineEditor(this.mapComponent);
	}

	/**
	 * Starts an edit mode on a cesium polygon.
	 * @param polygonEntity - The cesium polygon to be edited.
	 * @returns A finish function for the edit mode.
	 */
	public enableEditPolygon(polygonEntity: Cesium.Entity): () => void {
		const hierarchy: Cesium.PolygonHierarchy = polygonEntity.polygon.hierarchy.getValue(Cesium.JulianDate.now());

		const coordinatesMat: Coordinate[][] = CesiumEntitiesResolver.buildPolygonCoordinatesFromEntity(polygonEntity.polygon);
		const lines: Cesium.Entity[] = coordinatesMat.map(coordinates => {
				const line = CesiumEntitiesCreator.createPolylineEntity(coordinates, {});
				this.mapComponent.nativeMapInstance.entities.add(line);
				return line;
			}
		);
		const finishLinesEditFn: (() => void)[] = lines.map((line, index) => {
			const leftDownCallback = () => {
				polygonEntity.polygon.hierarchy = new Cesium.CallbackProperty(() => hierarchy, false);
			};
			const dragCallback = (positions: Cesium.Cartesian3[]) => {
				if (index === 0) {
					hierarchy.positions = positions;
				}
				else {
					hierarchy.holes[index - 1].positions = positions;
				}
			};
			const leftUpCallback = () => {
				polygonEntity.polygon.hierarchy = new Cesium.ConstantProperty(hierarchy);
			};
			return this.cesiumLineEditor.enableEditPolyline(line, dragCallback, leftDownCallback, leftUpCallback);
		});

		return () => {
			polygonEntity.polygon.hierarchy = new Cesium.ConstantProperty(hierarchy);
			finishLinesEditFn.forEach(finishFn => finishFn());
			lines.forEach(line => this.mapComponent.nativeMapInstance.entities.remove(line));
		};
	}
}