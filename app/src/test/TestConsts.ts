import * as GeoJSON from "@turf/helpers/lib/geojson";
import { ViewBounds } from "../modules/map/Components/View/ViewBounds";
import { GeometryDesign } from "../modules/map/GeometryDesign/GeometryDesign";
import { Coordinate } from "../modules/map/Geometries/Coordinate";
import { ScreenCoordinate } from "../modules/map/GraphicsUtils/ScreenCoordinate";
import { IconRelativePosition } from "../modules/map/GeometryDesign/Enums/IconRelativePosition";
import { LabelRelativePosition } from "../modules/map/GeometryDesign/Enums/LabelRelativePosition";
import { IGeometryDesign } from "../modules/map/GeometryDesign/Interfaces/IGeometryDesign";
import { FillPatternName } from "../modules/map/GeometryDesign/Enums/FillPatternName";

export const ZOOM: number = 999;
export const DEFAULT_GEOMETRY_DESIGN = new GeometryDesign({
	icons: [{
		"image": {
			"url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACqElEQVRoQ+2Zz4uOURTHP19MqVFC8R+QzSyQxUyakAWFf0DyI0ssNJbIjmQxJRtGkj1lIYaQX5GVjfkXGFnIJOHoTM9bb2/z3nuf97k3vfWc3dM999zv954f9zz3ikQxs5XAOWA3sD1xWh21v8Ac8AC4IGkhZbJSlMxsPfAYGEvRz6Dz0TdK0peYrVQCL4GJmLHM408lubeDEiVgZnuARzFDhcYnJb0I2U4hMAMcLQQwZnZG0vGmBD4AW2IrFRp/LylYMFI88AsYKQQwZnZB0ujAHjAzJ+jl7b+JpOAmBwdbAhn81nqgzYGGYdSGUBtCbQi1B1nbSjTKgraMDnUZdd+b2XdgVaM4GHzyN0lrB/4fqAi8A7YB0Z+fwXEuOdOAt5LGmxK4AxzKDC7V3C1Jx5oS8KuN2dQVM+uNS3rTiEAVRreBw5nBxcxFbyTcQFJcm9ly4DpwIrZqpvFrwClJ0f/xJAIdUGa2F9gFbAWW9YCdrAn+eY++3374Fc6spCeptmoRCBk1s4PAvcSFd0p6lqgbVMtJYB0wnwDKd3pU0u8E3ahKNgJVsn8CNgZyy2v7Q0n7osgSFXITuAkE6zZwRtLVRHxRtdwEHLyTCMmYJL//zyK5CWwCPIyWEg+feUn+WJJNshKo8uArsKZPHtyVlLUtKUHgPnCgzxYfkeSnejYpQWAKuNwH4QZJn7OhT20l6ixoZt7+vuqZ4/E/J2lzHVspuiU8sAL4CXj/1C3Tkk6ngKqjk51Alcj+qume6La/X5K/AWeVUgQuAWe7kP4BVkv6kRV9iRyoPOBVyKvR4qfnhKQducG7vVIe6G3szku6ODQEKi/4iewns8uEpNfDRuAG0HmkHsnVPvduQpEQqjxwEphejNPIU2kTz5Qk0GnspiRdaQIyNPcfp6jvMQ7N6EsAAAAASUVORK5CYII=",
			"size": {"width": 36, "height": 36},
			"anchor": null,
			"opacity": 1,
			"angle": 0,
			"positionPolicy": IconRelativePosition.NorthernPoint,
			"visibility": true
		},
		"label": {
			"text": null,
			"opacity": 1,
			"visibility": true,
			"fontSize": 12,
			"positionPolicy": LabelRelativePosition.Top
		}
	}]
});

export const NON_DEFAULT_DESIGN: IGeometryDesign = new GeometryDesign({
	fill: {
		color: "rgb(125,125,125)",
		pattern: FillPatternName.Solid,
		opacity: 0.5
	},
	icons: [{
		"image": {
			"url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACqElEQVRoQ+2Zz4uOURTHP19MqVFC8R+QzSyQxUyakAWFf0DyI0ssNJbIjmQxJRtGkj1lIYaQX5GVjfkXGFnIJOHoTM9bb2/z3nuf97k3vfWc3dM999zv954f9zz3ikQxs5XAOWA3sD1xWh21v8Ac8AC4IGkhZbJSlMxsPfAYGEvRz6Dz0TdK0peYrVQCL4GJmLHM408lubeDEiVgZnuARzFDhcYnJb0I2U4hMAMcLQQwZnZG0vGmBD4AW2IrFRp/LylYMFI88AsYKQQwZnZB0ujAHjAzJ+jl7b+JpOAmBwdbAhn81nqgzYGGYdSGUBtCbQi1B1nbSjTKgraMDnUZdd+b2XdgVaM4GHzyN0lrB/4fqAi8A7YB0Z+fwXEuOdOAt5LGmxK4AxzKDC7V3C1Jx5oS8KuN2dQVM+uNS3rTiEAVRreBw5nBxcxFbyTcQFJcm9ly4DpwIrZqpvFrwClJ0f/xJAIdUGa2F9gFbAWW9YCdrAn+eY++3374Fc6spCeptmoRCBk1s4PAvcSFd0p6lqgbVMtJYB0wnwDKd3pU0u8E3ahKNgJVsn8CNgZyy2v7Q0n7osgSFXITuAkE6zZwRtLVRHxRtdwEHLyTCMmYJL//zyK5CWwCPIyWEg+feUn+WJJNshKo8uArsKZPHtyVlLUtKUHgPnCgzxYfkeSnejYpQWAKuNwH4QZJn7OhT20l6ixoZt7+vuqZ4/E/J2lzHVspuiU8sAL4CXj/1C3Tkk6ngKqjk51Alcj+qume6La/X5K/AWeVUgQuAWe7kP4BVkv6kRV9iRyoPOBVyKvR4qfnhKQducG7vVIe6G3szku6ODQEKi/4iewns8uEpNfDRuAG0HmkHsnVPvduQpEQqjxwEphejNPIU2kTz5Qk0GnspiRdaQIyNPcfp6jvMQ7N6EsAAAAASUVORK5CYII=",
			"size": {"width": 36, "height": 36},
			"anchor": null,
			"opacity": 1,
			"angle": 0,
			"positionPolicy": IconRelativePosition.NorthernPoint,
			"visibility": true
		},
		"label": {
			"text": "blabla",
			"opacity": 1,
			"visibility": true,
			"fontSize": 16,
			"positionPolicy": LabelRelativePosition.Top
		}
	}]
});

export const DEFAULT_GEOMETRY_ID = "Test Id";
export const POLY_COORDINATES: Coordinate[] = [
	new Coordinate(32, 35, 0),
	new Coordinate(33, 35, 0),
	new Coordinate(33, 36, 0),
	new Coordinate(32, 36, 0)
];

export const WKT_POLYGON = "POLYGON((35 32,35 33,36 33,36 32,35 32))";
export const WKT_POLYGON_WITH_HOLES = `POLYGON((31.414031982421875 34.661865234375,31.440811157226562 34.871978759765625,31.604232788085938 34.87060546875,31.6131591796875 34.70375061035156,31.414031982421875 34.661865234375),(31.560287475585938 34.729156494140625,31.477203369140625 34.762115478515625,31.46759033203125 34.82460021972656,31.556167602539062 34.85069274902344,31.560287475585938 34.729156494140625))`;


export const GEOJSON_POLYGON: GeoJSON.Polygon = {
	"type": "Polygon",
	"coordinates": [[[35, 32, 0], [35, 33, 0], [36, 33, 0], [36, 32, 0], [35, 32, 0]]]
};
export const GEOJSON_POLYGON_WITH_HOLES: GeoJSON.Polygon = {
	"type": "Polygon",
	"coordinates": [
		[
			[31.414031982421875, 34.661865234375, 0],
			[31.440811157226562, 34.871978759765625, 0],
			[31.604232788085938, 34.87060546875, 0],
			[31.6131591796875, 34.70375061035156, 0],
			[31.414031982421875, 34.661865234375, 0]
		],
		[
			[31.560287475585938, 34.729156494140625, 0],
			[31.477203369140625, 34.762115478515625, 0],
			[31.46759033203125, 34.82460021972656, 0],
			[31.556167602539062, 34.85069274902344, 0],
			[31.560287475585938, 34.729156494140625, 0]
		]
	]
};

export const POLYGON_WITH_HOLES_COORDINATES: Coordinate[][] = [
	[
		new Coordinate(34.661865234375, 31.414031982421875, 0),
		new Coordinate(34.871978759765625, 31.440811157226562, 0),
		new Coordinate(34.87060546875, 31.604232788085938, 0),
		new Coordinate(34.70375061035156, 31.6131591796875, 0),
		new Coordinate(34.661865234375, 31.414031982421875, 0)
	],
	[
		new Coordinate(34.729156494140625, 31.560287475585938, 0),
		new Coordinate(34.762115478515625, 31.477203369140625, 0),
		new Coordinate(34.82460021972656, 31.46759033203125, 0),
		new Coordinate(34.85069274902344, 31.556167602539062, 0),
		new Coordinate(34.729156494140625, 31.560287475585938, 0)
	]
];
export const VIEW_BOUNDS: number[] = [29.852, 29.34, 40.34, 33.717];
export const FLY_TO_COORDINATES: Coordinate = new Coordinate(34.3, 32.2, 500000);
export const FLY_TO_COORDINATES_BOUNDS: ViewBounds = new ViewBounds(33.717, 29.34, 29.852, 40.34);
export const NETWORK_LINK_CHILDREN_BOUNDS: Coordinate[] = [new Coordinate(31.1824442647545,
	34.16840762186222), new Coordinate(31.655692981989404,
	34.58819091552248)];
export const NETWORK_LINK_ROOT_BOUNDS: Coordinate[] = [new Coordinate(30.22212363764117,
	33.14742863048605), new Coordinate(32.74945486785505,
	35.416200873813004)];

export enum KeyboardButton {
	ALT,
	CTRL,
	SHIFT
}

export enum MouseButton {
	RIGHT = 2
}

export const START_SCREEN_POSITION: ScreenCoordinate = new ScreenCoordinate(397, 385);
export const END_SCREEN_POSITION: ScreenCoordinate = new ScreenCoordinate(420, 385);
export const KML_ID: string = "1234";
export const KML_STR: string = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
	"<Document>\n" +
	"  <Style id=\"GroundStation\">\n" +
	"	<PolyStyle>\n" +
	"        <color>e8ff9257</color>\n" +
	"    </PolyStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"GroundStation1\">\n" +
	"	<PolyStyle>\n" +
	"        <color>#d312b0</color>\n" +
	"    </PolyStyle>\n" +
	"  </Style>\n" +
	"  <Placemark id=\"" + KML_ID + "\">\n" +
	"    <styleUrl>#GroundStation</styleUrl>\n" +
	"    <Polygon>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<outerBoundaryIs>\n" +
	"			<LinearRing>\n" +
	"				<coordinates>\n" +
	POLY_COORDINATES[0].longitude + "," + POLY_COORDINATES[0].latitude + "\n" +
	POLY_COORDINATES[1].longitude + "," + POLY_COORDINATES[1].latitude + "\n" +
	POLY_COORDINATES[2].longitude + "," + POLY_COORDINATES[2].latitude + "\n" +
	POLY_COORDINATES[3].longitude + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      			</coordinates>\n" +
	"			</LinearRing>\n" +
	"		</outerBoundaryIs>\n" +
	"    </Polygon>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "1" + "\">\n" +
	"    <styleUrl>#GroundStation1</styleUrl>\n" +
	"    <Polygon>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<outerBoundaryIs>\n" +
	"			<LinearRing>\n" +
	"				<coordinates>\n" +
	(POLY_COORDINATES[0].longitude + 2) + "," + POLY_COORDINATES[0].latitude + "\n" +
	(POLY_COORDINATES[1].longitude + 2) + "," + POLY_COORDINATES[1].latitude + "\n" +
	(POLY_COORDINATES[2].longitude + 2) + "," + POLY_COORDINATES[2].latitude + "\n" +
	(POLY_COORDINATES[3].longitude + 2) + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      			</coordinates>\n" +
	"			</LinearRing>\n" +
	"		</outerBoundaryIs>\n" +
	"    </Polygon>\n" +
	"  </Placemark>\n" +
	"</Document>";

export const KML_TIMESTAMP_STR: string = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
	"<Document>\n" +
	"  <Style id=\"GroundStation\">\n" +
	"	<PolyStyle>\n" +
	"        <color>e8ff9257</color>\n" +
	"    </PolyStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"GroundStation1\">\n" +
	"	<PolyStyle>\n" +
	"        <color>#d312b0</color>\n" +
	"    </PolyStyle>\n" +
	"  </Style>\n" +
	"  <Placemark id=\"" + KML_ID + "\">\n" +
	"    <styleUrl>#GroundStation</styleUrl>\n" +
	"    <Polygon>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<outerBoundaryIs>\n" +
	"			<LinearRing>\n" +
	"				<coordinates>\n" +
	POLY_COORDINATES[0].longitude + "," + POLY_COORDINATES[0].latitude + "\n" +
	POLY_COORDINATES[1].longitude + "," + POLY_COORDINATES[1].latitude + "\n" +
	POLY_COORDINATES[2].longitude + "," + POLY_COORDINATES[2].latitude + "\n" +
	POLY_COORDINATES[3].longitude + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      			</coordinates>\n" +
	"			</LinearRing>\n" +
	"		</outerBoundaryIs>\n" +
	"    </Polygon>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "1" + "\">\n" +
	"    <TimeStamp>\n" +
	"        <when>2013-11-14T08:25:11.000Z</when>\n" +
	"    </TimeStamp>" +
	"    <styleUrl>#GroundStation1</styleUrl>\n" +
	"    <Polygon>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<outerBoundaryIs>\n" +
	"			<LinearRing>\n" +
	"				<coordinates>\n" +
	(POLY_COORDINATES[0].longitude + 2) + "," + POLY_COORDINATES[0].latitude + "\n" +
	(POLY_COORDINATES[1].longitude + 2) + "," + POLY_COORDINATES[1].latitude + "\n" +
	(POLY_COORDINATES[2].longitude + 2) + "," + POLY_COORDINATES[2].latitude + "\n" +
	(POLY_COORDINATES[3].longitude + 2) + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      			</coordinates>\n" +
	"			</LinearRing>\n" +
	"		</outerBoundaryIs>\n" +
	"    </Polygon>\n" +
	"  </Placemark>\n" +
	"</Document>";
export const KML_TIMESPAN_STR: string = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
	"<Document>\n" +
	"  <Style id=\"GroundStation\">\n" +
	"	<PolyStyle>\n" +
	"        <color>e8ff9257</color>\n" +
	"    </PolyStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"GroundStation1\">\n" +
	"	<PolyStyle>\n" +
	"        <color>#d312b0</color>\n" +
	"    </PolyStyle>\n" +
	"  </Style>\n" +
	"  <Placemark id=\"" + KML_ID + "\">\n" +
	"    <styleUrl>#GroundStation</styleUrl>\n" +
	"    <Polygon>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<outerBoundaryIs>\n" +
	"			<LinearRing>\n" +
	"				<coordinates>\n" +
	POLY_COORDINATES[0].longitude + "," + POLY_COORDINATES[0].latitude + "\n" +
	POLY_COORDINATES[1].longitude + "," + POLY_COORDINATES[1].latitude + "\n" +
	POLY_COORDINATES[2].longitude + "," + POLY_COORDINATES[2].latitude + "\n" +
	POLY_COORDINATES[3].longitude + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      			</coordinates>\n" +
	"			</LinearRing>\n" +
	"		</outerBoundaryIs>\n" +
	"    </Polygon>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "1" + "\">\n" +
	"      <TimeSpan><begin>2018-11-07T19:15:23.000Z</begin><end>2018-11-14T22:00:03.000Z</end></TimeSpan>" +
	"    <styleUrl>#GroundStation1</styleUrl>\n" +
	"    <Polygon>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<outerBoundaryIs>\n" +
	"			<LinearRing>\n" +
	"				<coordinates>\n" +
	(POLY_COORDINATES[0].longitude + 2) + "," + POLY_COORDINATES[0].latitude + "\n" +
	(POLY_COORDINATES[1].longitude + 2) + "," + POLY_COORDINATES[1].latitude + "\n" +
	(POLY_COORDINATES[2].longitude + 2) + "," + POLY_COORDINATES[2].latitude + "\n" +
	(POLY_COORDINATES[3].longitude + 2) + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      			</coordinates>\n" +
	"			</LinearRing>\n" +
	"		</outerBoundaryIs>\n" +
	"    </Polygon>\n" +
	"  </Placemark>\n" +
	"</Document>";
export const KML_NETWORK_LINK: string = "test_assets/kml_examples/networklink/kml_networklink_test.kml";

export const KML_POINT_COORDINATE: Coordinate = new Coordinate(32, 37, 0);
export const HOVER_COLOR_RGBA: string = "rgba(255,2,3,1)";
export const ORIGINAL_COLOR_HEX: string = "#ff9257";
export const KML_ENTITY_COLOR: string = "ff5792ff";
export const KML_HOVER_STR: string = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
	"<Document>\n" +
	"  <Style id=\"line_style\">\n" +
	"	<LineStyle>\n" +
	"        <color>" + KML_ENTITY_COLOR + "</color>\n" +
	"    </LineStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"point_style\">\n" +
	"	<IconStyle>\n" +
	"		<color>" + KML_ENTITY_COLOR + "</color>\n" +
	"		<scale>1.5</scale>\n" +
	"		<Icon><href>test_assets/placemark.png</href></Icon>\n" +
	"	</IconStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"multigeometry_style\">\n" +
	"	<LineStyle>\n" +
	"        <color>" + KML_ENTITY_COLOR + "</color>\n" +
	"    </LineStyle>\n" +
	"	<IconStyle>\n" +
	"		<color>" + KML_ENTITY_COLOR + "</color>\n" +
	"		<scale>1.5</scale>\n" +
	"		<Icon><href>test_assets/placemark.png</href></Icon>\n" +
	"	</IconStyle>\n" +
	"  </Style>\n" +
	"  <Placemark id=\"" + KML_ID + "\">\n" +
	"    <styleUrl>#line_style</styleUrl>\n" +
	"    <LineString>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<coordinates>\n" +
	POLY_COORDINATES[0].longitude + "," + POLY_COORDINATES[0].latitude + "\n" +
	POLY_COORDINATES[1].longitude + "," + POLY_COORDINATES[1].latitude + "\n" +
	POLY_COORDINATES[2].longitude + "," + POLY_COORDINATES[2].latitude + "\n" +
	POLY_COORDINATES[3].longitude + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      	</coordinates>\n" +
	"    </LineString>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "1" + "\">\n" +
	"    <styleUrl>#point_style</styleUrl>\n" +
	"    <Point>\n" +
	"		<coordinates>\n" +
	KML_POINT_COORDINATE.longitude + "," + KML_POINT_COORDINATE.latitude + "\n" +
	"      	</coordinates>\n" +
	"    </Point>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "2" + "\">\n" +
	"    <styleUrl>#multigeometry_style</styleUrl>\n" +
	"	<MultiGeometry>\n" +
	"    <Point>\n" +
	"		<coordinates>\n" +
	KML_POINT_COORDINATE.longitude + "," + KML_POINT_COORDINATE.latitude + "\n" +
	"      	</coordinates>\n" +
	"    </Point>\n" +
	"    <LineString>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<coordinates>\n" +
	POLY_COORDINATES[0].longitude + "," + POLY_COORDINATES[0].latitude + "\n" +
	POLY_COORDINATES[1].longitude + "," + POLY_COORDINATES[1].latitude + "\n" +
	POLY_COORDINATES[2].longitude + "," + POLY_COORDINATES[2].latitude + "\n" +
	POLY_COORDINATES[3].longitude + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      	</coordinates>\n" +
	"    </LineString>\n" +
	"	</MultiGeometry>\n" +
	"  </Placemark>\n" +
	"</Document>";

export const KML_HOVER_STR_2: string = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
	"<Document>\n" +
	"  <Style id=\"line_style\">\n" +
	"	<LineStyle>\n" +
	"        <color>" + KML_ENTITY_COLOR + "</color>\n" +
	"    </LineStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"point_style\">\n" +
	"	<IconStyle>\n" +
	"		<color>" + KML_ENTITY_COLOR + "</color>\n" +
	"		<scale>1.5</scale>\n" +
	"		<Icon><href>test_assets/placemark.png</href></Icon>\n" +
	"	</IconStyle>\n" +
	"  </Style>\n" +
	"  <Style id=\"multigeometry_style\">\n" +
	"	<LineStyle>\n" +
	"        <color>" + KML_ENTITY_COLOR + "</color>\n" +
	"    </LineStyle>\n" +
	"	<IconStyle>\n" +
	"		<color>" + KML_ENTITY_COLOR + "</color>\n" +
	"		<scale>1.5</scale>\n" +
	"		<Icon><href>test_assets/placemark.png</href></Icon>\n" +
	"	</IconStyle>\n" +
	"  </Style>\n" +
	"  <Placemark id=\"" + KML_ID + "11" + "\">\n" +
	"    <styleUrl>#line_style</styleUrl>\n" +
	"    <LineString>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<coordinates>\n" +
	(POLY_COORDINATES[0].longitude + 1) + "," + POLY_COORDINATES[0].latitude + "\n" +
	(POLY_COORDINATES[1].longitude + 1) + "," + POLY_COORDINATES[1].latitude + "\n" +
	(POLY_COORDINATES[2].longitude + 1) + "," + POLY_COORDINATES[2].latitude + "\n" +
	(POLY_COORDINATES[3].longitude + 1) + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      	</coordinates>\n" +
	"    </LineString>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "11" + "\">\n" +
	"    <styleUrl>#point_style</styleUrl>\n" +
	"    <Point>\n" +
	"		<coordinates>\n" +
	(KML_POINT_COORDINATE.longitude + 1) + "," + KML_POINT_COORDINATE.latitude + "\n" +
	"      	</coordinates>\n" +
	"    </Point>\n" +
	"  </Placemark>\n" +
	"  <Placemark id=\"" + KML_ID + "12" + "\">\n" +
	"    <styleUrl>#multigeometry_style</styleUrl>\n" +
	"	<MultiGeometry>\n" +
	"    <Point>\n" +
	"		<coordinates>\n" +
	(KML_POINT_COORDINATE.longitude + 1) + "," + KML_POINT_COORDINATE.latitude + "\n" +
	"      	</coordinates>\n" +
	"    </Point>\n" +
	"    <LineString>\n" +
	"		<altitudeMode>clampToToGround</altitudeMode>\n" +
	"		<coordinates>\n" +
	(POLY_COORDINATES[0].longitude + 1) + "," + POLY_COORDINATES[0].latitude + "\n" +
	(POLY_COORDINATES[1].longitude + 1) + "," + POLY_COORDINATES[1].latitude + "\n" +
	(POLY_COORDINATES[2].longitude + 1) + "," + POLY_COORDINATES[2].latitude + "\n" +
	(POLY_COORDINATES[3].longitude + 1) + "," + POLY_COORDINATES[3].latitude + "\n" +
	"      	</coordinates>\n" +
	"    </LineString>\n" +
	"	</MultiGeometry>\n" +
	"  </Placemark>\n" +
	"</Document>";