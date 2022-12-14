import {
  ConstructorClientOptions,
  NetworkParameters,
  RequestFeature,
  RequestFeatureVariant,
} from ".";
import EventDispatcher from "./event-dispatcher";

export default Autocomplete;

export interface IAutocompleteParameters {
  numResults?: number;
  filters?: Record<string, any>;
  resultsPerSection?: Record<string, number>;
  hiddenFields?: string[];
  variationsMap?: Record<string, any>;
}

declare class Autocomplete {
  constructor(options: ConstructorClientOptions);
  options: ConstructorClientOptions;
  eventDispatcher: EventDispatcher;

  getAutocompleteResults(
    query: string,
    parameters?: IAutocompleteParameters,
    networkParameters?: NetworkParameters
  ): Promise<AutocompleteResponse>;
}

/***********
 * 	Autocomplete results returned from server
 ***********/
export interface AutocompleteResponse extends Record<string, any> {
  request: Partial<AutocompleteRequestType>;
  sections: Record<string, Section>;
  result_id: string;
}

export interface AutocompleteRequestType extends Record<string, any> {
  num_results: number;
  term: string;
  query: string;
  features: Partial<RequestFeature>;
  feature_variants: Partial<RequestFeatureVariant>;
  searchandized_items: Record<string, any>;
}

export type Section = Partial<SectionItem>[];

export interface SectionItem extends Record<string, any> {
  data: Record<string, any>;
  is_slotted: boolean;
  labels: Record<string, any>;
  matched_terms: string[];
  value: string;
}
