import { Nullable } from './index.d';
import {
  ConstructorClientOptions,
  Facet,
  Feature,
  Group,
  NetworkParameters,
  RequestFeature,
  RequestFeatureVariant,
  SortOption,
  FilterExpression,
  ResultSources,
} from '.';

export default Quizzes;

export interface QuizzesParameters {
  section?: string;
  answers?: any[];
  quizVersionId?: string;
  quizSessionId?: string;
}

export interface QuizzesResultsParameters extends QuizzesParameters {
  answers: any[];
  page?: number;
  resultsPerPage?: number;
  filters?: Record<string, any>;
}

declare class Quizzes {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getQuizNextQuestion(
    id: string,
    parameters?: QuizzesParameters,
    networkParameters?: NetworkParameters
  ): Promise<NextQuestionResponse>;

  getQuizResults(
    id: string,
    parameters?: QuizzesResultsParameters,
    networkParameters?: NetworkParameters
  ): Promise<QuizResultsResponse>;
}

/* quizzes results returned from server */
export interface NextQuestionResponse extends Record<string, any> {
  next_question: Question;
  is_last_question?: boolean;
  version_id?: string;
  quiz_id?: string;
  quiz_session_id?: string;
}

export interface QuizResultsResponse extends Record<string, any> {
  request?: {
    filters?: Record<string, any>;
    fmt_options: Record<string, any>;
    num_results_per_page: number;
    page: number;
    section: string;
    sort_by: string;
    sort_order: string;
    features: Partial<RequestFeature>;
    feature_variants: Partial<RequestFeatureVariant>;
    collection_filter_expression: FilterExpression;
    term: string;
  };
  response?: {
    result_sources: Partial<ResultSources>;
    facets: Partial<Facet>[];
    groups: Partial<Group>[];
    results: Partial<QuizResultData>[];
    sort_options: Partial<SortOption>[];
    refined_content: Record<string, any>[];
    total_num_results: number;
    features: Partial<Feature>[];
  };
  result_id?: string;
  quiz_version_id: string;
  quiz_session_id: string;
  quiz_id: string;
}

export interface QuizResultData extends Record<string, any> {
  matched_terms: string[];
  data: {
    id: string;
    [key: string]: any;
  };
  value: string;
  is_slotted: false;
  labels: Record<string, any>;
  variations: Record<string, any>[];
}

export type Question = SelectQuestion | OpenQuestion | CoverQuestion

export interface BaseQuestion extends Record<string, any> {
  id: number;
  title: string;
  description: string;
  cta_text: Nullable<string>;
  images?: Nullable<QuestionImages>;
}

export interface SelectQuestion extends BaseQuestion {
  type: 'single' | 'multiple'
  options: QuestionOption[];
}

export interface OpenQuestion extends BaseQuestion {
  type: 'open'
  inputPlaceholder?: Nullable<string>;
}

export interface CoverQuestion extends BaseQuestion {
  type: 'cover'
}

export interface QuizResult extends Record<string, any> {
  filter_expression: Record<string, any>;
  results_url: string;
}

export interface QuestionOption extends Record<string, any> {
  id: number;
  value: string;
  attribute: Nullable<{
    name: string;
    value: string;
  }>;
  images?: Nullable<QuestionImages>;
}

export interface QuestionImages extends Record<string, any> {
  primary_url?: Nullable<string>;
  primary_alt?: Nullable<string>;
  secondary_url?: Nullable<string>;
  secondary_alt?: Nullable<string>;
}
