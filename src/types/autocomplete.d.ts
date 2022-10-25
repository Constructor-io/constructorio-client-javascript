import {
	ConstructorClientOptions,
	RequestFeature,
	RequestFeatureVariant,
} from "./types";
import EventDispatcher from "./event-dispatcher";

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

declare class Autocomplete {
	constructor(options: ConstructorClientOptions);
	options: ConstructorClientOptions;
	eventDispatcher: EventDispatcher;

	getAutocompleteResults(
		query: string,
		parameters?: IAutocompleteParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Autocomplete.AutocompleteResponse>;
}

/***********
 *
 * 	Autocomplete results returned from server
 *
 ***********/
declare namespace Autocomplete {
	export interface AutocompleteResponse extends Record<string, any> {
		request: Partial<Request>;
		sections: Record<string, Section>;
		result_id: string;
	}
}

interface Request extends Record<string, any> {
	num_results: number;
	term: string;
	query: string;
	features: Partial<RequestFeature>;
	feature_variants: Partial<RequestFeatureVariant>;
	searchandized_items: Record<string, any>;
}

type Section = Partial<SectionItem>[]

interface SectionItem extends Record<string, any> {
	data: Record<string, any>;
	is_slotted: boolean;
	labels: Record<string, any>;
	matched_terms: string[];
	value: string;
}
