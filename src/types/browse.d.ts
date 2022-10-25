import { Collection, ConstructorClientOptions, ErrorData, Facet, Feature, Group, RequestFeature, RequestFeatureVariant, ResultSources, SortOption } from "./types";
import EventDispatcher from "./event-dispatcher";

/*********
 *
 * 	Browse
 *
 *********/
export = Browse;

interface IBrowseParameters {
	page?: number;
	offset?: number;
	resultsPerPage?: number;
	filters?: Record<string, any>;
	sortBy?: string;
	sortOrder?: string;
	section?: string;
	fmtOptions?: object;
	preFilterExpression: Record<string, any>;
	hiddenFields?: string[];
	hiddenFacets?: string[];
	variationsMap?: Record<string, any>;
	qs?: Record<string, any>;
}

declare class Browse {
	constructor(options: ConstructorClientOptions);
	options: ConstructorClientOptions;
	eventDispatcher: EventDispatcher;

	getBrowseResults(
		filterName: string,
		filterValue: string,
		parameters?: IBrowseParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Browse.GetBrowseResultsResponse>;

	getBrowseResultsForItemIds(
		itemIds: string[],
		parameters?: Omit<IBrowseParameters, "preFilterExpression" | "preFilterExpression">,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Browse.GetBrowseResultsForItemIdsResponse>;

	getBrowseGroups(
		parameters: Pick<IBrowseParameters, "filters" | "section" | "fmtOptions">,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Browse.GetBrowseGroupsResponse>;

	getBrowseFacets(
		parameters?: Pick<IBrowseParameters, "page" | "offset" | "section" | "fmtOptions"| "resultsPerPage">,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Browse.GetBrowseFacetsResponse>;

	getBrowseFacetOptions(
		facetName: string,
		parameters?: Pick<IBrowseParameters, "section" | "fmtOptions">,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Browse.GetBrowseFacetOptionsResponse>;
}

/***********
 *
 * 	Browse results returned from server
 *
 ***********/
declare namespace Browse {
	export type GetBrowseResultsResponse = BrowseResponse<GetBrowseResultsResponseData>;
	export type GetBrowseResultsForItemIdsResponse = BrowseResponse<GetBrowseResultsResponseData>;
	export type GetBrowseGroupsResponse = BrowseResponse<Pick<GetBrowseResultsResponseData, "result_sources" | "groups" | "refined_content">>;
	export type GetBrowseFacetsResponse = BrowseResponse<Pick<GetBrowseResultsResponseData, "facets" | "total_num_results">>;
	export type GetBrowseFacetOptionsResponse = BrowseResponse<Pick<GetBrowseResultsResponseData, "facets">>;
}

interface BrowseResponse<ResponseType> extends Record<string, any> {
	request?: Partial<Request>;
	response?: Partial<ResponseType>;
	result_id?: string;
	ad_based?: boolean;

}

interface GetBrowseResultsResponseData extends Record<string, any> {
	result_sources: Partial<ResultSources>;
	facets: Partial<Facet>[];
	groups: Partial<Group>[];
	results: Partial<BrowseResultData>[];
	sort_options: Partial<SortOption>[];
	refined_content: Record<string, any>[];
	total_num_results: number;
	features: Partial<Feature>[];
	collection: Partial<Collection>
}

interface BrowseResultData extends Record<string, any> {
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

interface Request extends Record<string, any> {
	browse_filter_name: string;
	browse_filter_value: string;
	filter_match_types: Record<string, any>,
	filters: Record<string, any>,
	fmt_options: Record<string, any>,
	num_results_per_page: number;
	page: number,
	section: string,
	sort_by: string,
	sort_order: string,
	term: string;
	query: string;
	features: Partial<RequestFeature>;
	feature_variants: Partial<RequestFeatureVariant>;
	searchandized_items: Record<string, any>;
}