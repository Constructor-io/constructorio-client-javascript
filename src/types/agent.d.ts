import {
  ConstructorClientOptions,
  FmtOptions,
  FilterExpression,
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

declare class Agent {
  constructor(options: ConstructorClientOptions);

  static EventTypes: AgentEventTypes;

  options: ConstructorClientOptions;

  getAgentResultsStream(
    intent: string,
    parameters?: IAgentParameters,
  ): ReadableStream;
}
