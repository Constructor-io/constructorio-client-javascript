import {
	ConstructorClientOptions,
	ErrorData,
	Facet,
	Feature,
	FmtOption,
	Group,
	RequestFeature,
	RequestFeatureVariant,
	ResultSources,
	SortOption,
} from "./types";
import EventDispatcher from "./event-dispatcher";

/***********
 *
 * 	SEARCH
 *
 ***********/

export = Search;

interface SearchParameters {
	page?: number;
	resultsPerPage?: number;
	filters?: Record<string, any>;
	sortBy?: string;
	sortOrder?: string;
	section?: string;
	fmtOptions?: Record<string, any>;
	hiddenFields?: string[];
	hiddenFacets?: string[];
	variationsMap?: Record<string, any>;
}
declare class Search {
	constructor(options: ConstructorClientOptions);
	options: ConstructorClientOptions;
	eventDispatcher: EventDispatcher;
	getSearchResults(
		query: string,
		parameters?: SearchParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Search.SearchResponse>;
}

/***********
 *
 * 	search results returned from server
 *
 ***********/
interface Response extends Record<string, any> {
	result_sources: Partial<ResultSources>;
	facets: Partial<Facet>[];
	groups: Partial<Group>[];
	results: Partial<Result>[];
	sort_options: Partial<SortOption>[];
	refined_content: Record<string, any>[];
	total_num_results: number;
	features: Partial<Feature>[];
}

interface Request extends Record<string, any> {
	page: number;
	num_results_per_page: number;
	section: string;
	blacklist_rules: boolean;
	term: string;
	fmt_options: Partial<FmtOption>;
	sort_by: string;
	sort_order: string;
	features: Partial<RequestFeature>;
	feature_variants: Partial<RequestFeatureVariant>;
	searchandized_items: Record<string, any>;
}

interface Result extends Record<string, any> {
	matched_terms: string[];
	data: {
		id: string;
		[key: string]: any;
	};
	value: string;
	is_slotted: false;
	labels: Record<string, any>;
	variations: Record<string, any>[];
}

declare namespace Search {
	export interface SearchResponse {
		request: Partial<Request>;
		response: Partial<Response | Redirect>;
		result_id: string;
	}
}

interface Redirect extends Record<string, any> {
	redirect: {
		data: {
			match_id: number;
			rule_id: number;
			url: string;
			[key: string]: any;
		};
		matched_terms: string[];
		matched_user_segments: string[];
	}
}
