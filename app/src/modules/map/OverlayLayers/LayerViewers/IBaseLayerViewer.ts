export interface IBaseLayerViewer {

	addToMap(onError?: () => void): Promise<void>;

	remove(): Promise<void>;
}