export class RasterInfo {
	public Name: string;
	public DisplayName: string;

	constructor(public QueryId: string) {
		// extract name from []
		let array: RegExpExecArray = /\[(.*?)\]/g.exec(QueryId);
		if (array && array.length > 0) {
			this.Name = array[1];
		} else {
			this.Name = QueryId;
		}
	}
}