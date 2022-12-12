import { ConstructorClientOptions, NetworkParameters } from "./types";

export = Quizzes;

interface QuizzesParameters {
	section?: string;
	answers?: any[];
	versionId?: string;
}

declare class Quizzes {
	constructor(options: ConstructorClientOptions);
	options: ConstructorClientOptions;

	getQuizNextQuestion(
		id: string,
		parameters?: QuizzesParameters,
		networkParameters?: NetworkParameters
	): Promise<Quizzes.NextQuestionResponse>;

	getQuizResults(
		id: string,
		parameters?: QuizzesParameters,
		networkParameters?: NetworkParameters
	): Promise<Quizzes.ResultsResponse>;
}

/* quizzes results returned from server */
declare namespace Quizzes {
	export interface NextQuestionResponse extends Record<string, any> {
		next_question: Partial<NextQuestion>;
		is_last_question?: boolean;
		version_id?: string;
	}
	export interface ResultsResponse extends Record<string, any> {
		result: Partial<QuizResult>;
		version_id?: string;
	}
}

interface NextQuestion extends Record<string, any> {
	id: number;
	title: string;
	description: string;
	type: "single" | "multiple" | "open" | "cover";
	cta_text: string;
	images: Partial<QuestionImages>;
	options: Partial<QuestionOption>[];
	input_placeholder: string;
}

interface QuizResult extends Record<string, any> {
	filter_expression: Record<string, any>;
	results_url: string;
}

interface QuestionOption extends Record<string, any> {
	id: number;
	value: string;
	attribute: {
		name: string;
		value: string;
	};
	images: Partial<QuestionImages>;
}

interface QuestionImages extends Record<string, any> {
	primary_url: string;
	primary_alt: string;
	secondary_url: string;
	secondary_alt: string;
}
