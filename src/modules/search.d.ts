import { IConstructorClientOptions } from "..";
import { EventDispatcher } from "../utils/event-dispatcher";

/***********
 *
 * 	SEARCH
 *
 ***********/

export = Search;

type Nullable<T> = T | null;

interface ISearchParameters {
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
	constructor(options: IConstructorClientOptions);
	options: anIConstructorClientOptionsy;
	eventDispatcher: EventDispatcher;
	getSearchResults(
		query: string,
		parameters?: ISearchParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<ISearchResponse | ErrorData>;
}

/***********
 *
 * 	search results returned from server
 *
 ***********/
interface ISearchResponse {
	request: IRequest;
	response: IResponse | IRedirect;
	result_id: string;
}

interface IResponse extends Record<string, any> {
	result_sources: Partial<IResultSources>;
	facets: Partial<IFacet>[];
	groups: Partial<IGroup>[];
	results: Partial<IResult>[];
	sort_options: Partial<ISortOption>[];
	refined_content: Record<string, any>[];
	total_num_results: number;
	features: Partial<IFeature>[];
}

interface IRequest extends Record<string, any> {
	page: number;
	num_results_per_page: number;
	section: string;
	blacklist_rules: boolean;
	term: string;
	fmt_options: Partial<IFmtOption>;
	sort_by: string;
	sort_order: string;
	features: Partial<IRequestFeature>;
	feature_variants: Partial<IRequestFeatureVariant>;
	searchandized_items: Record<string, any>;
}

interface IResultSources extends Record<string, any> {
	token_match: { count: number };
	embeddings_match: { count: number };
}

interface ISortOption extends Record<string, any> {
	sort_by: string;
	display_name: string;
	sort_order: string;
	status: string;
}

interface IFeature extends Record<string, any> {
	feature_name: string;
	display_name: string;
	enabled: boolean;
	variant: {
		name: string;
		display_name: string;
	};
}

interface IFmtOption extends Record<string, any> {
	groups_start: string;
	groups_max_depth: number;
}

interface IRequestFeature extends Record<string, any> {
	query_items: boolean;
	auto_generated_refined_query_rules: boolean;
	manual_searchandizing: boolean;
	personalization: boolean;
	filter_items: boolean;
}

interface IRequestFeatureVariant extends Record<string, any> {
	query_items: string;
	auto_generated_refined_query_rules: string;
	manual_searchandizing: string | null;
	personalization: string;
	filter_items: string;
}

type IFacet = RangeFacet | OptionFacet;

interface BaseFacet extends Record<string, any> {
	data: Record<string, any>;
	status: Record<string, any>;
	display_name: string;
	name: string;
	hidden: boolean;
}

interface RangeFacet extends BaseFacet, Record<string, any> {
	max: number;
	min: number;
	type: "range";
}

interface OptionFacet extends BaseFacet, Record<string, any> {
	options: IFacetOption[];
	type: "multiple" | "single" | "hierarchical";
}

interface IFacetOption extends Record<string, any> {
	count: number;
	display_name: string;
	value: string;
	options?: IFacetOption[];
	range?: ["-inf" | number, "inf" | number];
	status: string;
}

interface IGroup extends IBaseGroup, Record<string, any> {
	count: number;
	data: Record<string, any>;
	parents: IBaseGroup[];
	children: IGroup[];
}

interface IBaseGroup extends Record<string, any> {
	display_name: string;
	group_id: string;
}

interface IResult {
	matched_terms: string[];
	data: {
		id: string;
	};
	value: string;
	is_slotted: false;
	labels: Record<string, any>;
	variations: Record<string, any>[];
}


interface IRedirect extends Record<string, any> {
	redirect: {
		data: {
			match_id: number;
			rule_id: number;
			url: string;
		};
		matched_terms: string[];
		matched_user_segments: string[];
	}
};

export type ErrorData = {
	message: string;
};
