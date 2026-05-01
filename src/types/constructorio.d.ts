import Search from './search';
import Browse from './browse';
import Autocomplete from './autocomplete';
import Recommendations from './recommendations';
import Quizzes from './quizzes';
import Agent from './agent';
import Pia from './pia';
import Assistant from './assistant';
import Tracker from './tracker';
import { ConstructorClientOptions } from '.';

export = ConstructorIO;

declare class ConstructorIO {
  constructor(options: ConstructorClientOptions);

  private options: ConstructorClientOptions;

  search: Search;

  browse: Browse;

  autocomplete: Autocomplete;

  recommendations: Recommendations;

  quizzes: Quizzes;

  agent: Agent;

  pia: Pia;

  assistant: Assistant;

  tracker: Tracker;

  setClientOptions(options: ConstructorClientOptions): void;
}

declare namespace ConstructorIO {
  export { Search, Browse, Autocomplete, Recommendations, Quizzes, Tracker, Agent, Pia, Assistant };
}
