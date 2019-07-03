export interface IViewBounds {
	north: number;
	south: number;
	west: number;
	east: number;

	isEqual(other: IViewBounds): boolean;
}