import { ConstructorClientOptions, ErrorData } from "./types";
import EventDispatcher from "./event-dispatcher";

/******************
 *
 * 	Recommendations
 *
 *****************/
export = Recommendations;

interface RecommendationsParameters {
	itemIds?: string | string[];
	numResults?: number;
	section?: string;
	term?: string;
	filters?: Record<string, any>;
	variationsMap?: Record<string, any>;
}

declare class Recommendations {
	constructor(options: ConstructorClientOptions);
	options: ConstructorClientOptions;
	eventDispatcher: EventDispatcher;

	getRecommendations(
		podId: string,
		parameters?: RecommendationsParameters,
		networkParameters?: {
			timeout?: number;
		}
	): Promise<Recommendations.RecommendationsResponse>;
}

/***********
 *
 * 	Recommendations results returned from server
 *
 ***********/
declare namespace Recommendations {
	export interface RecommendationsResponse extends Record<string, any> {
		request: Partial<Request>;
		response: Partial<Response>;
		result_id: string;
	}
}

interface Request extends Record<string, any> {
	num_results: number;
	item_id: string;
	filters: {
		group_id: string;
		[key: string]: any;
	};
	pod_id: string;
}

interface Response extends Record<string, any> {
	results: Partial<Result>;
	total_num_results: number;
	pod: {
		id:string;
		display_name: string;
		[key: string]: any;
	};
}

interface Result extends Record<string, any> {
	matched_terms: string[];
	data: Record<string, any>;
	value: string;
	is_slotted: boolean;
	labels: Record<string, any>;
	strategy: {
		id: string;
		[key: string]: any;
	};
}