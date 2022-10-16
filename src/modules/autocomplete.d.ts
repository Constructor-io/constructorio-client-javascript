import { IConstructorClientOptions } from "..";
import { EventDispatcher } from "../utils/event-dispatcher";

/***************
 *
 * 	Autocomplete
 *
 ***************/
export = Autocomplete;

interface IAutocompleteParameters {
	numResults: number;
	filters: Record<string, any>;
	resultsPerSection: Record<string, number>;
	hiddenFields: string[];
	variationsMap: Record<string, any>;
}

interface IAutocompleteResponse {
	request: {
		num_results: number;
		term: string;
		features: {
			query_items: boolean;
			auto_generated_refined_query_rules: boolean;
			manual_searchandizing: boolean;
			personalization: boolean;
			filter_items: boolean;
		};
		feature_variants: {
			query_items: string;
			auto_generated_refined_query_rules: string;
			manual_searchandizing: string;
			personalization: string;
			filter_items: string;
		};
		searchandized_items: any;
	};
	response: {
		sections: {
			"Search Suggestions": any[];
			Products: any[];
		};
	};
	result_id: string;
}

declare class Autocomplete {
	constructor(options: IConstructorClientOptions);
	options: IConstructorClientOptions;
	eventDispatcher: EventDispatcher;

	getAutocompleteResults(
		query: string,
		parameters?: IAutocompleteParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<any>;
}