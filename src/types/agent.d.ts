import {
  ConstructorClientOptions,
  Facet,
  FmtOptions,
  FilterExpression,
  Item,
  NetworkParameters,
} from '.';

export default Agent;

export interface IAgentParameters {
  domain: string;
  /** @deprecated Use numResultsPerEvent instead */
  numResultsPerPage?: number;
  filters?: Record<string, any>;
  threadId?: string;
  guard?: boolean;
  numResultsPerEvent?: number;
  numResultEvents?: number;
  qsParam?: Record<string, any>;
  preFilterExpression?: FilterExpression;
  fmtOptions?: Pick<FmtOptions, 'fields' | 'hidden_fields'>;
}

export interface AgentEventTypes {
  START: 'start';
  GROUP: 'group';
  SEARCH_RESULT: 'search_result';
  ARTICLE_REFERENCE: 'article_reference';
  RECIPE_INFO: 'recipe_info';
  RECIPE_INSTRUCTIONS: 'recipe_instructions';
  SERVER_ERROR: 'server_error';
  IMAGE_META: 'image_meta';
  MESSAGE: 'message';
  FOLLOW_UP_QUESTIONS: 'follow_up_questions';
  FOLLOW_UP_REFINEMENT: 'follow_up_refinement';
  END: 'end';
}

export interface FollowUpRefinementEventData {
  intent_result_id?: string;
  thread_id?: string;
  question: string;
  options: string[];
}

/* Agent Insights: requests */

export type AgentInsightsPageType = 'home' | 'plp' | 'pdp' | 'collection' | 'email_campaign' | 'cart';

export type AgentInsightsFilterValue = string | number | boolean;

export interface AgentInsightsBrowseFilter {
  name: string;
  value: string;
}

export interface AgentInsightsFilter {
  name: string;
  value?: AgentInsightsFilterValue | AgentInsightsFilterValue[];
  range?: AgentInsightsFilterValue[];
  matchType?: 'any' | 'all' | 'none';
}

export interface AgentInsightsPageContext {
  pageType: AgentInsightsPageType;
  itemId?: string;
  variationId?: string;
  searchTerm?: string;
  browseFilter?: AgentInsightsBrowseFilter;
  filters?: AgentInsightsFilter[];
}

export interface AgentInsightsItemPageContext extends AgentInsightsPageContext {
  itemId: string;
}

export interface AgentInsightsListingPageContext extends AgentInsightsPageContext {
  pageType: 'plp';
}

export interface AgentInsightsPrice {
  itemId: string;
  variationId?: string;
  amount: string;
  currency: string;
  expiresAt: string;
  source: 'integration' | 'browser';
  reason?: string;
}

export interface AgentInsightsRequestContext {
  prices: AgentInsightsPrice[];
}

export interface AgentInsightsBaseParameters {
  threadId?: string;
  guard?: boolean;
  numResultEvents?: number;
  numResultsPerEvent?: number;
  fmtOptions?: FmtOptions;
  qsParam?: Record<string, any>;
}

export interface AgentChatInsightsParameters extends AgentInsightsBaseParameters {
  shopperInput: string;
  domain: string;
  pageContext: AgentInsightsPageContext;
  requestContext?: AgentInsightsRequestContext;
}

export interface AgentSearchInsightsParameters extends AgentInsightsBaseParameters {
  shopperInput: string;
  pageContext: AgentInsightsPageContext;
}

export interface AgentQnaInsightsParameters extends AgentInsightsBaseParameters {
  shopperInput: string;
  pageContext: AgentInsightsItemPageContext;
  requestContext?: AgentInsightsRequestContext;
}

export interface AgentRecommendationsInsightsParameters extends AgentInsightsBaseParameters {
  strategy: string;
  defaultTitle?: string;
  shopperInput?: string;
  pageContext: AgentInsightsItemPageContext;
}

export interface AgentQueryRefinementInsightsParameters extends AgentInsightsBaseParameters {
  shopperInput?: string;
  pageContext: AgentInsightsListingPageContext;
}

export interface AgentInsightsOptions {
  stream?: boolean;
}

/* Agent Insights: responses. Field names are the ones the API returns */

export interface AgentInsightsResponseFilter {
  name: string;
  value?: AgentInsightsFilterValue | AgentInsightsFilterValue[];
  range?: AgentInsightsFilterValue[];
  match_type?: 'any' | 'all' | 'none';
}

export interface AgentInsightsResponsePageContext {
  page_type: AgentInsightsPageType;
  item_id?: string;
  variation_id?: string;
  search_term?: string;
  browse_filter?: AgentInsightsBrowseFilter;
  filters?: AgentInsightsResponseFilter[];
}

export interface AgentInsightsItemResults extends Record<string, any> {
  title?: string;
  text?: string;
  request?: {
    type: 'search' | 'browse' | 'recommendations';
    ids?: string[];
    params?: Record<string, any>;
  };
  response: {
    result_id?: string;
    results?: Partial<Item>[];
    facets?: Facet[];
  };
  listing?: {
    page_context: AgentInsightsResponsePageContext;
    added: AgentInsightsResponseFilter[];
    removed: AgentInsightsResponseFilter[];
  };
}

export interface AgentInsightsArticleReference {
  source: string;
  title: string;
  image_url?: string;
  abstract?: string;
}

export interface AgentInsightsImage {
  item_id: string;
  image_url: string;
}

export interface AgentInsightsRefinementChoice {
  label: string;
  filter: AgentInsightsResponseFilter;
}

export interface AgentInsightsFollowUpRefinement {
  question?: string;
  options?: string[];
  choices?: AgentInsightsRefinementChoice[];
}

// The JSON document a method resolves to when `stream` is false
export interface AgentInsightsResponse extends Record<string, any> {
  result_id: string;
  thread_id?: string;
  status: 'complete' | 'partial';
  message?: string;
  route?: string;
  item_results?: AgentInsightsItemResults[];
  article_references?: AgentInsightsArticleReference[];
  images?: AgentInsightsImage[];
  follow_up_refinement?: AgentInsightsFollowUpRefinement;
}

export interface AgentInsightsEventData extends Record<string, any> {
  result_id: string;
  thread_id?: string;
}

export interface AgentInsightsStartEventData extends AgentInsightsEventData {
  request: {
    mode: 'chat' | 'search' | 'qna' | 'recommendations' | 'query_refinement';
    page_context: AgentInsightsResponsePageContext;
  };
}

export interface AgentInsightsMessageEventData extends AgentInsightsEventData {
  text: string;
  route?: string;
}

// An event of the stream a method resolves to by default. The stream closes at the API's `end` event,
// leaves `ping` events out and fails at a `server_error` event. An event the API adds later is passed on
// in the same { type, data } form
export type AgentInsightsEvent =
  | { type: 'start'; data: AgentInsightsStartEventData }
  | { type: 'message'; data: AgentInsightsMessageEventData }
  | { type: 'item_results'; data: AgentInsightsEventData & AgentInsightsItemResults }
  | { type: 'article_reference'; data: AgentInsightsEventData & AgentInsightsArticleReference }
  | { type: 'follow_up_refinement'; data: AgentInsightsEventData & AgentInsightsFollowUpRefinement }
  | { type: 'image_meta'; data: AgentInsightsEventData & AgentInsightsImage };

export interface AgentInsightsMethod<TParameters> {
  (
    parameters: TParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  (
    parameters: TParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  (
    parameters: TParameters,
    options: AgentInsightsOptions,
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;
}

declare class Agent {
  constructor(options: ConstructorClientOptions);

  static EventTypes: AgentEventTypes;

  options: ConstructorClientOptions;

  getAgentResultsStream(
    intent: string,
    parameters?: IAgentParameters,
  ): ReadableStream;

  getChatInsights: AgentInsightsMethod<AgentChatInsightsParameters>;

  getSearchInsights: AgentInsightsMethod<AgentSearchInsightsParameters>;

  getQnaInsights: AgentInsightsMethod<AgentQnaInsightsParameters>;

  getRecommendationsInsights: AgentInsightsMethod<AgentRecommendationsInsightsParameters>;

  getQueryRefinementInsights: AgentInsightsMethod<AgentQueryRefinementInsightsParameters>;
}
