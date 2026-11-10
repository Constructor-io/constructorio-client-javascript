import { ConstructorClientOptions, NetworkParameters, VariationsMap, FilterExpression, FmtOptions } from '.';
import EventDispatcher from './event-dispatcher';

export default Recommendations;

export interface RecommendationsParameters {
  itemIds?: string | string[];
  variationId?: string;
  numResults?: number;
  section?: string;
  term?: string;
  filters?: Record<string, any>;
  variationsMap?: VariationsMap;
  hiddenFields?: string[];
  preFilterExpression?: FilterExpression;
  fmtOptions?: FmtOptions;
}

/** Parameters that can be set per pod on a page request. Each replaces the page-wide value. */
export interface RecommendationPagePodOverride {
  numResults?: number;
  filters?: Record<string, any>;
  filterMatchTypes?: Record<string, 'all' | 'any' | 'none'>;
  preFilterExpression?: FilterExpression;
  fmtOptions?: FmtOptions;
  hiddenFields?: string[];
  variationsMap?: VariationsMap;
}

export interface RecommendationPageParameters extends RecommendationPagePodOverride {
  itemIds?: string | string[];
  variationId?: string;
  section?: string;
  term?: string;
  podOverrides?: Record<string, RecommendationPagePodOverride>;
}

declare class Recommendations {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  eventDispatcher: EventDispatcher;

  getRecommendations(
    podId: string,
    parameters?: RecommendationsParameters,
    networkParameters?: NetworkParameters
  ): Promise<RecommendationsResponse>;

  getRecommendationPage(
    pageId: string,
    parameters?: RecommendationPageParameters,
    networkParameters?: NetworkParameters
  ): Promise<RecommendationPageResponse>;
}

/** *********
 * Recommendations results returned from server
 ********** */
export interface RecommendationsResponse extends Record<string, any> {
  request: Partial<RecommendationsRequestType>;
  response: Partial<RecommendationsResponseType>;
  result_id: string;
}

export interface RecommendationsRequestType extends Record<string, any> {
  num_results: number;
  item_id: string | string[];
  variation_id: string;
  filters: {
    group_id: string;
    [key: string]: any;
  };
  pod_id: string;
}

export interface RecommendationsResponseType extends Record<string, any> {
  results: Partial<RecommendationsResultType>[];
  total_num_results: number;
  pod: {
    id: string;
    display_name: string;
    [key: string]: any;
  };
}

export interface RecommendationsResultType extends Record<string, any> {
  matched_terms: string[];
  data: Record<string, any>;
  value: string;
  is_slotted: boolean;
  labels: Record<string, any>;
  strategy: {
    id: string;
    [key: string]: any;
  };
}

/** *********
 * Recommendation page results returned from server
 ********** */
export interface RecommendationPageResponse extends Record<string, any> {
  request: Record<string, any>;
  response: RecommendationPageResponseType;
  /** Identifies the page request. Not a tracking id: use each pod's `result_id`. */
  result_id: string;
}

export interface RecommendationPageResponseType extends Record<string, any> {
  page_id: string;
  display_name: string;
  page_type: string;
  pods: RecommendationPagePod[];
}

export interface RecommendationPagePod extends Record<string, any> {
  pod_id: string;
  /** The pod's effective request: page-wide parameters with this pod's overrides applied */
  request: Partial<RecommendationsRequestType>;
  response: Partial<RecommendationsResponseType>;
  /** Send this with the pod's recommendation view and click events */
  result_id: string;
}
