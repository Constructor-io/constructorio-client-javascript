import { IConstructorClientOptions } from "..";
import { EventDispatcher } from "../utils/event-dispatcher";

/*********
 *
 * 	Browse
 *
 *********/

import IConstructorClientOptions from "..";

export = Browse;

interface IBrowseParameters {
	page?: number;
	resultsPerPage?: number;
	filters?: object;
	sortBy?: string;
	sortOrder?: string;
	section?: string;
	fmtOptions?: object;
	hiddenFields?: string[];
	hiddenFacets?: string[];
	variationsMap?: object;
}

declare class Browse {
	constructor(options: IConstructorClientOptions);
	options: IConstructorClientOptions;
	eventDispatcher: EventDispatcher;

	getBrowseResults(
		filterName: string,
		filterValue: string,
		parameters?: IBrowseParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;

	getBrowseResultsForItemIds(
		itemIds: string[],
		parameters?: IBrowseParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;

	getBrowseGroups(
		parameters: IBrowseParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;

	getBrowseFacets(
		parameters?: {
			page?: number;
			section?: string;
		},
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;

	getBrowseFacetOptions(
		facetName: string,
		parameters?: {
			section?: string;
			fmtOptions?: {
				show_hidden_facets?: boolean;
			};
		},
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;
}
