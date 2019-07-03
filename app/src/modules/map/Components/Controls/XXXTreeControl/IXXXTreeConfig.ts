import { XXXLayer } from "./XXXLayer/XXXLayer";

export interface IXXXTreeConfig {
	/**
	 * an array of root layers/folders to build the XXX tree (folders can have children). Not mandatory - a default layers source will be used if not provided.
	 */
	layers?: XXXLayer[];
	/**
	 * if true, the state of the tree will be saved in the browser, including the open branches and checked nodes. Defaults to true.
	 */
	rememberState?: boolean;
}