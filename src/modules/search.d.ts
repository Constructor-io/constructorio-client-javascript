import { IConstructorClientOptions } from "..";
import { EventDispatcher } from "../utils/event-dispatcher";

/***********
 *
 * 	SEARCH
 *
 ***********/

export = Search;

interface ISearchParameters {
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
	): Promise<any>;
}

export type ValidResponse = Results | Redirect;
export type Response = ValidResponse | Error;

export type Results = RequestContainer & {
	response: {
		results: Result[];
		facets: Facet[];
		groups: Group[];
		totalNumResults: number;
		refinedContents: ContentRuleData[];
	};
};

export type Redirect = RequestContainer & {
	response: {
		redirect: {
			data: {
				matchId: number;
				ruleId: number;
				url: string;
			};
			matchedTerms: string[];
			matchedUserSegments: string[];
		};
	};
};

type RequestContainer = {
	request: Request;
};

export type Request = {
	page: number;
	numResultsPerPage: number;
	section: string;
};

export type Facet = RangeFacet | OptionFacet;

export type BaseFacet = {
	displayName: string;
	name: string;
	hidden: boolean;
};

export type RangeFacet = BaseFacet & {
	max: number;
	min: number;
	type: "range";
};

export type OptionFacet = BaseFacet & {
	options: FacetOption[];
	type: "multiple" | "single" | "hierarchical";
};

export type FacetOption = {
	count: number;
	displayName: string;
	value: string;
	options?: FacetOption[];
	range?: ["-inf" | number, "inf" | number];
};

export type BaseGroup = {
	displayName: string;
	groupId: string;
};

export type Group = BaseGroup & {
	count: number;
	parents: BaseGroup[];
	children: Group[];
};

export type SearchClientRenderGroupProps = {
	group: GroupData;
	selector: boolean;
};

export type Result = {
	data: {
		id: string;
	};
	value: string;
	isSlotted: boolean;
	labels: {
		isSponsored: boolean;
		[key: string]: any;
	};
	explanation?: RankingExplanation;
	rerankerExplanation?: RerankerExplanation[];
};

export type RankingExplanation = {
	finalScore?: number;
	computedScore?: number;
	source?: ResultSource;
	conversionRulesBoost?: number;
	personalizationBoost?: number;
	queryRefinementBoost?: number;
	tagRefinementBoost?: number;
	filterRefinementBoost?: number;
	skuBoost?: number;
	rerankerBoost?: number;
	rerankerPrediction?: number;
};

export type RerankerExplanation = {
	direction: number;
	featureGroup: string;
	impactValue: number;
};

export type Error = {
	message: string;
};

// search results returned from server
export type ResponseData = ResultsData | RedirectData | ErrorData;

export type ResultsData = {
	request: RequestData;
	response: ResultsResponseData;
};

export type ResultsResponseData = {
	refined_content: ContentRuleData[];
	results: ResultData[];
	facets: FacetData[];
	groups: GroupData[];
	total_num_results: number;
	features?: FeatureData[];
};

export type RedirectData = {
	request: RequestData;
	response: RedirectResponseData;
};

export type RedirectResponseData = {
	redirect: RedirectValueData;
};

export type RedirectValueData = {
	data: {
		match_id: number;
		rule_id: number;
		url: string;
	};
	matched_terms: string[];
	matched_user_segments: string[];
};

export type RequestData = {
	page: number;
	num_results_per_page: number;
	section: string;
};

export type FacetData = RangeFacetData | OptionFacetData;

type BaseFacetData = {
	display_name: string;
	name: string;
	hidden: boolean;
};

export type ContentRuleData = {
	data: Record<string, string>;
};

export type RangeFacetData = BaseFacetData & {
	max: number;
	min: number;
	type: "range";
};

export type OptionFacetData = BaseFacetData & {
	options: FacetOptionData[];
	type: "multiple" | "single";
};

export type FacetOptionData = {
	count: number;
	display_name: string | null;
	value: string;
	range?: ["-inf" | number, "inf" | number];
	options?: FacetOptionData[];
};

export type BaseGroupData = {
	display_name: string;
	group_id: string;
};

export type GroupData = BaseGroupData & {
	count: number;
	parents: BaseGroupData[];
	children: GroupData[];
};

export type ResultData = {
	explanation?: RankingExplanationData;
	reranker_explanation?: RerankerExplanationData[];
	data: {
		id: string;
		groups?: ResultGroupData[];
		image_url?: string;
	};
	value: string;
	is_slotted: boolean;
	labels?: {
		is_sponsored?: boolean;
		[key: string]: any;
	};
};

export type ResultSource =
	| "COGNITIVE_EMBEDDINGS"
	| "INVERTED_INDEX"
	| "SLOTTED";

export type RankingExplanationData = {
	final_score?: number;
	computed_score?: number;
	source?: ResultSource;
	conversion_rules_boost?: number;
	personalization_boost?: number;
	query_refinement_boost?: number;
	tag_refinement_boost?: number;
	filter_refinement_boost?: number;
	sku_boost?: number;
	reranker_boost?: number;
	reranker_prediction?: number;
};

export type RerankerExplanationData = {
	direction: number;
	feature_group: string;
	impact_value: number;
};

export type ResultGroupData = {
	display_name: string;
	group_id: string;
	path: string;
	path_list: {
		display_name: string;
		id: string;
	}[];
};

export type ErrorData = {
	message: string;
};

export type FeatureData = {
	display_name: string;
	enabled: boolean;
	feature_name: string;
	variant: {
		name: string;
		display_name: string;
	};
};
