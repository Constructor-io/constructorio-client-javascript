import { Nullable } from './index.d';
import { ConstructorClientOptions, NetworkParameters } from '.';

export default Quizzes;

export interface QuizzesParameters {
  section?: string;
  answers?: any[];
  quizVersionId?: string;
  quizSessionId?: string;
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
    parameters?: QuizzesParameters,
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
  result: Partial<QuizResult>;
  version_id?: string;
  quiz_id?: string;
  quiz_session_id?: string;
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
