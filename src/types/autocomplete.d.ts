import {
  ConstructorClientOptions,
  Item,
  NetworkParameters,
  RequestFeature,
  RequestFeatureVariant,
  VariationsMap,
} from '.';
import EventDispatcher from './event-dispatcher';

export default Autocomplete;

export interface IAutocompleteParameters {
  numResults?: number;
  filters?: Record<string, any>;
  resultsPerSection?: Record<string, number>;
  hiddenFields?: string[];
  variationsMap?: VariationsMap;
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

/** *********
 * Autocomplete results returned from server
 ********** */
export interface AutocompleteResponse extends Record<string, any> {
  request: Partial<AutocompleteRequestType>;
  sections: Record<string, Item[]>;
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
