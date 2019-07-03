/* tslint:disable:no-console */
import { GeometryDesign } from "../../app/src/modules/map/GeometryDesign/GeometryDesign";
import { Geodesy } from "../../app/src/modules/map/Geodesy/Geodesy";
import { Projection } from "../../app/src/modules/map/Geodesy/Projection";
import { Coordinate } from "../../app/src/modules/map/Geometries/Coordinate";
import { IGeometry } from "../../app/src/modules/map/Geometries/IGeometry";
import "../styles/style.less";
import "../../app/src/Style/Map.less";
import { IMapComponent } from "../../app/src/modules/map/Components/IMapComponent";
import { IActionToken } from "../../app/src/modules/map/Common/IActionToken";
import { DIRECTIONS, PROJECTIONS, UNITS } from "../../app/src/modules/map/Geodesy/Consts";
import * as $ from "jquery";
import { IGeometryDesign } from "../../app/src/modules/map/GeometryDesign/Interfaces/IGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../app/src/modules/map/GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IArrowGeometryDesign } from "../../app/src/modules/map/GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { ArrowType } from "../../app/src/modules/map/GeometryDesign/Enums/ArrowType";
import * as randomGeometry from "@turf/random";
import { ILayer } from "../../app/src/modules/map/Layers/ILayer";
import { IKMLGeometryCollection } from "../../app/src/modules/map/Geometries/IKMLGeometryCollection";
import { RasterLayer } from "../../app/src/modules/map/OverlayLayers/RasterLayer";
import { Dictionary } from "underscore";
import _ = require("underscore");
import { KML_STR } from "../../app/src/test/TestConsts";
import { CesiumMapComponent } from "../../app/src/modules/map/Components/CesiumMapComponent";
import { ViewBounds } from "../../app/src/modules/map/Components/View/ViewBounds";
import { GEOMETRY_TYPES } from "../../app/src/modules/map/Geometries/GeometryTypes";
import { MapEventArgs } from "../../app/src/modules/map/Events/MapEventArgs";
import { Polygon } from "../../app/src/modules/map/Geometries/Polygon";
import { MapUtils } from "../../app/src/modules/map/MapUtils/MapUtils";
import { IconRelativePosition } from "../../app/src/modules/map/GeometryDesign/Enums/IconRelativePosition";
import { LabelRelativePosition } from "../../app/src/modules/map/GeometryDesign/Enums/LabelRelativePosition";
import { MapType } from "@dora/map-types";

export class Application {
	protected selectedGeometry: IGeometry = null;
	protected editActionToken: IActionToken = null;
	protected dragActionToken: IActionToken = null;
	protected measureActionToken: IActionToken = null;
	protected mapComponent: IMapComponent;
	private readonly defaultGeometryDesign: IGeometryDesign;
	private layers: { [key: string]: ILayer } = {};
	private selectedLayers: string[] = ["map"];
	private ctrlIsPressed: boolean = false;

	constructor(mapComponent: IMapComponent) {
		this.mapComponent = mapComponent;
		this.layers.layer1 = this.mapComponent.geometryBuilder.buildLayer();
		this.layers.layer2 = this.mapComponent.geometryBuilder.buildLayer();
		this.defaultGeometryDesign = {};
		this.defaultGeometryDesign.line = {
			color: "#ff0000",
			opacity: 1,
			width: 3
		};
		this.defaultGeometryDesign.fill = {
			color: "#999999",
			opacity: 1
		};
		this.defaultGeometryDesign.icons = [{
			image: {
				url: null,
				size: null,
				anchor: null,
				opacity: 1,
				angle: 0,
				positionPolicy: IconRelativePosition.NorthernPoint,
				visibility: true
			},
			label: {
				text: "point with label",
				opacity: 1,
				visibility: true,
				fontSize: 12,
				positionPolicy: LabelRelativePosition.Bottom
			}
		}];
		//merge with the default design (of the object)
		this.defaultGeometryDesign = new GeometryDesign(this.defaultGeometryDesign);
	}

	public load(): void {
		this.mapComponent.load().then(() => {
			this.mapComponent.controlBuilder.buildXXXTreeControl().addToMap();
		});

		$(".maps-button button").on("click", (event) => {
			location.search = `?map=${event.target.innerText}`;
		});

		$(document).on("keydown", (e) => {
			if (e.which === 17) {
				this.ctrlIsPressed = true;
			}
		});

		$(document).on("keyup", () => {
			this.ctrlIsPressed = false;
		});

		//shape right click options panel
		const optionsPanel = $("#optionsPanel");
		optionsPanel.find("button").on("click", () => {
			optionsPanel.hide();
		});

		$("#startEditBtn").on("click", () => {
			this.editActionToken = {};
			this.selectedGeometry.edit(this.editActionToken);
			$("#editPanel").show();
		});

		$("#startDragBtn").on("click", () => {
			this.dragActionToken = {};
			this.selectedGeometry.drag(this.dragActionToken);
			$("#dragPanel").show();
		});

		$("#checkIfPolygonContainPoint").on("click", () => {
			const longitude: number = +optionsPanel.find(".xCoordinate").val().toString();
			const latitude: number = +optionsPanel.find(".yCoordinate").val().toString();
			let point: Coordinate = new Coordinate(longitude, latitude);

			if (this.selectedGeometry.geometryType === GEOMETRY_TYPES.POLYGON || GEOMETRY_TYPES.RECTANGLE) {
				console.log((<Polygon>this.selectedGeometry).containsPoint(point));
			}
		});

		$("#printGeoJSONBtn").on("click", () => {
			console.info(this.selectedGeometry.getGeoJSON());
		});

		$("#removeShapeBtn").on("click", () => {
			this.selectedGeometry.remove();
		});

		function listenGeometry(eventArgs: MapEventArgs) {
			console.log(eventArgs);
		}

		$("#listenGeometryClickEvent").on("click", () => {
			this.selectedGeometry.on("click", listenGeometry);
		});

		$("#listenGeometryContextMenuEvent").on("click", () => {
			this.selectedGeometry.on("contextmenu", listenGeometry);
		});

		$("#listenGeometryDbClickEvent").on("click", () => {
			this.selectedGeometry.on("dblclick", listenGeometry);
		});

		$("#listenGeometryMouseOverEvent").on("click", () => {
			this.selectedGeometry.on("mouseover", listenGeometry);
		});

		$("#listenGeometryMouseOutEvent").on("click", () => {
			this.selectedGeometry.on("mouseout", listenGeometry);
		});


		$("#toggleShapeBtn").on("click", () => {
			this.selectedGeometry.setVisibility(!this.selectedGeometry.getVisibility());
			event.stopPropagation(); //For this option we don't want to hide the options window
			optionsPanel.show();
		});

		$("#focusViewBtn").on("click", () => {
			this.selectedGeometry.focusView();
		});

		$("#setShapeLabelBtn").on("click", () => {
			this.selectedGeometry.setLabel(optionsPanel.find(".shapeLabel").val().toString());
		});

		$("#getShapeLabelBtn").on("click", () => {
			this.selectedGeometry.getLabel();
			console.log(this.selectedGeometry.getLabel());
		});

		$("#openShapeBalloonBtn").on("click", () => {
			this.selectedGeometry.openBalloonHtml(optionsPanel.find(".shapeLabel").val().toString());
		});

		$("#setJsonDesignBtn").on("click", () => {
			let designJson: IGeometryDesign = JSON.parse(optionsPanel.find(".jsonDesignField").val().toString());
			this.selectedGeometry.setDesign(designJson);
		});

		$("#completeEditBtn").on("click", () => {
			$("#editPanel").hide();
			this.editActionToken.finish();
			this.editActionToken = null;
		});

		$("#cancelEditBtn").on("click", () => {
			$("#editPanel").hide();
			this.editActionToken.cancel();
			this.editActionToken = null;
		});

		$("#completeDragBtn").on("click", () => {
			$("#dragPanel").hide();
			this.dragActionToken.finish();
			this.dragActionToken = null;
		});

		$("#cancelDragBtn").on("click", () => {
			$("#dragPanel").hide();
			this.dragActionToken.cancel();
			this.dragActionToken = null;
		});

		//drawing
		$("#drawPointBtn").on("click", () => {
			this.mapComponent.geometryDrawing.drawPoint(this.defaultGeometryDesign).then(geometry => {
				this.addToMap(geometry);
			});
		});

		$("#drawLineBtn").on("click", () => {
			this.mapComponent.geometryDrawing.drawLine(this.defaultGeometryDesign).then(geometry => {
				this.addToMap(geometry);
			});
		});

		$("#drawArrowBtn").on("click", () => {
			(<IArrowGeometryDesign>this.defaultGeometryDesign).arrow = {
				type: ArrowType.Wide
			};
			this.mapComponent.geometryDrawing.drawArrow(<IArrowGeometryDesign>this.defaultGeometryDesign).then(geometry => {
				this.addToMap(geometry);
			});
		});

		$("#drawPolygonBtn").on("click", () => {
			this.mapComponent.geometryDrawing.drawPolygon(this.defaultGeometryDesign).then(geometry => {
				this.addToMap(geometry);
			});
		});

		$("#drawDoubleLineBtn").on("click", () => {
			this.mapComponent.geometryDrawing.drawDoubleLine(<IDoubleLineGeometryDesign>this.defaultGeometryDesign).then(geometry => {
				this.addToMap(geometry);
			});
		});

		$("#drawRectangleBtn").on("click", () => {
			this.mapComponent.geometryDrawing.drawRectangle(this.defaultGeometryDesign).then(geometry => {
				this.addToMap(geometry);
			}, (e) => {
				console.log(e);
			});
		});

		$("#addImageRaster").on("click", async () => {
			const layer = this.mapComponent.createRasterFromImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAABWAgMAAAHR5fCOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJUExURf9GNZn/bQAAAObEC80AAAADdFJOU4CAACDARxUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIqSURBVDjLpVQ7boQwEJ1FSUMdcog9BRtpeyfyUHAETsEVUrjfhgKfMp6Pv2yUTWIJRo/n+c8A3vsVvAuv3fQrbLZbwSHQ67rCJ2L4Jq+PcAXnVTW8B48eNtODGztwNjw4hAfDM9H1cHuRe3yCzo5jRxItwJmsoYGO7WOU6g9xYh7ZoQtyIZ9BiO8YQyPRstxw7DkrBGB/JvoD6Nn+qNKSX6f+SV4mkVjIrZQz2xk4LsJnleIXJ/9TnHJugsL9hCjdUB9BDEK0gkIkFwjnTEgpgI4QBTUyPN+kUldm+5vERTky2gUR+ZoRZdYin9FcoUX9ZaSKI144zqSWcuDSSH6iueTciUmorsvjKPjKKJg0CclYRSSZf1fdMBhEag5Szgr1sfLchz5W/pr6QEZOfDUiNZMqWKOxQqbqUdMxgKc5I/OMc9WxH9Hw4M2m05zDHRRzx2cK1eeZGJErEY3avpqJJdWajTBSxSn3iCJR5PRi7i33WtCO/5ue6vyPcZpCy6SF6xsm9xWgZuQ7DQPw5CbGZY1EMbMVGvKHiAw2TBcZdW9OiYqMxmWGSqnYZCMTHpVyB/F6smUMRaffUTeB96ZkeEiyo2JWymThyNiC2R5khKIxPDB6/s5cvmF2yb45Xhi8z/jfMXPVhTqAsqdoEmG127kNL+ML/yNelWlqOiA1rpydfN7SvLljZHF6D8kkZjuqxF1wByJtVtaa2m3cao16g/e7e3o8v2e8/wLZZL0rcOgiuAAAAABJRU5ErkJggg==",
				new ViewBounds(31.7472222222222, 31.7392592592593, 34.8263888888889, 34.8355555555556));
			await layer.addToMap();
		});

		$("#measureBtn").on("click", () => {
			this.measureActionToken = {};
			this.mapComponent.geometryDrawing.sampleDistance((total, currentSection) => {
				console.log(total, currentSection);
			}, null, this.measureActionToken);
		});

		$("#measureBtnStop").on("click", () => {
			this.measureActionToken.cancel();
		});

		//layers
		const layerPanel = $("#layersPanel");
		layerPanel.find(".layer .title").on("click", (e) => {
			let layerName: string = $(e.target).closest(".layer").attr("data-name");
			$("#layersPanel").find(".layer").removeClass("selected");
			if (this.ctrlIsPressed) {
				if (this.selectedLayers.indexOf(layerName) < 0) {
					this.selectedLayers.push(layerName);
				}
			}
			else {
				this.selectedLayers = [layerName];
			}
			this.selectedLayers.forEach(layer => {
				$("#layersPanel").find(`.layer[data-name=${layer}]`).addClass("selected");
			});
		});

		layerPanel.find(".layer .layerCb").on("change", (e) => {
			let layerName: string = $(e.target).closest(".layer").attr("data-name");
			if ($(e.target).is(":checked")) {
				this.layers[layerName].show();
			}
			else {
				this.layers[layerName].hide();
			}
		});

		layerPanel.find(".addRandomShapesBtn").on("click", () => {
			let polygons = randomGeometry.randomPolygon(500, {
				bbox: [34.786054, 33.122646, 35.535983, 29.619833],
				num_vertices: 20,
				max_radial_length: 0.05
			});
			polygons.features.forEach(polygon => {
				let geometry: IGeometry = this.mapComponent.geometryBuilder.buildFromGeoJSON(polygon, GEOMETRY_TYPES.POLYGON, this.defaultGeometryDesign);
				this.addToMap(geometry);
			});
		});

		layerPanel.find(".addRandomPointsBtn").on("click", () => {
			let polygons = randomGeometry.randomPoint(500, {
				bbox: [34.786054, 33.122646, 35.535983, 29.619833]
			});
			polygons.features.forEach(polygon => {
				let geometry: IGeometry = this.mapComponent.geometryBuilder.buildFromGeoJSON(polygon, GEOMETRY_TYPES.POINT);
				this.addToMap(geometry);
			});
		});

		//add wkt
		const addWktPanel = $("#addWktPanel");
		addWktPanel.find(".addGeometryBtn").on("click", () => {
			let geometryInput: string = addWktPanel.find(".wktField").val().toString();
			let geometryTypeStr: string = addWktPanel.find("input[name=geometryType]:checked").val().toString();
			if (geometryTypeStr === "auto") {
				geometryTypeStr = undefined;
			}
			let geometryType: GEOMETRY_TYPES = GEOMETRY_TYPES[geometryTypeStr];
			let geometryFormat: string = addWktPanel.find("input[name=geometryFormat]:checked").val().toString();
			let geometry: IGeometry;
			if (geometryFormat === "geojson") {
				let geojsonObj = JSON.parse(geometryInput);
				geometry = this.mapComponent.geometryBuilder.buildFromGeoJSON(geojsonObj, geometryType, this.defaultGeometryDesign);
			}
			else {
				geometry = this.mapComponent.geometryBuilder.buildFromWkt(geometryInput, geometryType, this.defaultGeometryDesign);
			}
			this.addToMap(geometry);
		});

		//control
		const controlMapPanel = $("#controlMapPanel");
		controlMapPanel.find(".printMapBoundsBtn").on("click", () => {
			console.info(this.mapComponent.getViewBounds());
		});

		controlMapPanel.find(".printMapCenterBtn").on("click", () => {
			console.info(this.mapComponent.getViewCenter());
		});

		controlMapPanel.find(".goHomeBtn").on("click", () => {
			this.goHome();
		});

		controlMapPanel.find(".setZoomBtn").on("click", () => {
			let zoom: number = Number($("#controlMapPanel").find(".zoom").val());
			this.mapComponent.setZoom(zoom);
		});

		controlMapPanel.find(".rotateMapBtn").on("click", () => {
			this.mapComponent.setHeading(Number($("#controlMapPanel").find(".heading").val()));
		});

		controlMapPanel.find(".printMapRotationBtn").on("click", () => {
			console.info(this.mapComponent.getHeading());
		});

		//events
		const eventsPanel = $("#eventsPanel");
		eventsPanel.find(".addMapClickListenerBtn").on("click", () => {
			this.mapComponent.on("click", (eventArgs: MapEventArgs) => {
				console.info("Click detected");
				console.info(eventArgs);
				try {
					MapUtils.getAltitude(new Coordinate(eventArgs.latitude, eventArgs.longitude))
						.then((num) => {
							console.log(num);
						});
				} catch (e) {
					console.log(e);
				}
			});
		});


		eventsPanel.find(".addRightClickListenerBtn").on("click", () => {
			this.mapComponent.on("rightclick", (eventArgs) => {
				console.info("Right Click detected");
				console.info(eventArgs);
			});
		});
		eventsPanel.find(".addZoomChangeEventBtn").on("click", () => {
			this.mapComponent.on("zoomChanged", (eventArgs) => {
				console.info("Zoom change detected");
				console.info(eventArgs);
			});
		});

		eventsPanel.find(".addViewChangeEventBtn").on("click", () => {
			this.mapComponent.on("viewChanged", (eventArgs) => {
				console.info("View change detected");
				console.info(eventArgs);
			});
		});

		eventsPanel.find(".orientMapNorthBtn").on("click", () => {
			document.addEventListener("keypress", (event: KeyboardEvent) => {
				switch (event.charCode) {
					case 114:
						this.mapComponent.orientMapNorth(true);
						break;
					case 110:
						this.mapComponent.orientMapNorth();
						break;
					default:
						break;
				}
			});
		});

		eventsPanel.find("#pickEntity").on("click", () => {
			this.mapComponent.on("click", (eventArgs) => {
				if (this.mapComponent instanceof CesiumMapComponent) {
					let mapComponent: CesiumMapComponent = this.mapComponent;
					let pickedEntity = mapComponent.utils.pickEntity(eventArgs);
					console.log("picked entity", pickedEntity);
				}
			});
		});

		eventsPanel.find("#pickEntities").on("click", () => {
			this.mapComponent.on("click", (eventArgs) => {
				if (this.mapComponent instanceof CesiumMapComponent) {
					let mapComponent: CesiumMapComponent = this.mapComponent;
					let pickedEntities = mapComponent.utils.pickEntities(eventArgs);
					console.log("picked entities", pickedEntities);
				}
			});
		});

		eventsPanel.find("#compareEntityAmount").on("click", () => {
			this.mapComponent.on("click", (eventArgs) => {
				try {
					let bool: boolean = this.mapComponent.utils.entitiesAmountInPositionGreaterThan(eventArgs,
						+eventsPanel.find("#compareWithInput").val());
					console.log("entity amount greater then:", bool);
				} catch (e) {

				}
			});
		});

		//MapGeodesy
		const geodesyPanel = $("#geodesyPanel");
		let projFrom: Projection = PROJECTIONS[geodesyPanel.find("#selectFrom").val().toString()];
		let projTo: Projection = PROJECTIONS[geodesyPanel.find("#selectTo").val().toString()];
		let unitFrom: UNITS = UNITS.DEGREES;
		let unitTo: UNITS = UNITS.DEGREES;
		let directionFrom: DIRECTIONS = DIRECTIONS.NORTH;
		let directionTo: DIRECTIONS = DIRECTIONS.NORTH;
		let zoneFrom: number = null;
		let zoneTo: number = null;

		geodesyPanel.find("#selectFrom").change((e) => {

			unitFrom = UNITS.DEGREES;
			directionFrom = DIRECTIONS.NORTH;
			zoneFrom = null;

			$("#selectGeoDirectionFrom, #selectGeoUnitFrom, #selectGeoZone")
				.css("visibility", "hidden");

			projFrom = PROJECTIONS[$(e.target).val().toString()];

			if (projFrom.epsg === 32600) {
				$("#selectGeoDirectionFrom").css("visibility", "visible");
			}
			if (projFrom.epsg === 4326 || projFrom.epsg === 4230 || projFrom.epsg === 4227) {
				$("#selectGeoUnitFrom").css("visibility", "visible");
			}
			if (projFrom.epsg === 55500 || projFrom.epsg === 32600 || projFrom.epsg === 22780) {
				$("#selectGeoZone").css("visibility", "visible");
			}
		});

		geodesyPanel.find("#selectTo").change((e) => {

			unitTo = UNITS.DEGREES;
			directionTo = DIRECTIONS.NORTH;
			zoneTo = null;

			$("#selectGeoDirectionTo, #selectGeoUnitTo")
				.css("visibility", "hidden");

			projTo = PROJECTIONS[$(e.target).val().toString()];

			if (projTo.epsg === 32600) {
				$("#selectGeoDirectionTo").css("visibility", "visible");
			}
			if (projTo.epsg === 4326 || projTo.epsg === 4230 || projTo.epsg === 4227) {
				$("#selectGeoUnitTo").css("visibility", "visible");
			}
			if (projTo.epsg === 55500 || projTo.epsg === 32600 || projTo.epsg === 22780) {
				zoneTo = 1;
			}
		});

		geodesyPanel.find("#selectGeoDirectionFrom").change((e) => {
			directionFrom = this.stringToDirection($(e.target).val().toString());
		});

		geodesyPanel.find("#selectGeoUnitFrom").change((e) => {
			unitFrom = this.stringToUnit($(e.target).val().toString());
		});

		geodesyPanel.find("#selectGeoZone").change((e) => {
			zoneFrom = +$(e.target).val().toString();
		});

		geodesyPanel.find("#selectGeoDirectionTo").change((e) => {
			directionTo = this.stringToDirection($(e.target).val().toString());
		});

		geodesyPanel.find("#selectGeoUnitTo").change((e) => {
			unitTo = this.stringToUnit($(e.target).val().toString());
		});

		geodesyPanel.find("#convertBtn").on("click", () => {
			let coordinate: Coordinate = new Coordinate(Number(geodesyPanel.find(".lat").val()), Number(geodesyPanel.find(".lon").val()));

			let error: string = Geodesy.validate(coordinate, projFrom, unitFrom, directionFrom, zoneFrom);
			if (error) {
				$("#errorOutput").html(error);
				return;
			}

			if (unitFrom !== UNITS.DEGREES) {
				let lng: number = +Geodesy.convertUnits(coordinate.longitude, unitFrom, UNITS.DEGREES);
				let lat: number = +Geodesy.convertUnits(coordinate.latitude, unitFrom, UNITS.DEGREES);
				coordinate.longitude = lng;
				coordinate.latitude = lat;
			}

			let converted: { coordinate: Coordinate, zone: number } =
				Geodesy.convertCoordinate(coordinate, projFrom, projTo, zoneFrom);

			let outStr: string = "longitude: " +
				converted.coordinate.longitude +
				", latitude: " + converted.coordinate.latitude +
				", zone: " + converted.zone;

			if (unitTo !== UNITS.DEGREES) {
				let lng: string = Geodesy.convertUnits(converted.coordinate.longitude, UNITS.DEGREES, unitTo);
				let lat: string = Geodesy.convertUnits(converted.coordinate.latitude, UNITS.DEGREES, unitTo);

				outStr = "longitude: " + lng + ", latitude: " + lat + ", zone: " + converted.zone;
			}

			console.info(outStr);
		});

		const loadKMlPanel = $("#loadKMLPanel");
		let kmlObj: IKMLGeometryCollection;

		loadKMlPanel.find("#KMLText").text(KML_STR);

		loadKMlPanel.find("#removeKMLBtn").prop("disabled", true);
		loadKMlPanel.find("#loadKMLBtn").on("click", () => {
			let kmlText: string = <string>loadKMlPanel.find("#KMLText").val();
			if (!kmlText) {
				return;
			}
			loadKmlTxt(kmlText);
		});

		loadKMlPanel.find("#removeKMLBtn").on("click", () => {
			if (!kmlObj || !kmlObj.getVisibility()) {
				return;
			}
			kmlObj.setVisibility(false).then(() => {
				loadKMlPanel.find("#loadKMLBtn").prop("disabled", false);
				loadKMlPanel.find("#removeKMLBtn").prop("disabled", true);
			});
		});

		loadKMlPanel.find("#toggleKmlClusterBtn").on("click", () => {
			//kmlObj.toggleCluster();
		});

		loadKMlPanel.find("#kmlFileInput").on("change", (event: any) => {
			let file = event.target.files[0];
			let reader = new FileReader();
			reader.onload = () => {
				let kmlText = reader.result;
				if (!kmlText) {
					return;
				}
				loadKmlTxt(kmlText);
			};

			reader.readAsText(file);
		});

		let loadKmlTxt = (kmlText) => {
			let kmlDoc: Document = $.parseXML(kmlText);
			this.mapComponent.loadKML(kmlDoc, true).then((kml: IKMLGeometryCollection) => {
				kmlObj = kml;
				loadKMlPanel.find("#loadKMLBtn").prop("disabled", true);
				loadKMlPanel.find("#removeKMLBtn").prop("disabled", false);
				console.log(kmlObj);
			});

			// let reader = new XMLHttpRequest();
			// reader.open("GET", "../clustering_kmls/kml3000.kml", true);
			// reader.onreadystatechange = () => {
			// 	if(reader.readyState === 4 && (reader.status === 200 || reader.status === 0)) {
			// 		let txt: string = reader.responseText;
			//
			// 		let kmlDoc: Document = $.parseXML(txt);
			// 		this.mapComponent.loadKML(kmlDoc, true).then((kml: IKMLGeometryCollection) => {
			// 			kmlObj = kml;
			// 			loadKMlPanel.find("#loadKMLBtn").prop("disabled", true);
			// 			loadKMlPanel.find("#removeKMLBtn").prop("disabled", false);
			// 			kmlObj.setListener((entityId: string) => {
			// 				console.log(entityId);
			// 			});
			// 			console.log(kmlObj);
			// 		});
			// 	}
			// };
			// reader.send(null);
		};

		loadKMlPanel.find("#removeKMLBtn").on("click", () => {
			if (!kmlObj || !kmlObj.getVisibility()) {
				return;
			}
			kmlObj.setVisibility(false).then(() => {
				loadKMlPanel.find("#loadKMLBtn").prop("disabled", false);
				loadKMlPanel.find("#removeKMLBtn").prop("disabled", true);
			});
		});

		const changeDimPanel = $("#changeDimPanel");
		changeDimPanel.find("#changeDimBtn").on("click", () => {
			this.mapComponent.changeDimension();
		});

		// TODO: Fix rasters flow
		if (this.mapComponent.nativeMapType === MapType.CESIUM) {
			this.mapComponent.rastersLoader.loadLayers().then(rasters => {
				let select = document.createElement("select");
				let option = document.createElement("option");
				select.appendChild(option);
				rasters.forEach(raster => {
					let option = document.createElement("option");
					option.appendChild(document.createTextNode(raster.name));
					select.appendChild(option);
				});
				document.getElementById("rastersPanel").appendChild(select);

				let layersOnMap: Dictionary<RasterLayer> = {};
				let raster: RasterLayer;

				$("#rastersPanel").on("change", function () {
					raster = _.findWhere(rasters,
						{ "name": ($("option:selected", this))[0].textContent });

					if (layersOnMap[raster.engName]) {
						raster = layersOnMap[raster.engName];
					}
				});

				$("#addRaster").on("click", async () => {
					try {
						await raster.addToMap();
						layersOnMap[raster.engName] = raster;
					} catch (e) {
						throw new Error("!!!!! !!! !!!!! :(");
					}
				});

				$("#removeRaster").on("click", async () => {
					try {
						await raster.remove();
						delete layersOnMap[raster.engName];
					} catch (e) {
						throw new Error("!!!!! !!! !!!!! :(");
					}
				});

				this.mapComponent.vectorsLoader.loadLayers().then((vectors) => {
					let tree = document.createElement("li");
					vectors.forEach(vector => {

						// Creating a folder of vector with name
						let folder = document.createElement("ul");
						let checkbox = document.createElement("input");
						checkbox.setAttribute("type", "checkbox");
						folder.appendChild(checkbox);
						folder.appendChild(document.createTextNode(vector.name));

						checkbox.addEventListener("change", async function () {
							if (this.checked) {
								if (vector.children) {
									vector.children.forEach(async (child) => {
										(<HTMLInputElement>document.getElementById("childCheckbox" + child.id))
											.checked = true;
										try {
											await child.addToMap();
										} catch (e) {
											throw new Error("!!!!! !!! !!!!! :(");
										}
									});
								} else {
									try {
										await vector.addToMap();
									} catch (e) {
										throw new Error("!!!!! !!! !!!!! :(");
									}
								}
							} else {
								if (vector.children) {
									vector.children.forEach(async (child) => {
										(<HTMLInputElement>document.getElementById("childCheckbox" + child.id))
											.checked = false;
										try {
											await child.remove();
										} catch (e) {
											throw new Error("!!!!! !!! !!!!! :(");
										}
									});
								} else {
									try {
										await vector.remove();
									} catch (e) {
										throw new Error("!!!!! !!! !!!!! :(");
									}
								}
							}
						});

						// Create the children of the current vector
						if (vector.children) {
							vector.children.forEach(layer => {
								let child = document.createElement("ul");
								let childCheckbox = document.createElement("input");
								childCheckbox.setAttribute("type", "checkbox");
								childCheckbox.setAttribute("id", "childCheckbox" + layer.id);

								childCheckbox.addEventListener("change", async function () {
									if (this.checked) {
										try {
											await layer.addToMap();
										} catch (e) {
											throw new Error("!!!!! !!! !!!!! :(");
										}
									} else {
										try {
											await layer.remove();
										} catch (e) {
											throw new Error("!!!!! !!! !!!!! :( ");
										}
									}
								});

								child.appendChild(childCheckbox);
								child.appendChild(document.createTextNode(layer.name));
								folder.appendChild(child);
							});
						}
						tree.appendChild(folder);
					});

					document.getElementById("vectorsPanel").appendChild(tree);
				});
			});
		}
	}

	private stringToUnit(unit: string): UNITS {
		switch (unit) {
			case ("D"):
				return UNITS.DEGREES;
			case ("S"):
				return UNITS.SECONDS;
			case ("DMS"):
				return UNITS.DMS;
			default:
				break;
		}
	}

	private stringToDirection(direction: string): DIRECTIONS {
		switch (direction) {
			case ("N"):
				return DIRECTIONS.NORTH;
			case ("S"):
				return DIRECTIONS.SOUTH;
			default:
				break;
		}
	}

	protected goHome(): void {
		this.mapComponent.flyTo(new Coordinate(32, 35));
	}

	protected addToMap(geometry: IGeometry): void {
		this.selectedLayers.forEach(layer => {
			if (layer === "map") {
				geometry.addToMap();
			}
			else {
				this.layers[layer].addGeometry(geometry);
			}
		});

		geometry.on("contextmenu", () => {
			const optionsPanel = $("#optionsPanel");
			if (this.editActionToken === null && this.dragActionToken === null) {
				if (optionsPanel.is(":visible")) {
					if (this.selectedGeometry !== geometry) {
						optionsPanel.slideUp().delay(100).slideDown();
					}
					else {
						optionsPanel.slideUp();
					}
				}
				else {
					optionsPanel.slideDown();
				}
				this.selectedGeometry = geometry;
			}
		});

		geometry.on("click", (eventArgs) => {
			if (geometry.isMarked()) {
				geometry.unMark();
			}
			else {
				geometry.mark();
			}
			console.info("Click detected");
			console.info(eventArgs);
		});

		geometry.on("dblclick", (eventArgs) => {
			console.info("Double click detected");
			console.info(eventArgs);
		});
	}
}