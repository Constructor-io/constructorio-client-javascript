import { IConstructorClientOptions } from "..";
import { EventDispatcher } from "../utils/event-dispatcher";

/******************
 *
 * 	Recommendations
 *
 *****************/

export = Recommendations;

interface IRecommendationsParameters {
	itemIds?: string | string[];
	numResults?: number;
	section?: string;
	term?: string;
	filters?: object;
	variationsMap?: object;
}

declare class Recommendations {
	constructor(options: IConstructorClientOptions);
	options: IConstructorClientOptions;
	eventDispatcher: EventDispatcher;

	getRecommendations(
		podId: string,
		parameters?: IRecommendationsParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;
}
