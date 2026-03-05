import {
  ConstructorClientOptions,
  FmtOptions,
  FilterExpression,
} from '.';

export default Agent;

export interface IAgentParameters {
  domain: string;
  /** @deprecated Use numResultsPerEvent instead */
  numResultsPerPage?: number;
  filters?: Record<string, any>;
  threadId?: string;
  guard?: boolean;
  numResultsPerEvent?: number;
  numResultEvents?: number;
  qsParam?: Record<string, any>;
  preFilterExpression?: FilterExpression | string;
  fmtOptions?: Pick<FmtOptions, 'fields' | 'hidden_fields'>;
}

declare class Agent {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getAgentResultsStream(
    intent: string,
    parameters?: IAgentParameters,
  ): ReadableStream;
}
