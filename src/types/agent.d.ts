import {
  ConstructorClientOptions,
} from '.';

export default Agent;

export interface IAgentParameters {
  domain: string;
  numResultsPerPage?: number;
  filters?: Record<string, any>;
}

declare class Agent {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getAgentResultsStream(
    intent: string,
    parameters?: IAgentParameters,
  ): ReadableStream;
}
