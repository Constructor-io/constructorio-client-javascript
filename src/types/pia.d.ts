import {
  ConstructorClientOptions,
  NetworkParameters,
  Item,
} from '.';

export default Pia;

export interface PiaQuestion {
  value: string;
}

export interface PiaSuggestedQuestionsParameters {
  threadId?: string;
  variationId?: string;
  numResults?: number;
}

export interface PiaAnswerResultsParameters {
  threadId?: string;
  variationId?: string;
}

export interface PiaSuggestedQuestionsResponse {
  questions: Array<PiaQuestion>;
}

export interface PiaAnswerItemResults {
  request?: Record<string, any>;
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
