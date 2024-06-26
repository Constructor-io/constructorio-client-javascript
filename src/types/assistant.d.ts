import {
  ConstructorClientOptions,
} from '.';

export default Assistant;

export interface IAssistantParameters {
  domain: string;
  numResultsPerPage?: number;
  filters?: Record<string, any>;
}

declare class Assistant {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getAssistantResultsStream(
    intent: string,
    parameters?: IAssistantParameters,
  ): ReadableStream;
}
