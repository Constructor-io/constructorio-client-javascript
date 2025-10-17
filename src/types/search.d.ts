import {
  BrowseResultData,
  ConstructorClientOptions,
  Facet,
  Feature,
  FilterExpression,
  FmtOptions,
  Group,
  NetworkParameters,
  RequestFeature,
  RequestFeatureVariant,
  ResultSources,
  SortOption,
  VariationsMap,
} from '.';
import EventDispatcher from './event-dispatcher';

export default Search;

export interface SearchParameters {
  page?: number;
  offset?: number;
  resultsPerPage?: number;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: string;
  section?: string;
  fmtOptions?: FmtOptions;
  preFilterExpression?: FilterExpression;
  hiddenFields?: string[];
  hiddenFacets?: string[];
  variationsMap?: VariationsMap;
  qsParam?: Record<string, any>;
  filterMatchTypes?: Record<string, 'all'| 'any' | 'none'>
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

  getVoiceSearchResults(
    query: string,
    parameters?: Omit<SearchParameters, 'filters' | 'sortBy' | 'sortOrder'>,
    networkParameters?: NetworkParameters
  ): Promise<SearchResponse>;
}

/** *********
 * search results returned from server
 ********** */
export interface SearchResponse {
  request: SearchRequestType;
  response: SearchResponseType | Redirect;
  result_id: string;
}

export interface SearchResponseType extends Record<string, any> {
  result_sources: ResultSources;
  facets: Facet[];
  groups: Group[];
  results: Result[];
  sort_options: SortOption[];
  refined_content: Record<string, any>[];
  total_num_results: number;
  features: Feature[];
  related_searches?: Record<string, any>[];
  related_browse_pages?: Record<string, any>[];
}

export interface SearchRequestType extends Record<string, any> {
  page: number;
  num_results_per_page: number;
  section: string;
  blacklist_rules?: boolean;
  term: string;
  fmt_options: FmtOptions;
  sort_by: string;
  sort_order: string;
  features: Partial<RequestFeature>;
  feature_variants: Partial<RequestFeatureVariant>;
  searchandized_items: Record<string, any>;
  original_query?: string;
  variations_map?: VariationsMap;
  pre_filter_expression?: FilterExpression;
}

export type Result = BrowseResultData;

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
