import {
  BrowseFacet,
  Collection,
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

export default Browse;

export interface IBrowseParameters {
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
  filterMatchTypes?: Record<string, 'all' | 'any' | 'none'>;
}

declare class Browse {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  eventDispatcher: EventDispatcher;

  getBrowseResults(
    filterName: string,
    filterValue: string,
    parameters?: IBrowseParameters,
    networkParameters?: NetworkParameters
  ): Promise<GetBrowseResultsResponse>;

  getBrowseResultsForItemIds(
    itemIds: string[],
    parameters?: Omit<IBrowseParameters, 'qsParam'>,
    networkParameters?: NetworkParameters
  ): Promise<GetBrowseResultsForItemIdsResponse>;

  getBrowseGroups(
    parameters?: Pick<IBrowseParameters, 'filters' | 'section' | 'fmtOptions'>,
    networkParameters?: NetworkParameters
  ): Promise<GetBrowseGroupsResponse>;

  getBrowseFacets(
    parameters?: Pick<
      IBrowseParameters,
      'page' | 'offset' | 'section' | 'fmtOptions' | 'resultsPerPage'
    >,
    networkParameters?: NetworkParameters
  ): Promise<GetBrowseFacetsResponse>;

  getBrowseFacetOptions(
    facetName: string,
    parameters?: Pick<IBrowseParameters, 'section' | 'fmtOptions'>,
    networkParameters?: NetworkParameters
  ): Promise<GetBrowseFacetOptionsResponse>;
}

/** *********
 * Browse results returned from server
 ********** */
export interface BrowseResponse<ResponseType, OmittedRequestFields extends keyof BrowseRequestType>
  extends Record<string, any> {

  request: Omit<BrowseRequestType, OmittedRequestFields>;
  response: ResponseType;
  result_id: string;
  ad_based?: boolean;
}

export type GetBrowseResultsResponse =
  BrowseResponse<GetBrowseResultsResponseData, 'facet_name'>;
export type GetBrowseResultsForItemIdsResponse =
  BrowseResponse<GetBrowseResultsResponseData, 'facet_name'>;
export type GetBrowseGroupsResponse = BrowseResponse<
  Pick<
    GetBrowseResultsResponseData,
    'result_sources' | 'groups' | 'refined_content'
  >,
  'browse_filter_name' | 'browse_filter_value' | 'searchandized_items' | 'facet_name'
>;
export type GetBrowseFacetsResponse = BrowseResponse<
  GetBrowseFacetsResultsResponseData,
  'browse_filter_name' | 'browse_filter_value' | 'searchandized_items' | 'facet_name'
>;
export type GetBrowseFacetOptionsResponse = BrowseResponse<
  Pick<GetBrowseResultsResponseData, 'facets' | 'total_num_results'>,
  'browse_filter_name' | 'browse_filter_value' | 'searchandized_items'
>;

export interface GetBrowseResultsResponseData extends Record<string, any> {
  result_sources: ResultSources;
  facets: Facet[];
  groups: Group[];
  results: BrowseResultData[];
  sort_options: SortOption[];
  refined_content: Record<string, any>[];
  total_num_results: number;
  features: Feature[];
  collection?: Partial<Collection>;
  related_searches?: Record<string, any>[];
  related_browse_pages?: Record<string, any>[];
}

export interface GetBrowseFacetsResultsResponseData extends Record<string, any> {
  facets: BrowseFacet[];
  total_num_results: number;
}

export interface BrowseResultData extends Record<string, any> {
  matched_terms: string[];
  data: {
    id: string;
    [key: string]: any;
  };
  value: string;
  is_slotted: false;
  labels: Record<string, any>;
  variations?: Record<string, any>[];
  variations_map?: Record<string, any> | Record<string, any>[];
}

export interface BrowseRequestType extends Record<string, any> {
  browse_filter_name: string;
  browse_filter_value: string;
  filter_match_types?: Record<string, any>;
  filters?: Record<string, any>;
  fmt_options: FmtOptions;
  facet_name: string;
  num_results_per_page: number;
  page: number;
  section: string;
  sort_by: string;
  sort_order: string;
  term: string;
  query?: string;
  features: Partial<RequestFeature>;
  feature_variants: Partial<RequestFeatureVariant>;
  searchandized_items: Record<string, any>;
  variations_map?: VariationsMap;
  pre_filter_expression?: FilterExpression;
}
