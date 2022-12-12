import EventDispatcher from './event-dispatcher';

export interface NetworkParameters extends Record<string, any> {
	timeout?: number;
}

export interface ConstructorClientOptions {
	apiKey: string;
	version?: string;
	serviceUrl?: string;
	// session id is of type string in jsdocs but of type number in code usage
	sessionId?: string;
	clientId?: string;
	userId?: string;
	segments?: string[];
	testCells?: Record<string, string>;
	fetch?: any;
	trackingSendDelay?: number;
	sendTrackingEvents?: boolean;
	sendReferrerWithTrackingEvents?: boolean;
	eventDispatcher?: EventDispatcher;
	beaconMode?: boolean;
	networkParameters?: NetworkParameters;
}

export interface RequestFeature extends Record<string, any> {
	query_items: boolean;
	auto_generated_refined_query_rules: boolean;
	manual_searchandizing: boolean;
	personalization: boolean;
	filter_items: boolean;
}

export interface RequestFeatureVariant extends Record<string, any> {
	query_items: string;
	auto_generated_refined_query_rules: string;
	manual_searchandizing: string | null;
	personalization: string;
	filter_items: string;
}

export type ErrorData = {
	message: string;
	[key: string]: any;
};

export interface ResultSources extends Record<string, any> {
	token_match: { count: number; [key: string]: any };
	embeddings_match: { count: number; [key: string]: any };
}

export interface SortOption extends Record<string, any> {
	sort_by: string;
	display_name: string;
	sort_order: string;
	status: string;
}

export interface Feature extends Record<string, any> {
	feature_name: string;
	display_name: string;
	enabled: boolean;
	variant: {
		name: string;
		display_name: string;
		[key: string]: any;
	};
}

export interface FmtOption extends Record<string, any> {
	groups_start: string;
	groups_max_depth: number;
}

type Facet = RangeFacet | OptionFacet;

export interface BaseFacet extends Record<string, any> {
	data: Record<string, any>;
	status: Record<string, any>;
	display_name: string;
	name: string;
	hidden: boolean;
}

export interface RangeFacet extends BaseFacet, Record<string, any> {
	max: number;
	min: number;
	type: "range";
}

export interface OptionFacet extends BaseFacet, Record<string, any> {
	options: FacetOption[];
	type: "multiple" | "single" | "hierarchical";
}

export interface FacetOption extends Record<string, any> {
	count: number;
	display_name: string;
	value: string;
	options?: FacetOption[];
	range?: ["-inf" | number, "inf" | number];
	status: string;
}

export interface Group extends BaseGroup, Record<string, any> {
	count: number;
	data: Record<string, any>;
	parents: BaseGroup[];
	children: Group[];
}

export interface Collection extends Record<string, any> {
	collection_id: string,
	display_name: string,
	data: Record<string, any>
}

export interface BaseGroup extends Record<string, any> {
	display_name: string;
	group_id: string;
}

export interface FmtOptions extends Record<string, any> {
	
}

export type Nullable<T> = T | null;

