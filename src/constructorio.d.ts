import Search from "./modules/search";
import Browse from "./modules/browse";
import Autocomplete from "./modules/autocomplete";
import Recommendations from "./modules/recommendations";
import Tracker from "./modules/tracker";
import { IConstructorClientOptions } from ".";

export = ConstructorIO;

/*********************
 *
 * 	Constructor client
 *
 *********************/

declare class ConstructorIO {
	constructor(options: IConstructorClientOptions);
	private options: IConstructorClientOptions;
	search: Search;
	browse: Browse;
	autocomplete: Autocomplete;
	recommendations: Recommendations;
	tracker: Tracker;

	setClientOptions(options: IConstructorClientOptions): void;
}

declare namespace ConstructorIO {
	export { Tracker }
}