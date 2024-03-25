import Search from './search';
import Browse from './browse';
import Autocomplete from './autocomplete';
import Recommendations from './recommendations';
import Quizzes from './quizzes';
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

  assistant: Assistant;

  tracker: Tracker;

  setClientOptions(options: ConstructorClientOptions): void;
}

declare namespace ConstructorIO {
  export { Search, Browse, Autocomplete, Recommendations, Quizzes, Tracker, Assistant };
}
