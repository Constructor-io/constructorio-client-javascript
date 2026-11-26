import {
  ConstructorClientOptions,
  FmtOptions,
  FilterExpression,
  Facet,
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

/* ---------- Agent Insights: Request Parameters ---------- */

/** Common fields shared by all Agent Insights methods */
export interface IAgentInsightsBaseParameters<TPageContext> {
  pageContext: TPageContext;
  threadId?: string;
  guard?: boolean;
  numResultEvents?: number;
  numResultsPerEvent?: number;
  qsParam?: Record<string, any>;
  fmtOptions?: FmtOptions;
}

/** Parameters for agent.getChatInsights */
export interface IAgentInsightsChatParameters
  extends IAgentInsightsBaseParameters<AgentInsightsPageContext> {
  shopperInput: string;
  domain: string;
  /** Only accepted for domains where it is enabled */
  requestContext?: AgentInsightsRequestContext;
}

/** Parameters for agent.getSearchInsights */
export interface IAgentInsightsSearchParameters
  extends IAgentInsightsBaseParameters<AgentInsightsPageContext> {
  shopperInput: string;
}

/** Parameters for agent.getQnaInsights */
export interface IAgentInsightsQnaParameters
  extends IAgentInsightsBaseParameters<AgentInsightsItemPageContext> {
  shopperInput: string;
  /** Only accepted for domains where it is enabled */
  requestContext?: AgentInsightsRequestContext;
}

/**
 * Parameters for agent.getQnaZeroStateInsights.
 */
// Doesn't extend the base parameters and it takes no shopperInput or requestContext
// They have no effect on zero state
export interface IAgentInsightsQnaZeroStateParameters {
  pageContext: AgentInsightsItemPageContext;
  numQuestions?: number;
}

/** Parameters for agent.getRecommendationsInsights */
export interface IAgentInsightsRecommendationsParameters
  extends IAgentInsightsBaseParameters<AgentInsightsItemPageContext> {
  shopperInput?: string;
  /** ID of a routing rule configured on the index key, not a recommendations pod ID */
  strategy: string;
  /** Shown when the set is the non-personalized default */
  defaultTitle?: string;
}

/** Parameters for agent.getQueryRefinementInsights */
export interface IAgentInsightsQueryRefinementParameters
  extends IAgentInsightsBaseParameters<AgentInsightsListingPageContext> {
  /** Leave out on page load, and after a choice or filter change is applied */
  shopperInput?: string;
}

/* ---------- Agent Insights: Request Parameters - Page Context Types ---------- */

export type AgentInsightsPageType =
  | 'home'
  | 'plp'
  | 'pdp'
  | 'collection'
  | 'email_campaign'
  | 'cart';

export interface AgentInsightsFilterExpressionValue {
  name: string;
  value: string | number | boolean | Array<string | number | boolean>;
  range?: never;
  /** Only valid when used with `value` */
  match_type?: 'any' | 'all' | 'none';
}

export interface AgentInsightsFilterExpressionRange {
  name: string;
  range: Array<string | number | boolean>;
  value?: never;
  /** Not valid when used with `range` */
  match_type?: never;
}

/** `value` and `range` are mutually exclusive */
export type AgentInsightsFilterExpression =
  | AgentInsightsFilterExpressionValue
  | AgentInsightsFilterExpressionRange;

export interface AgentInsightsBasePageContext {
  pageType: AgentInsightsPageType;
  itemId?: string;
  /** Only valid when `itemId` is set */
  variationId?: string;
  /** Relevant for PLP pages with search context */
  searchTerm?: string;
  /** Used for PLP pages navigated via category tree or collection links */
  browseFilter?: {
    /** Typically `group_id` for category pages or `collection_id` for collections */
    name: string;
    value: string;
  };
  filters?: AgentInsightsFilterExpression[];
}

/** Used by chat and search */
export interface AgentInsightsPageContext extends AgentInsightsBasePageContext {
  /** Required when `pageType` is 'pdp' */
  itemId?: string;
}

/** Used by qna and recommendations, where an item ID is always required */
export interface AgentInsightsItemPageContext extends AgentInsightsBasePageContext {
  itemId: string;
}

/** Used by query_refinement, which only works on listing pages */
export interface AgentInsightsListingPageContext extends AgentInsightsBasePageContext {
  pageType: 'plp';
  browseFilter?: {
    /** Always `group_id`, collection and facet browse pages cannot be refined */
    name: 'group_id';
    value: string;
  };
}

/* ---------- Agent Insights: Request Parameters - Request Context Types ---------- */

export interface AgentInsightsRequestPrice {
  /** Must equal `pageContext.itemId` */
  itemId: string;
  /** Must equal `pageContext.variationId`; omit for an item-level price */
  variationId?: string;
  /** Decimal string greater than zero */
  amount: string;
  /** 3-letter currency code */
  currency: string;
  /** ISO 8601 date-time */
  expiresAt: string;
  /** Who resolved the price */
  source: 'integration' | 'browser';
  reason?: string;
}

export interface AgentInsightsRequestContext {
  /** At most one item-level and one variation-level price */
  prices: [AgentInsightsRequestPrice] | [AgentInsightsRequestPrice, AgentInsightsRequestPrice];
}

export interface AgentInsightsEventTypes {
  START: 'start';
  MESSAGE: 'message';
  ITEM_RESULTS: 'item_results';
  ARTICLE_REFERENCE: 'article_reference';
  FOLLOW_UP_REFINEMENT: 'follow_up_refinement';
  IMAGE_META: 'image_meta';
  RECIPE_INFO: 'recipe_info';
  RECIPE_INSTRUCTIONS: 'recipe_instructions';
  PING: 'ping';
  SERVER_ERROR: 'server_error';
  END: 'end';
}

declare class Agent {
  constructor(options: ConstructorClientOptions);

  static EventTypes: AgentEventTypes;

  static InsightsEventTypes: AgentInsightsEventTypes;

  options: ConstructorClientOptions;

  getAgentResultsStream(
    intent: string,
    parameters?: IAgentParameters,
  ): ReadableStream;

  getChatInsights(
    parameters: IAgentInsightsChatParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  getChatInsights(
    parameters: IAgentInsightsChatParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  /** For user who wants to assign the value of `stream` at runtime */
  getChatInsights(
    parameters: IAgentInsightsChatParameters,
    options?: { stream?: boolean },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;

  getSearchInsights(
    parameters: IAgentInsightsSearchParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  getSearchInsights(
    parameters: IAgentInsightsSearchParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  /** For user who wants to assign the value of `stream` at runtime */
  getSearchInsights(
    parameters: IAgentInsightsSearchParameters,
    options?: { stream?: boolean },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;

  getQnaInsights(
    parameters: IAgentInsightsQnaParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  getQnaInsights(
    parameters: IAgentInsightsQnaParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  /** For user who wants to assign the value of `stream` at runtime */
  getQnaInsights(
    parameters: IAgentInsightsQnaParameters,
    options?: { stream?: boolean },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;

  getQnaZeroStateInsights(
    parameters: IAgentInsightsQnaZeroStateParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  getQnaZeroStateInsights(
    parameters: IAgentInsightsQnaZeroStateParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  /** For user who wants to assign the value of `stream` at runtime */
  getQnaZeroStateInsights(
    parameters: IAgentInsightsQnaZeroStateParameters,
    options?: { stream?: boolean },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;

  getRecommendationsInsights(
    parameters: IAgentInsightsRecommendationsParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  getRecommendationsInsights(
    parameters: IAgentInsightsRecommendationsParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  /** For user who wants to assign the value of `stream` at runtime */
  getRecommendationsInsights(
    parameters: IAgentInsightsRecommendationsParameters,
    options?: { stream?: boolean },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;

  getQueryRefinementInsights(
    parameters: IAgentInsightsQueryRefinementParameters,
    options?: { stream?: true },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent>>;

  getQueryRefinementInsights(
    parameters: IAgentInsightsQueryRefinementParameters,
    options: { stream: false },
    networkParameters?: NetworkParameters,
  ): Promise<AgentInsightsResponse>;

  /** For user who wants to assign the value of `stream` at runtime  */
  getQueryRefinementInsights(
    parameters: IAgentInsightsQueryRefinementParameters,
    options?: { stream?: boolean },
    networkParameters?: NetworkParameters,
  ): Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>;
}

/* ---------- Agent Insights: JSON Response (stream: false) ---------- */

export interface AgentInsightsResponse extends Record<string, any> {
  result_id: string;
  /** Only populated for conversational modes */
  thread_id?: string;
  status: 'complete' | 'partial';
  message?: string;
  route?: string;
  item_results?: AgentInsightsItemResults[];
  article_references?: AgentInsightsArticleReference[];
  images?: AgentInsightsImageMeta[];
  recipes?: AgentInsightsRecipe[];
  follow_up_refinement?: AgentInsightsFollowUpRefinement;
}

export interface AgentInsightsRefinementChoice {
  label: string;
  /** `value` holds exactly one string */
  filter: { name: string; value: string[] };
}

export interface AgentInsightsFollowUpRefinement {
  question?: string;
  options?: string[];
  choices?: AgentInsightsRefinementChoice[];
}

export interface AgentInsightsItemResultsContent {
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
  /** Only for query_refinement */
  listing?: {
    // Unable to type as AgentInsightsListingPageContext because the TypeScript type uses camelCase keys,
    // whereas the API returns in snake_case keys.
    page_context: Record<string, any>;
    added: AgentInsightsFilterExpression[];
    removed: AgentInsightsFilterExpression[];
  };
}

export interface AgentInsightsItemResults extends AgentInsightsItemResultsContent {
  result_id?: string;
}

export interface AgentInsightsArticleReference {
  source: string;
  title: string;
  image_url?: string;
  abstract?: string;
}

export interface AgentInsightsImageMeta {
  item_id: string;
  image_url: string;
}

export interface AgentInsightsRecipe {
  recipe_title: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  number_of_servings?: number;
  ingredients: string[];
  steps?: string[];
  text?: string;
}

/* ---------- Agent Insights: Stream Event ---------- */

/**
 * Known stream events.
 *
 * In a case where an unknown event type is received,
 * it should be handled gracefully rather than assuming it will never occur.
 */
export type AgentInsightsEvent =
  | { event: 'start'; data: AgentInsightsStartData }
  | { event: 'message'; data: AgentInsightsMessageData }
  | { event: 'item_results'; data: AgentInsightsItemResultsData }
  | { event: 'article_reference'; data: AgentInsightsArticleReferenceData }
  | { event: 'follow_up_refinement'; data: AgentInsightsFollowUpRefinementData }
  | { event: 'image_meta'; data: AgentInsightsImageMetaData }
  | { event: 'recipe_info'; data: AgentInsightsRecipeInfoData }
  | { event: 'recipe_instructions'; data: AgentInsightsRecipeInstructionsData }
  | { event: 'ping'; data: AgentInsightsPingData }
  | { event: 'server_error'; data: AgentInsightsServerErrorData }
  | { event: 'end'; data: AgentInsightsEndData }
  | { event: string; data: Record<string, any> }; // future/unknown events

/** Fields shared by every event's data. The event name is on the event itself, not inside data */
export interface AgentInsightsEventBaseData extends Record<string, any> {
  result_id: string;
  /** Only for conversational modes */
  thread_id?: string;
}

export interface AgentInsightsStartData extends AgentInsightsEventBaseData {
  request: {
    mode: 'chat' | 'search' | 'qna' | 'recommendations' | 'query_refinement';
    page_context: Record<string, any>;
    zero_state?: true;
  };
}

export interface AgentInsightsMessageData extends AgentInsightsEventBaseData {
  text: string;
  route?: string;
}

export interface AgentInsightsItemResultsData
  extends AgentInsightsEventBaseData,
  AgentInsightsItemResultsContent {}

export interface AgentInsightsArticleReferenceData
  extends AgentInsightsEventBaseData,
  AgentInsightsArticleReference {}

export interface AgentInsightsFollowUpRefinementData
  extends AgentInsightsEventBaseData,
  AgentInsightsFollowUpRefinement {}

export interface AgentInsightsImageMetaData
  extends AgentInsightsEventBaseData,
  AgentInsightsImageMeta {}

export interface AgentInsightsRecipeInfoData
  extends AgentInsightsEventBaseData,
  Omit<AgentInsightsRecipe, 'steps' | 'text'> {}

export interface AgentInsightsRecipeInstructionsData extends AgentInsightsEventBaseData {
  steps: string[];
  text?: string;
}

export interface AgentInsightsServerErrorData extends AgentInsightsEventBaseData {
  status_code: number;
  message: string;
}
/** Keep-alive event; its data carries no fields the caller needs */
export type AgentInsightsPingData = Record<string, any>;

export type AgentInsightsEndData = AgentInsightsEventBaseData;
