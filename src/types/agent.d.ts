import {
  ConstructorClientOptions,
} from '.';

export default Agent;

export interface IAgentFmtOptions {
  fields?: string[];
  hidden_fields?: string[];
}

export interface IAgentParameters {
  domain: string;
  /** @deprecated Use numResultsPerEvent instead */
  numResultsPerPage?: number;
  filters?: Record<string, any>;
  threadId?: string;
  guard?: boolean;
  numResultsPerEvent?: number;
  numResultEvents?: number;
  qs?: Record<string, any> | string;
  preFilterExpression?: Record<string, any> | string;
  fmtOptions?: IAgentFmtOptions;
}

declare class Agent {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getAgentResultsStream(
    intent: string,
    parameters: IAgentParameters,
  ): ReadableStream;
}
