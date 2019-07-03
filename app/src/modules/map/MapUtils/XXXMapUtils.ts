/* tslint:disable */

import * as $ from "jquery";

declare var geeServerDefs: any;

export class XXXMapUtils {
	private static ge: google.earth.GEPlugin;
	private static currTempPlacemark: any = null;
	private static allPlacemarks: any[] = [];

	static async initGoogleEarth(options: { id: string, loadingUrl?: string, assetsServer?: string }): Promise<google.earth.GEPlugin> {
		options.assetsServer = options.assetsServer || "LINK";
		let pluginLoaderReq = new XMLHttpRequest();
		pluginLoaderReq.open("GET", "LINK", false);
		pluginLoaderReq.send(null);
		if (pluginLoaderReq.status === 200) {
			eval(pluginLoaderReq.responseText);
		} else {
			console.error("failed to load earth_plugin_loader");
			throw new Error("failed to load earth_plugin_loader");
		}

		let serverDefsReq = new XMLHttpRequest();
		serverDefsReq.open("GET",
			"LINK" +
			"GeeProxy/XXX_Service/query?request=json&var=geeServerDefs",
			false);
		serverDefsReq.send(null);
		if (serverDefsReq.status !== 200) {
			console.error("failed to load geeServerDefs");
		}
		let geeServerDefs = JSON.parse(serverDefsReq.responseText.split("=")[1]);

		// --------------------------------Begin GEE specific settings
		// Required for Behind the firewall usage.
		// Enterprise specific overrides for running the Earth plugin behind
		// the firewall.
		if (!("google" in (<any>window))) {
			(<any>window).google = {};
		}
		if (!("loader" in (<any>window).google)) {
			(<any>window).google.loader = {};
		}
		if (!("earth" in (<any>window).google)) {
			(<any>window).google.earth = {};
		}
		// Enterprise Earth Plugin Key
		(<any>window).google.loader.ApiKey = "ABCDEFGHIJKLMNOPgoogle.earth.ec.key";
		(<any>window).google.loader.KeyVerified = true;
		// Turn off logging.
		(<any>window).google.earth.allowUsageLogging = false;
		// Override the default google.com error page.
		//(<any>window).google.earth.setErrorUrl(attrs.errorUrl);
		let XXX_DOM = $("XXX-hauma");
		if (XXX_DOM.length !== 0 && XXX_DOM.attr("error-url")) {
			(<any>window).google.earth.setErrorUrl(XXX_DOM.attr("error-url"));
		} else {
			(<any>window).google.earth.setErrorUrl("LINK");
		}
		// Override the default loading icon.
		(<any>window).google.earth.setLoadingImageUrl(options.loadingUrl);
		// --------------------------------End GEE specific settings

		// **************************************************************************
		// You will need to replace yourserver.com with the appropriate server name.
		// For authentication to your database,
		// simply add arguments "username" and "password" to earthArgs.
		// IE6 compatibility note: no trailing commas in dictionaries or arrays.
		let earthArgs: any = {
			"database": geeServerDefs.serverUrl
		};
		if (geeServerDefs.isAuthenticated) {
			// Pop up auth dialog if desired.
			let username = "";
			let password = "";
			earthArgs.username = username;
			earthArgs.password = password;
		}

		// We construct the internal layer container and title divs.
		// The inner container is needed globally.
		return new Promise<google.earth.GEPlugin>((resolve, reject) => {
			google.earth.createInstance(options.id, function (object) {
					let ge = object;
					ge.getOptions().setStatusBarVisibility(false);  // show lat,lon,height,eye_alt
					ge.getOptions().setScaleLegendVisibility(true);  // show scale legend
					ge.getWindow().setVisibility(true);
					ge.getNavigationControl().getScreenXY().setXUnits(ge.UNITS_PIXELS);
					ge.getNavigationControl().getScreenXY().setYUnits(ge.UNITS_INSET_PIXELS);
					ge.getNavigationControl().setVisibility(ge.VISIBILITY_SHOW);

					var overlay = ge.createScreenOverlay("");
					// Adding mipuy logo
					var icon = ge.createIcon("");
					icon.setHref(options.assetsServer + "/img/mipuy.png");
					overlay.setIcon(icon);
					overlay.getOverlayXY().setXUnits(ge.UNITS_PIXELS);
					overlay.getOverlayXY().setYUnits(ge.UNITS_PIXELS);
					overlay.getOverlayXY().setX(80);
					overlay.getOverlayXY().setY(90);
					overlay.getSize().setXUnits(ge.UNITS_PIXELS);
					overlay.getSize().setYUnits(ge.UNITS_PIXELS);
					overlay.getSize().setX(105);
					overlay.getSize().setY(80);
					overlay.getColor().setA(200);
					ge.getFeatures().appendChild(overlay);

					// Hide terms of service icon
					$("#_idlglue_pluginDiv___idlglue_plugin__99").find("a").css("display", "none");

					// Navigate to home (Israel section)
					var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
					lookAt.setLatitude(32);
					lookAt.setLongitude(35);
					lookAt.setRange(500 * 1000);
					lookAt.setTilt(0);
					ge.getView().setAbstractView(lookAt);
					XXXMapUtils.ge = ge;
					return resolve(ge);
				},
				function (message) {
					$("#splash").css("display", "none");
					console.error("geFailed: " + message);
					setTimeout(function () {
						reject("cant initialize");
					}, 2000);
				}, earthArgs);
		});
	}

	public static createPlacemark(data) {
		if (!data || !XXXMapUtils.ge) {
			console.error("no GE or no data sent");
			return null;
		}
		var XXXPlacemarkObj: any = {};
		var placemarkData: any = {};
		placemarkData.placemark = XXXMapUtils.ge.createPlacemark("");
		placemarkData.clickEvent = null;
		placemarkData.visibility = true;
		placemarkData.isTemp = false;
		placemarkData.eventParameter = null;
		placemarkData.isDraggable = false;
		placemarkData.draggableEvents = {};
		placemarkData.name = "";
		placemarkData.balloonHtml = "";
		placemarkData.icon = {};
		//var

		var point = XXXMapUtils.ge.createPoint("");
		point.setLatitude(data.lat !== undefined ? data.lat : 0);
		point.setLongitude(data.lon !== undefined ? data.lon : 0);
		if (data.alt) {
			point.setAltitudeMode(XXXMapUtils.ge.ALTITUDE_ABSOLUTE);
			point.setAltitude(data.alt);
		}
		placemarkData.placemark.setGeometry(point);
		if (data.lon === undefined || data.lat === undefined || data.visibility === false) {
			placemarkData.visibility = false;
		}

		XXXPlacemarkObj.setIconUrl = function (iconUrl) {
			placemarkData.iconUrl = iconUrl;
			var style = null;
			if (iconUrl) {
				var iconPin = XXXMapUtils.ge.createIcon("");
				iconPin.setHref(iconUrl);
				style = XXXMapUtils.ge.createStyle("");
				style.getIconStyle().setIcon(iconPin);
				if (placemarkData.iconScale && placemarkData.iconScale != 1) {
					style.getIconStyle().setScale(placemarkData.iconScale);
				}
			}
			placemarkData.placemark.setStyleSelector(style);
		};
		XXXPlacemarkObj.getIconUrl = function () {
			return placemarkData.icon;
		};
		XXXPlacemarkObj.setIconScale = function (iconScale) {
			placemarkData.iconScale = iconScale;
			if (placemarkData.placemark.getStyleSelector()) {
				placemarkData.placemark.getStyleSelector().getIconStyle().setScale(placemarkData.iconScale);
			}
		};
		XXXPlacemarkObj.getIconScale = function () {
			return placemarkData.iconScale;
		};

		XXXPlacemarkObj.setIconUrl(data.iconUrl);
		XXXPlacemarkObj.setIconScale(data.iconScale);

		google.earth.addEventListener(placemarkData.placemark, "click", function (event) {
			if (placemarkData.clickEvent) {
				placemarkData.clickEvent(XXXMapUtils.convertGeEvent(event), placemarkData.eventParameter);
			}
		});

		if (placemarkData.visibility) {
			XXXMapUtils.ge.getFeatures().appendChild(placemarkData.placemark);
		}

		if (data.temp) {
			XXXMapUtils.removeTempPlacemark();
			placemarkData.isTemp = true;
			XXXMapUtils.currTempPlacemark = placemarkData;
		}

		XXXPlacemarkObj.getIsTemp = function () {
			return placemarkData.isTemp;
		};

		XXXPlacemarkObj.setCoords = function (coords) {
			placemarkData.placemark.getGeometry().setLatitude(coords.lat);
			placemarkData.placemark.getGeometry().setLongitude(coords.lon);
		};
		XXXPlacemarkObj.getCoords = function () {
			return {
				lat: placemarkData.placemark.getGeometry().getLatitude(),
				lon: placemarkData.placemark.getGeometry().getLongitude()
			};
		};

		XXXPlacemarkObj.setClickEvent = function (clickEvent) {
			placemarkData.clickEvent = clickEvent;
		};
		XXXPlacemarkObj.getClickEvent = function () {
			return placemarkData.clickEvent;
		};

		XXXPlacemarkObj.setIsDraggable = function (isDraggable) {
			if (isDraggable && !placemarkData.isDraggable) {
				placemarkData.extraEvents = {
					mousedown: function (event) {
						if (event.getButton() === 0) {
							var placemark = event.getTarget();

							placemark.dragPointInfo = {
								dragged: false,
								startPosition: {
									lon: event.getLongitude(),
									lat: event.getLatitude()
								}
							};
							if (placemarkData.draggableEvents.mousedown) {
								placemarkData.draggableEvents.mousedown(XXXMapUtils.convertGeEvent(event), placemarkData.eventParameter);
							}
						}

					},
					mousemove: function (event) {
						var placemark = event.getTarget();

						if (placemark.dragPointInfo) {
							event.preventDefault();
							var point = placemark.getGeometry();
							point.setLatitude(event.getLatitude());
							point.setLongitude(event.getLongitude());
							placemark.dragPointInfo.dragged = true;
							if (placemarkData.draggableEvents.mousemove) {
								placemarkData.draggableEvents.mousemove(XXXMapUtils.convertGeEvent(event), placemarkData.eventParameter);
							}
						}
					},
					mouseup: function (event) {
						var placemark = event.getTarget();

						if (placemark.dragPointInfo) {
							if (placemarkData.draggableEvents.mouseup) {
								placemarkData.draggableEvents.mouseup(XXXMapUtils.convertGeEvent(event), placemarkData.eventParameter);
							}
							if (placemark.dragPointInfo.dragged) {
								event.preventDefault();
								if (placemarkData.draggableEvents.dragFinish) {
									var endPosition = {lon: event.getLongitude(), lat: event.getLatitude()};
									placemarkData.draggableEvents.dragFinish(placemark.dragPointInfo.startPosition, endPosition, placemarkData.eventParameter);
								}
							}
							placemark.dragPointInfo = null;
						}
					}
				};
				google.earth.addEventListener(placemarkData.placemark, "mousedown", placemarkData.extraEvents.mousedown);
				google.earth.addEventListener(placemarkData.placemark, "mousemove", placemarkData.extraEvents.mousemove);
				google.earth.addEventListener(placemarkData.placemark, "mouseup", placemarkData.extraEvents.mouseup);

				placemarkData.isDraggable = true;
			} else if (!isDraggable && placemarkData.isDraggable) {
				google.earth.removeEventListener(placemarkData.placemark, "mousedown", placemarkData.extraEvents.mousedown);
				google.earth.removeEventListener(placemarkData.placemark, "mousemove", placemarkData.extraEvents.mousemove);
				google.earth.removeEventListener(placemarkData.placemark, "mouseup", placemarkData.extraEvents.mouseup);
				placemarkData.isDraggable = false;
			} else {
				//console.log("Draggable is already defined to value: " + isDraggable);
			}
		};
		XXXPlacemarkObj.getIsDraggable = function () {
			return placemarkData.isDraggable;
		};

		XXXPlacemarkObj.setDraggableEvents = function (draggableEvents) {
			placemarkData.draggableEvents = draggableEvents;
		};
		XXXPlacemarkObj.getDraggableEvents = function () {
			return placemarkData.draggableEvents;
		};

		XXXPlacemarkObj.setEventParameter = function (eventParameter) {
			placemarkData.eventParameter = eventParameter;
		};
		XXXPlacemarkObj.getEventParameter = function () {
			return placemarkData.eventParameter;
		};

		XXXPlacemarkObj.setName = function (name) {
			placemarkData.placemark.setName(name);
			placemarkData.name = name;
		};
		XXXPlacemarkObj.getName = function () {
			return placemarkData.name;
		};

		XXXPlacemarkObj.setBalloonHtml = function (balloonHtml) {
			if (placemarkData.balloonHtml) {
				google.earth.removeEventListener(placemarkData.placemark, "click", placemarkData.balloonClickEvent);
			}
			if (balloonHtml) {
				var balloon = XXXMapUtils.ge.createHtmlStringBalloon("");
				balloon.setFeature(placemarkData.placemark);
				balloon.setContentString(balloonHtml);

				placemarkData.balloonClickEvent = function (event) {
					event.preventDefault();
					XXXMapUtils.ge.setBalloon(balloon);
				};
				google.earth.addEventListener(placemarkData.placemark, "click", placemarkData.balloonClickEvent);
				XXXMapUtils.ge.setBalloon(balloon);
			}
			placemarkData.balloonHtml = balloonHtml;
		};
		XXXPlacemarkObj.getBalloonHtml = function () {
			return placemarkData.balloonHtml;
		};

		XXXPlacemarkObj.setVisibility = function (visibility) {
			if (visibility && !placemarkData.visibility) {
				XXXMapUtils.ge.getFeatures().appendChild(placemarkData.placemark);
			} else if (!visibility && placemarkData.visibility) {
				XXXMapUtils.ge.getFeatures().removeChild(placemarkData.placemark);
			} else {
				// console.log("visibility already set to value:" + visibility);
			}
			placemarkData.visibility = visibility;
		};
		XXXPlacemarkObj.getVisibility = function () {
			return placemarkData.visibility;
		};

		XXXPlacemarkObj.getOriginalObject = function () {
			return placemarkData.placemark;
		};

		XXXPlacemarkObj.focus = function () {
			var lookAt = XXXMapUtils.ge.getView().copyAsLookAt(XXXMapUtils.ge.ALTITUDE_RELATIVE_TO_GROUND);
			lookAt.setLatitude(parseFloat(placemarkData.placemark.getGeometry().getLatitude()));
			lookAt.setLongitude(parseFloat(placemarkData.placemark.getGeometry().getLongitude()));
			lookAt.setRange(500);
			lookAt.setTilt(0);
			XXXMapUtils.ge.getView().setAbstractView(lookAt);
		};

		placemarkData.XXXPlacemarkObj = XXXPlacemarkObj;

		XXXMapUtils.allPlacemarks.push(XXXPlacemarkObj);
		return XXXPlacemarkObj;
	}

	public static removeTempPlacemark() {
		if (XXXMapUtils.currTempPlacemark) {
			XXXMapUtils.ge.getFeatures().removeChild(XXXMapUtils.currTempPlacemark.placemark);
			XXXMapUtils.currTempPlacemark = null;
		}
	}

	public static getTempPlacemark() {
		if (XXXMapUtils.currTempPlacemark) {
			return XXXMapUtils.currTempPlacemark.XXXPlacemarkObj;
		} else {
			return null;
		}
	}

	public static focusTo(lon, lat, cameraHeight, tilt, directionByNorth) {
		var lookAt = XXXMapUtils.ge.getView().copyAsLookAt(XXXMapUtils.ge.ALTITUDE_RELATIVE_TO_GROUND);
		lookAt.setLatitude(lat);
		lookAt.setLongitude(lon);
		lookAt.setRange(cameraHeight ? cameraHeight : 5000);
		lookAt.setTilt(tilt ? tilt : 0);
		lookAt.setHeading(directionByNorth ? directionByNorth : 0);
		XXXMapUtils.ge.getView().setAbstractView(lookAt);
	}

	public static getNewPolygon() {
		var polygonData: any = {};
		var XXXPolygon: any = {};

		polygonData.pointsArray = [];
		polygonData.newPointEvent = null;
		polygonData.doneDrawingEvent = null;
		polygonData.eventParam = null;
		polygonData.writeCoordsInNodes = false;
		polygonData.polygonPlacemark = XXXMapUtils.ge.createPlacemark("");
		polygonData.coords = null;
		polygonData.isDrawing = false;

		var polygon = XXXMapUtils.ge.createPolygon("");
		polygonData.polygonPlacemark.setGeometry(polygon);
		var ring = XXXMapUtils.ge.createLinearRing("");
		polygon.setOuterBoundary(ring);
		polygonData.coords = ring.getCoordinates();
		polygonData.polygonPlacemark.setStyleSelector(XXXMapUtils.ge.createStyle(""));

		var lineStyle = polygonData.polygonPlacemark.getStyleSelector().getLineStyle();
		lineStyle.setWidth(2);
		lineStyle.getColor().set("994f53d9");

		var polyStyle = polygonData.polygonPlacemark.getStyleSelector().getPolyStyle();
		polyStyle.getColor().setA(120);
		polyStyle.getColor().setR(255);
		polyStyle.getColor().setG(255);
		polyStyle.getColor().setB(255);

		XXXMapUtils.ge.getFeatures().appendChild(polygonData.polygonPlacemark);

		polygonData.clickEvent = function (event) {
			if (event.getButton() === 0) {
				var lat = event.getLatitude();
				var lon = event.getLongitude();
				polygonData.pointsArray.push({
					x: lon,
					y: lat
				});
				polygonData.coords.pushLatLngAlt(lat, lon, 0);
				if (polygonData.newPointEvent) {
					polygonData.newPointEvent(XXXMapUtils.convertGeEvent(event), polygonData.eventParam);
				}
			}
		};
		polygonData.mousemoveEvent = function (event) {
			var lat = event.getLatitude();
			var lon = event.getLongitude();
			polygonData.coords.setLatLngAlt(polygonData.coords.getLength() - 1, lat, lon, 0);
		};

		polygonData.dblclickEvent = function (event) {
			event.preventDefault();
			XXXPolygon.stopDrawing();
			if (polygonData.doneDrawingEvent) {
				polygonData.doneDrawingEvent(XXXMapUtils.convertGeEvent(event), polygonData.eventParam);
			}
		};

		XXXPolygon.startDrawing = () => {
			if (!polygonData.isDrawing) {
				google.earth.addEventListener(XXXMapUtils.ge.getWindow(), "click", polygonData.clickEvent);
				google.earth.addEventListener(XXXMapUtils.ge.getWindow(), "dblclick", polygonData.dblclickEvent);
				google.earth.addEventListener(XXXMapUtils.ge.getWindow(), "mousemove", polygonData.mousemoveEvent);
				polygonData.coords.pushLatLngAlt(0, 0, 0); // for the last point (that are edited in "mousemove")
				polygonData.isDrawing = true;
			}
		};
		XXXPolygon.stopDrawing = () => {
			if (polygonData.isDrawing) {
				google.earth.removeEventListener(XXXMapUtils.ge.getWindow(), "click", polygonData.clickEvent);
				google.earth.removeEventListener(XXXMapUtils.ge.getWindow(), "dblclick", polygonData.dblclickEvent);
				google.earth.removeEventListener(XXXMapUtils.ge.getWindow(), "mousemove", polygonData.mousemoveEvent);
				polygonData.isDrawing = false;
				polygonData.coords.pop();
			}
		};
		XXXPolygon.getIsDrawing = function () {
			return polygonData.isDrawing;
		};
		XXXPolygon.setNewPointEvent = function (newPointFn) {
			polygonData.newPointEvent = newPointFn;
		};
		XXXPolygon.setDoneDrawingEvent = function (doneFn) {
			polygonData.doneDrawingEvent = doneFn;
		};

		XXXPolygon.getKml = function () {
			return polygonData.polygonPlacemark.getKml();
		};
		XXXPolygon.getOriginalObject = function () {
			return polygonData.polygonPlacemark;
		};

		XXXPolygon.getVisibility = function () {
			return polygonData.polygonPlacemark.getVisibility();
		};
		XXXPolygon.setVisibility = function (visibility) {
			return polygonData.polygonPlacemark.setVisibility(visibility);
		};

		XXXPolygon.getPoints = function () {
			return polygonData.pointsArray.concat([polygonData.pointsArray[0]]);
		};
		XXXPolygon.clearPoints = function () {
			polygonData.coords.clear();
			polygonData.pointsArray = [];
			if (polygonData.isDrawing) {
				polygonData.coords.pushLatLngAlt(0, 0, 0);
			}
		};
		XXXPolygon.addPoint = function (lon, lat, addInBeginning) {
			if (!addInBeginning) {

				if (polygonData.isDrawing) {
					polygonData.coords.pop();
					polygonData.coords.pushLatLngAlt(lat, lon, 0);
					polygonData.coords.pushLatLngAlt(0, 0, 0);
				} else {
					polygonData.coords.pushLatLngAlt(lat, lon, 0);
				}

				polygonData.pointsArray.push({
					x: lon,
					y: lat
				});
			} else {
				polygonData.pointsArray.unshift({
					x: lon,
					y: lat
				});
				polygonData.coords.unshiftLatLngAlt(lat, lon, 0);
			}
		};
		XXXPolygon.setPoint = function (lon, lat, index) {
			if (index < 0 || index >= polygonData.coords.getLength()) {
				console.error("No index: " + index + " in polygon.");
				return;
			}
			polygonData.coords.setLatLngAlt(index, lat, lon, 0);
			polygonData.pointsArray[index] = {x: lon, y: lat};
		};

		XXXPolygon.popPoint = function () {
			polygonData.coords.pop();
			polygonData.pointsArray.pop();

		};


		XXXPolygon.setEventParameter = function (eventParameter) {
			polygonData.eventParam = eventParameter;
		};
		XXXPolygon.getEventParameter = function () {
			return polygonData.eventParam;
		};

		XXXPolygon.setPolygonColor = function (r, g, b, a) {
			var polyStyle = polygonData.polygonPlacemark.getStyleSelector().getPolyStyle();
			if (a) {
				polyStyle.getColor().setA(a);
			}
			if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
				polyStyle.getColor().setR(r);
				polyStyle.getColor().setG(g);
				polyStyle.getColor().setB(b);
			}
		};
		XXXPolygon.setRingColor = function (r, g, b, a, width) {
			var lineStyle = polygonData.polygonPlacemark.getStyleSelector().getLineStyle();
			if (width) {
				lineStyle.setWidth(width);
			}
			if (a) {
				lineStyle.getColor().setA(a);
			}
			if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
				lineStyle.getColor().setR(r);
				lineStyle.getColor().setG(g);
				lineStyle.getColor().setB(b);
			}
		};

		return XXXPolygon;
	}

	public static getNewPath() {
		var pathData: any = {};
		var XXXPath: any = {};

		pathData.pointsArray = [];
		pathData.newPointEvent = null;
		pathData.doneDrawingEvent = null;
		pathData.eventParam = null;
		pathData.writeCoordsInNodes = false;
		pathData.pathPlacemark = XXXMapUtils.ge.createPlacemark("");
		pathData.isDrawing = false;
		pathData.coords = null;

		var lineString = XXXMapUtils.ge.createLineString("");
		lineString.setTessellate(true);
		pathData.pathPlacemark.setGeometry(lineString);
		pathData.coords = pathData.pathPlacemark.getGeometry().getCoordinates();

		pathData.pathPlacemark.setStyleSelector(XXXMapUtils.ge.createStyle(""));
		var lineStyle = pathData.pathPlacemark.getStyleSelector().getLineStyle();
		lineStyle.setWidth(3);
		lineStyle.getColor().set("9900ffff");

		XXXMapUtils.ge.getFeatures().appendChild(pathData.pathPlacemark);

		pathData.clickEvent = function (event) {
			if (event.getButton() === 0) {
				var lat = event.getLatitude();
				var lon = event.getLongitude();
				pathData.pointsArray.push({
					x: lon,
					y: lat
				});
				pathData.coords.pushLatLngAlt(lat, lon, 0);
				if (pathData.newPointEvent) {
					pathData.newPointEvent(XXXMapUtils.convertGeEvent(event), pathData.eventParam);
				}
			}
		};

		pathData.mousemoveEvent = function (event) {
			var lat = event.getLatitude();
			var lon = event.getLongitude();
			pathData.coords.setLatLngAlt(pathData.coords.getLength() - 1, lat, lon, 0);
		};
		pathData.dblclickEvent = function (event) {
			event.preventDefault();
			XXXPath.stopDrawing();
			if (pathData.doneDrawingEvent) {
				pathData.doneDrawingEvent(XXXMapUtils.convertGeEvent(event), pathData.eventParam);
			}
		};

		XXXPath.startDrawing = () => {
			if (!pathData.isDrawing) {
				google.earth.addEventListener(XXXMapUtils.ge.getWindow(), "click", pathData.clickEvent);
				google.earth.addEventListener(XXXMapUtils.ge.getWindow(), "dblclick", pathData.dblclickEvent);
				google.earth.addEventListener(XXXMapUtils.ge.getWindow(), "mousemove", pathData.mousemoveEvent);
				pathData.coords.pushLatLngAlt(0, 0, 0); // for the last point (that are edited in "mousemove")
				pathData.isDrawing = true;
			}
		};
		XXXPath.stopDrawing = () => {
			if (pathData.isDrawing) {
				google.earth.removeEventListener(XXXMapUtils.ge.getWindow(), "click", pathData.clickEvent);
				google.earth.removeEventListener(XXXMapUtils.ge.getWindow(), "dblclick", pathData.dblclickEvent);
				google.earth.removeEventListener(XXXMapUtils.ge.getWindow(), "mousemove", pathData.mousemoveEvent);
				pathData.isDrawing = false;
			}
		};
		XXXPath.getIsDrawing = function () {
			return pathData.isDrawing;
		};
		XXXPath.setNewPointEvent = function (newPointFn) {
			pathData.newPointEvent = newPointFn;
		};
		XXXPath.setDoneDrawingEvent = function (doneFn) {
			pathData.doneDrawingEvent = doneFn;
		};

		XXXPath.getKml = function () {
			return pathData.pathPlacemark.getKml();
		};

		XXXPath.getOriginalObject = function () {
			return pathData.pathPlacemark;
		};

		XXXPath.getVisibility = function () {
			return pathData.pathPlacemark.getVisibility();
		};
		XXXPath.setVisibility = function (visibility) {
			pathData.pathPlacemark.setVisibility(visibility);
		};

		XXXPath.getPoints = function () {
			return pathData.pointsArray;
		};
		XXXPath.clearPoints = function () {
			pathData.coords.clear();
			pathData.pointsArray = [];
			if (pathData.isDrawing) {
				pathData.coords.pushLatLngAlt(0, 0, 0);
			}
		};
		XXXPath.addPoint = function (lon, lat, addInBeginning) {
			if (!addInBeginning) {
				if (pathData.isDrawing) {
					pathData.coords.pop();
					pathData.coords.pushLatLngAlt(lat, lon, 0);
					pathData.coords.pushLatLngAlt(0, 0, 0);
				} else {
					pathData.coords.pushLatLngAlt(lat, lon, 0);
				}
				pathData.pointsArray.push({
					x: lon,
					y: lat
				});
			} else {
				pathData.pointsArray.unshift({
					x: lon,
					y: lat
				});
				pathData.coords.unshiftLatLngAlt(lat, lon, 0);
			}
		};
		XXXPath.setPoint = function (lon, lat, index) {
			if (index < 0 || index >= pathData.coords.getLength()) {
				console.error("No index: " + index + " in polygon.");
				return;
			}
			pathData.coords.setLatLngAlt(index, lat, lon, 0);
			pathData.pointsArray[index] = {x: lon, y: lat};
		};
		XXXPath.popPoint = function () {
			pathData.coords.pop();
			pathData.pointsArray.pop();

		};


		XXXPath.setEventParameter = function (eventParameter) {
			pathData.eventParam = eventParameter;
		};
		XXXPath.getEventParameter = function () {
			return pathData.eventParam;
		};

		XXXPath.setPathColor = function (r, g, b, a, width) {
			var lineStyle = pathData.pathPlacemark.getStyleSelector().getLineStyle();
			if (!isNaN(width)) {
				lineStyle.setWidth(width);
			}
			if (!isNaN(a)) {
				lineStyle.getColor().setA(a);
			}
			if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
				lineStyle.getColor().setR(r);
				lineStyle.getColor().setG(g);
				lineStyle.getColor().setB(b);
			}
		};

		return XXXPath;
	}

	private static convertGeEvent(geEvent) {
		var XXXEvent: any = {};
		XXXEvent.lon = geEvent.getLongitude();
		XXXEvent.lat = geEvent.getLatitude();
		XXXEvent.alt = geEvent.getAltitude();
		XXXEvent.button = geEvent.getButton();
		XXXEvent.ctrlPressed = geEvent.getCtrlKey();
		XXXEvent.altPressed = geEvent.getAltKey();
		XXXEvent.shiftPressed = geEvent.getShiftKey();
		XXXEvent.preventDefault = function () {
			geEvent.preventDefault();
		};
		XXXEvent.getOriginalObject = function () {
			return geEvent;
		};
		return XXXEvent;
	}
}