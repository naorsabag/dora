import { ViewBounds } from "../Components/View/ViewBounds";
import { Coordinate } from "./Coordinate";
import { MapUtils } from "../MapUtils/MapUtils";


export class NetworklinkNode {
	public children: NetworklinkNode[];
	public dataSource: any;
	public isVisible: boolean = false;
	private readonly area: number = 0;

	constructor(public doc: Document, public bounds?: ViewBounds, public nodeNum?: number) {

		if (!bounds) {
			this.area = Number.POSITIVE_INFINITY;
			return;
		}

		let height: number = MapUtils.getLineLength([
			new Coordinate(bounds.north, bounds.west),
			new Coordinate(bounds.south, bounds.west)], "meters");
		let width: number = MapUtils.getLineLength([
			new Coordinate(bounds.north, bounds.west),
			new Coordinate(bounds.north, bounds.east)], "meters");
		this.area = height * width;
	}
}

