import {
  ConstructorClientOptions,
  FilterExpression,
  FmtOptions,
  NetworkParameters,
  Item,
} from '.';

export default Pia;

export interface PiaQuestion {
  value: string;
}

export interface PiaBaseParameters {
  threadId?: string;
  variationId?: string;
  features?: Record<string, boolean>;
  featureVariants?: Record<string, string>;
  preFilterExpression?: FilterExpression;
}

export interface PiaSuggestedQuestionsParameters extends PiaBaseParameters {
  numResults?: number;
}

export interface PiaAnswerResultsParameters extends PiaBaseParameters {
  guard?: boolean;
  fmtOptions?: FmtOptions;
}

export interface PiaSuggestedQuestionsResponse {
  questions: Array<PiaQuestion>;
}

export interface PiaAnswerItemResults {
  request?: {
    item_id: string;
    variation_id?: string;
    num_results?: number;
    thread_id?: string;
  };
  response: {
    results: Array<Item>;
  };
}

export interface PiaAnswerResultsResponse {
  qna_result_id: string;
  value: string;
  item_results?: PiaAnswerItemResults;
  follow_up_questions?: Array<PiaQuestion>;
  thread_id?: string;
}

declare class Pia {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getSuggestedQuestions(
    itemId: string,
    parameters?: PiaSuggestedQuestionsParameters,
    networkParameters?: NetworkParameters,
  ): Promise<PiaSuggestedQuestionsResponse>;

  getAnswerResults(
    itemId: string,
    question: string,
    parameters?: PiaAnswerResultsParameters,
    networkParameters?: NetworkParameters,
  ): Promise<PiaAnswerResultsResponse>;
}
