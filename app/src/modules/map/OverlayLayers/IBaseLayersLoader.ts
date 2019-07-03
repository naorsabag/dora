export interface IBaseLayersLoader<T> {

	loadLayers(): Promise<T[]>;
}