import {
  ConstructorClientOptions,
  Facet,
  Feature,
  FmtOption,
  Group,
  NetworkParameters,
  RequestFeature,
  RequestFeatureVariant,
  ResultSources,
  SortOption,
} from ".";
import EventDispatcher from "./event-dispatcher";

export default Search;

export interface SearchParameters {
  page?: number;
  offset?: number;
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
    networkParameters?: NetworkParameters
  ): Promise<SearchResponse>;
}

/***********
 * 	search results returned from server
 ***********/
 export interface SearchResponse {
  request: Partial<SearchRequestType>;
  response: Partial<SearchResponseType | Redirect>;
  result_id: string;
}

export interface SearchResponseType extends Record<string, any> {
  result_sources: Partial<ResultSources>;
  facets: Partial<Facet>[];
  groups: Partial<Group>[];
  results: Partial<Result>[];
  sort_options: Partial<SortOption>[];
  refined_content: Record<string, any>[];
  total_num_results: number;
  features: Partial<Feature>[];
}

export interface SearchRequestType extends Record<string, any> {
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

export interface Result extends Record<string, any> {
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

export interface Redirect extends Record<string, any> {
  redirect: {
    data: {
      match_id: number;
      rule_id: number;
      url: string;
      [key: string]: any;
    };
    matched_terms: string[];
    matched_user_segments: string[];
  };
}
