import Agent, { IAgentParameters } from './agent';

export default AgentOverview;

declare class AgentOverview extends Agent {
  getIntentResults(
    intent: string,
    parameters: IAgentParameters,
  ): ReadableStream;
}
