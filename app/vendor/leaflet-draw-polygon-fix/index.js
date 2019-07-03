if(!L.Draw.Polygon.prototype._polygonDbClickFixed) {
	L.Draw.Polygon.prototype._polygonDbClickFixed = true;
	L.Draw.Polyline.prototype._calculateDistance = function (potentialLatLng, marker) {
		var lastPointDistance;
		if (this._markers.length > 0) {
			var markerPoint = this._map.latLngToContainerPoint(marker.getLatLng());
			var potentialMarker = new L.Marker(potentialLatLng, {
				icon: this.options.icon,
				zIndexOffset: this.options.zIndexOffset * 2
			});
			var potentialMarkerPoint = this._map.latLngToContainerPoint(potentialMarker.getLatLng());
			lastPointDistance = markerPoint.distanceTo(potentialMarkerPoint);
		} else {
			lastPointDistance = Infinity;
		}
		return lastPointDistance;
	};

	var _endPoint = L.Draw.Polygon.prototype._endPoint;
	L.Draw.Polygon.prototype._endPoint = function (clientX, clientY, e) {
		if (this._markers.length > 2) {
			var dbClickPointDistance = this._calculateDistance(e.latlng, this._markers[this._markers.length - 1]);
			if (dbClickPointDistance < 10 && L.Browser.touch) {
				this._enableNewMarkers();
				return;
			}
		}
		_endPoint.call(this, clientX, clientY, e);
	};
}