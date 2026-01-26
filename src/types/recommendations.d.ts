import { ConstructorClientOptions, NetworkParameters, VariationsMap, FilterExpression, FmtOptions } from '.';
import EventDispatcher from './event-dispatcher';

export default Recommendations;

export interface RecommendationsParameters {
  itemIds?: string | string[];
  numResults?: number;
  section?: string;
  term?: string;
  filters?: Record<string, any>;
  variationsMap?: VariationsMap;
  hiddenFields?: string[];
  preFilterExpression?: FilterExpression;
  fmtOptions?: FmtOptions;
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
