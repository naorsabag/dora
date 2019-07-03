/**
 * Created by T60352784 on 05/04/2017.
 */
export class MapError extends Error {
	FFFMessage: string;

	constructor(english: string, FFF: string) {
		super(english);
		this.FFFMessage = FFF;
	}
}