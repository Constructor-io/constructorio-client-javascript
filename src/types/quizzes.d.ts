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

export interface QuizResultsFmtOptions {
  groups_start?: 'current' | 'top' | string;
  groups_max_depth?: number;
  show_protected_facets?: boolean;
  show_hidden_facets?: boolean;
  hidden_facets?: string[];
  hidden_fields?: string[];
  fields?: string[];
}

export interface QuizzesResultsParameters extends QuizzesParameters {
  answers: any[];
  page?: number;
  resultsPerPage?: number;
  filters?: Record<string, any>;
  fmtOptions?: QuizResultsFmtOptions;
  hiddenFields?: string[];
}

declare class Quizzes {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getQuizNextQuestion(
    quizId: string,
    parameters?: QuizzesParameters,
    networkParameters?: NetworkParameters
  ): Promise<NextQuestionResponse>;

  getQuizResults(
    quizId: string,
    parameters?: QuizzesResultsParameters,
    networkParameters?: NetworkParameters
  ): Promise<QuizResultsResponse>;

  getQuizResultsConfig(
    quizId: string,
    parameters?: Pick<QuizzesParameters, 'quizVersionId'>,
    networkParameters?: NetworkParameters,
  ): Promise<QuizResultsConfigResponse>;
}

/* quizzes results returned from server */
export interface NextQuestionResponse extends Record<string, any> {
  next_question: Question;
  quiz_version_id?: string;
  quiz_id?: string;
  quiz_session_id?: string;
  total_questions: number;
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
  quiz_selected_options: Array<{
    value: string;
    has_attribute: boolean;
    is_matched: boolean;
  }>;
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

export type Question = SelectQuestion | OpenQuestion | CoverQuestion;

export interface BaseQuestion extends Record<string, any> {
  id: number;
  title: string;
  description: string;
  cta_text: Nullable<string>;
  images?: Nullable<QuestionImages>;
}

export interface SelectQuestion extends BaseQuestion {
  type: 'single' | 'multiple';
  options: QuestionOption[];
}

export interface OpenQuestion extends BaseQuestion {
  type: 'open';
  input_placeholder?: Nullable<string>;
}

export interface CoverQuestion extends BaseQuestion {
  type: 'cover';
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

type ResultConfigFields = {
  is_active: boolean;
  text: Nullable<string>;
};

type ResponseSummary = ResultConfigFields & {
  items_separator: Nullable<string>;
  last_separator: Nullable<string>;
}

type ViewportResultsConfig = {
  title: Nullable<ResultConfigFields>;
  description: Nullable<ResultConfigFields>;
  response_summary: Nullable<ResponseSummary>;
};

export interface QuizResultsConfig extends Record<string, any> {
  desktop: ViewportResultsConfig;
}

export interface QuizResultsConfigResponse extends Record<string, any> {
  results_config: QuizResultsConfig,
  quiz_version_id: string;
  quiz_id: string;
}
