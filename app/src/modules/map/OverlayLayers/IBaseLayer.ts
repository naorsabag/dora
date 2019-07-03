export interface IBaseLayer {

	name: string;

	isSelected: boolean;

	addToMap(onError?: () => void): Promise<void>;

	remove(): Promise<void>;
}