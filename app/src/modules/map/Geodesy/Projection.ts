export class Projection {

	constructor(public epsg: number,
				public name: string,
				public units: string,
				public format?: string,
				public isUtm?: boolean,
				public is36Extended?: boolean,
				public format36?: string,
				public southEpsg?: number) {
		if (!format) {
			this.format = null;
		}
		if (!isUtm) {
			this.isUtm = false;
		}
		if (!format36) {
			this.format36 = null;
		}
		if (!is36Extended) {
			this.is36Extended = false;
		}
		if (!southEpsg) {
			this.southEpsg = null;
		}
	}
}