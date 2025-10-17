import EventDispatcher from './event-dispatcher';

import ConstructorIO from './constructorio';

export default ConstructorIO;
export * from './search';
export * from './autocomplete';
export * from './quizzes';
export * from './recommendations';
export * from './browse';
export * from './tracker';
export * from './event-dispatcher';

export interface NetworkParameters extends Record<string, any> {
  timeout?: number;
}

export interface IdOptions extends Record<string, any> {
  base_url?: string;
  ip_address?: string;
  user_agent?: string;
  timeout?: number;
  persist?: boolean;
  cookie_name_client_id?: string;
  cookie_name_session_id?: string;
  cookie_name_session_data?: string;
  local_name_client_id?: string;
  local_name_session_id?: string;
  local_name_session_data?: string;
  cookie_prefix_for_experiment?: string;
  cookie_domain?: string;
  cookie_days_to_live?: number;
  on_node?: boolean;
  session_is_new?: boolean;
  client_id_storage_location?: string;
  session_id_storage_location?: string;
}

export interface EventDispatcherOptions {
  enabled?: boolean;
  waitForBeacon?: boolean;
}

export interface ConstructorClientOptions {
  apiKey: string;
  version?: string;
  serviceUrl?: string;
  quizzesServiceUrl?: string;
  agentServiceUrl?: string;
  assistantServiceUrl?: string;
  sessionId?: number;
  clientId?: string;
  userId?: string;
  segments?: string[];
  testCells?: Record<string, string>;
  idOptions?: IdOptions;
  fetch?: any;
  trackingSendDelay?: number;
  sendTrackingEvents?: boolean;
  sendReferrerWithTrackingEvents?: boolean;
  eventDispatcher?: EventDispatcherOptions;
  beaconMode?: boolean;
  networkParameters?: NetworkParameters;
}

export interface RequestFeature extends Record<string, any> {
  query_items: boolean;
  auto_generated_refined_query_rules: boolean;
  manual_searchandizing: boolean;
  personalization: boolean;
  filter_items: boolean;
}

export interface RequestFeatureVariant extends Record<string, any> {
  query_items: string;
  auto_generated_refined_query_rules: string;
  manual_searchandizing: string | null;
  personalization: string;
  filter_items: string;
}

export type ErrorData = {
  message: string;
  [key: string]: any;
};

export interface ResultSources extends Record<string, any> {
  token_match: { count: number; [key: string]: any };
  embeddings_match: { count: number; [key: string]: any };
}

export interface SortOption extends Record<string, any> {
  sort_by: string;
  display_name: string;
  sort_order: string;
  status: string;
  hidden: boolean;
}

export interface Feature extends Record<string, any> {
  feature_name: string;
  display_name: string;
  enabled: boolean;
  variant: {
    name: string;
    display_name: string;
    [key: string]: any;
  } | null;
}

export type Facet = RangeFacet | OptionFacet | HierarchialOptionFacet;

export type BrowseFacet = Pick<Facet, keyof BaseFacet | 'type'>;

export interface BaseFacet extends Record<string, any> {
  data: Record<string, any>;
  display_name: string;
  name: string;
  hidden: boolean;
}

export interface RangeFacet extends BaseFacet, Record<string, any> {
  status?: { min: RangeMin, max: RangeMax };
  max: RangeMax;
  min: RangeMin;
  type: 'range';
}

export interface OptionFacet extends BaseFacet, Record<string, any> {
  options: FacetOption[];
  type: 'multiple' | 'single';
}

export interface HierarchialOptionFacet extends BaseFacet, Record<string, any> {
  options: HierarchialFacetOption[];
  type: 'hierarchical';
}

export interface FacetOption extends Record<string, any> {
  count: number;
  display_name: string;
  value: string;
  range?: [RangeMin, RangeMax];
  status: string;
  data: Record<string, any>;
}

export interface HierarchialFacetOption extends FacetOption {
  options?: HierarchialFacetOption[];
}

export type RangeMin = '-inf' | number;
export type RangeMax = '+inf' | 'inf' | number

export interface Group extends BaseGroup, Record<string, any> {
  count: number;
  data?: Record<string, any>;
  parents: BaseGroup[];
  children: Group[];
}

export interface Collection extends Record<string, any> {
  // documentation says this field is called `id`
  collection_id: string;
  display_name: string;
  data: Record<string, any>;
}

export interface BaseGroup extends Record<string, any> {
  display_name: string;
  group_id: string;
}

export interface FmtOptions extends Record<string, any> {
  groups_max_depth?: number;
  groups_start?: 'current' | 'top' | `group_id:${string}`;
  fields?: string[]; // Array of metadata field to be returned in the data response
}

export type Nullable<T> = T | null;

export type FilterExpression =
  | FilterExpressionGroup
  | FilterExpressionNot
  | FilterExpressionValue
  | FilterExpressionRange;

export type FilterExpressionGroup =
  | FilterExpressionGroupOr
  | FilterExpressionGroupAnd;

export type FilterExpressionGroupOr = { or: FilterExpression[] };
export type FilterExpressionGroupAnd = { and: FilterExpression[] };
export type FilterExpressionCondition = 'or' | 'and';

export type FilterExpressionNot = { not: FilterExpression };

export type FilterExpressionValue = {
  name: string;
  value: string;
};

export type FilterExpressionRange = {
  name: string;
  range: FilterExpressionRangeValue;
};

export type FilterExpressionRangeValue = ['-inf' | number, 'inf' | number];

export interface Item extends Record<string, any> {
  value: string;
  is_slotted: boolean;
  labels: Record<string, unknown>;
  matched_terms: string[];
  data?: ItemData;
  strategy?: { id: string };
  variations?: { data?: ItemData, value: string }[]
}

export interface ItemData extends Record<string, any> {
  url?: string;
  id?: string;
  variation_id?: string;
  image_url?: string;
  group_ids?: string[];
  groups?: Group[]
  facets?: Facet[];
}

export interface Product extends Item {
}

export interface SearchSuggestion extends Item {
  data?: {
    total_num_results?: number
  } & ItemData;
}

export interface VariationsMap {
  group_by: Array<{
    name: string,
    field: string
  }>;
  values: {
    [key: string]: {
        aggregation: 'first' | 'min' | 'max' | 'all',
        field: string
    },
  },
  dtype: 'array' | 'object'
}

export interface ItemTracked {
  itemName?: string;
  itemId?: string;
  variationId?: string;
  slCampaignId?: string;
  slCampaignOwner?: string;
  price?: number;
}

export interface ItemTrackedPurchase extends ItemTracked {
  count?: number;
}

export interface Question {
  question: string;
}

export interface TimeSpan {
  start: string;
  end: string;
}
