import { BaseLayer } from "./BaseLayer";

export class RasterLayer extends BaseLayer {

	private readonly DEFAULT_IMAGE_SRC = "LINK";

	public engName: string;

	public globeType: string;

	public peimaYear: number;

	public peimaTTT: string;

	public imageSrc: string;

	public links?: { [id: string]: string }; // Object has properties: google_earth, google_maps, wms

	constructor(engName: string, globeType: string, peimaYear: number, peimaTTT: string, name: string, links?: { [id: string]: string }) {
		super(name);
		this.engName = engName;
		this.globeType = globeType;
		this.peimaYear = peimaYear;
		this.peimaTTT = peimaTTT;
		this.imageSrc = this.DEFAULT_IMAGE_SRC + this.engName;
		this.links = links;
	}
}