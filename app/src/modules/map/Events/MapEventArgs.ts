export class MapEventArgs {

	public latitude: number;
	public longitude: number;
	public altitude: number;
	public button: number;
	public ctrlPressed: boolean;
	public altPressed: boolean;
	public shiftPressed: boolean;
	public clientX: number;
	public clientY: number;
	public endPosX: number;
	public endPosY: number;
	public originalObject: any;
	private _preventDefault: any = null;

	constructor(lon: number,
				lat: number,
				alt: number = 0,
				button?: number,
				ctrlPressed?: boolean,
				altPressed?: boolean,
				shiftPressed?: boolean,
				clientX?: number,
				clientY?: number,
				preventDefault?: any,
				originalObject?: any,
				endPosX?: number,
				endPosY?: number) {

		this.latitude = lat;
		this.longitude = lon;
		this.altitude = alt;
		this.clientX = clientX || 0;
		this.clientY = clientY || 0;
		this.endPosX = endPosX;
		this.endPosY = endPosY;
		this.button = button || 0;
		this.ctrlPressed = ctrlPressed || false;
		this.altPressed = altPressed || false;
		this.shiftPressed = shiftPressed || false;
		if (preventDefault != null && typeof preventDefault === "function") {
			this._preventDefault = preventDefault;
		}

		if (originalObject !== null && originalObject !== "undefined") {
			this.originalObject = originalObject;
		}
	}

	public preventDefault(): void {
		/*
			a bound function (function that used .bind()) does not have a prototype,
			so if the preventDefault was already bound you can just call it
		*/
		if (this._preventDefault != null && this._preventDefault.hasOwnProperty("prototype")) {
			this._preventDefault.call(this.originalObject);
		} else if (this._preventDefault != null ) {
			this._preventDefault();
		}
	}
}
