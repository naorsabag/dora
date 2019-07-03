import { VectorSource } from "./Enums/VectorSource";
import { BaseLayer } from "./BaseLayer";
import { LayerType } from "./Enums/LayerType";

export class VectorLayer extends BaseLayer {

	public id: any;

	public source: VectorSource;

	public type: LayerType;

	public parentID?: number;

	public children?: VectorLayer[];

	constructor(id: any, source: VectorSource, name: string, type: LayerType, parentID?: number,
				children?: VectorLayer[]) {
		super(name);
		this.id = id;
		this.source = source;
		this.type = type;
		this.parentID = parentID;
		this.children = children;
	}
}