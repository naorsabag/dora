
/**
 * Handles KML object.
 */
export interface IKMLGeometryCollection {

	/**
	 * Gets id of the KML object.
	 * @returns Id of the KML object.
	 */
	getId(): string;

	/**
	 * Gets visibility state of the KML object - true for shown, false for hidden.
	 */
	getVisibility(): boolean;

	/**
	 * Set the visibility state of the KML object.
	 * @param newState - The new visibility state for the KML - true to show, false to hide.
	 * @returns Promise for chaining state.
	 */
	setVisibility(newState: boolean): Promise<void>;

	/**
	 * Focusing map view on the KML Object.
	 * @param val - TODO: [By Naor Sabag]
	 * @returns A promise object for chaining asynchronous
	 */
	focus(val: number): Promise<boolean>;
}