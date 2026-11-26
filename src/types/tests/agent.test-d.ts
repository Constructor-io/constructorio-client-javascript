import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import Agent, {
  AgentInsightsResponse,
  AgentInsightsEvent,
  IAgentInsightsQnaZeroStateParameters,
} from '../agent';

declare const agent: Agent;

expectAssignable<AgentInsightsResponse>({
  result_id: '9a4f1c2e-1b7d-4c8e-9f3a-2d5e6b7c8a90',
  thread_id: 't-123',
  status: 'complete',
  message: 'Here are some waterproof jackets you might like.',
  route: 'product_search',
  item_results: [
    {
      result_id: 'r-1',
      title: 'Waterproof jackets',
      text: 'Lightweight options for rainy days',
      request: {
        type: 'search',
        params: { query: 'waterproof jacket' },
      },
      response: {
        result_id: 'r-1',
        results: [
          {
            value: 'Rain Shell',
            data: {
              id: 'i1',
              url: 'https://example.com/i1',
              image_url: 'https://example.com/i1.jpg',
            },
          },
        ],
        facets: [
          {
            display_name: 'Color',
            name: 'color',
            type: 'multiple',
            hidden: false,
            data: {},
            options: [],
          },
        ],
      },
      listing: {
        page_context: { page_type: 'plp', search_term: 'jackets' },
        added: [{ name: 'color', value: ['white'] }],
        removed: [{ name: 'price', range: [10, 50] }],
      },
    },
  ],
  article_references: [
    {
      source: 'https://example.com/blog/rain-gear',
      title: 'Choosing rain gear',
      image_url: 'https://example.com/blog.jpg',
      abstract: 'A guide to picking rain gear',
    },
  ],
  images: [{ item_id: 'i1', image_url: 'https://example.com/i1.jpg' }],
  recipes: [
    {
      recipe_title: 'Pancakes',
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      number_of_servings: 4,
      ingredients: ['flour', 'milk', 'eggs'],
      steps: ['Mix', 'Cook'],
      text: 'Simple pancakes',
    },
  ],
  follow_up_refinement: {
    question: 'Which color do you prefer?',
    options: ['White', 'Black'],
    choices: [{ label: 'White', filter: { name: 'color', value: ['white'] } }],
  },
});

expectAssignable<AgentInsightsEvent[]>([
  {
    event: 'start',
    data: {
      result_id: 'r-1',
      thread_id: 't-123',
      request: {
        mode: 'chat',
        page_context: { page_type: 'home' },
      },
    },
  },
  {
    event: 'message',
    data: { result_id: 'r-1', text: 'Here are some jackets', route: 'product_search' },
  },
  {
    event: 'item_results',
    data: {
      result_id: 'r-1',
      title: 'Waterproof jackets',
      request: { type: 'search' },
      response: { results: [{ value: 'Rain Shell', data: { id: 'i1' } }] },
    },
  },
  {
    event: 'article_reference',
    data: {
      result_id: 'r-1',
      source: 'https://example.com/blog/rain-gear',
      title: 'Choosing rain gear',
    },
  },
  {
    event: 'follow_up_refinement',
    data: {
      result_id: 'r-1',
      question: 'Which color?',
      choices: [{ label: 'White', filter: { name: 'color', value: ['white'] } }],
    },
  },
  {
    event: 'image_meta',
    data: { result_id: 'r-1', item_id: 'i1', image_url: 'https://example.com/i1.jpg' },
  },
  {
    event: 'recipe_info',
    data: {
      result_id: 'r-1',
      recipe_title: 'Pancakes',
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      ingredients: ['flour', 'milk', 'eggs'],
    },
  },
  {
    event: 'recipe_instructions',
    data: { result_id: 'r-1', steps: ['Mix', 'Cook'] },
  },
  { event: 'ping', data: {} },
  {
    event: 'server_error',
    data: { result_id: 'r-1', status_code: 500, message: 'Internal error' },
  },
  { event: 'end', data: { result_id: 'r-1' } },
]);

/* ---------- getQnaZeroStateInsights ---------- */

expectAssignable<IAgentInsightsQnaZeroStateParameters>({
  pageContext: { pageType: 'pdp', itemId: '12345' },
  numQuestions: 4,
});

// itemId is required
expectNotAssignable<IAgentInsightsQnaZeroStateParameters>({
  pageContext: { pageType: 'pdp' },
});

expectType<Promise<ReadableStream<AgentInsightsEvent>>>(
  agent.getQnaZeroStateInsights({ pageContext: { pageType: 'pdp', itemId: '12345' } }),
);

expectType<Promise<AgentInsightsResponse>>(
  agent.getQnaZeroStateInsights(
    { pageContext: { pageType: 'pdp', itemId: '12345' } },
    { stream: false },
  ),
);
