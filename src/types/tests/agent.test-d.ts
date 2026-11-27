import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import {
  AgentChatInsightsParameters,
  AgentInsightsEvent,
  AgentInsightsPageContext,
  AgentInsightsPrice,
  AgentInsightsResponse,
  AgentQnaInsightsParameters,
  AgentQueryRefinementInsightsParameters,
  AgentRecommendationsInsightsParameters,
} from '..';
import Agent from '../agent';

declare const agent: Agent;
declare const stream: boolean;

const chatParameters: AgentChatInsightsParameters = {
  shopperInput: 'I need a waterproof jacket',
  domain: 'outdoor',
  pageContext: {
    pageType: 'plp',
    searchTerm: 'jacket',
    browseFilter: { name: 'group_id', value: 'outerwear' },
    filters: [
      { name: 'color', value: ['blue', 'green'], matchType: 'any' },
      { name: 'price', range: ['-inf', 200] },
    ],
  },
  requestContext: {
    prices: [
      {
        itemId: 'jacket-1',
        amount: '89.95',
        currency: 'USD',
        expiresAt: '2027-01-01T00:00:00Z',
        source: 'integration',
      },
    ],
  },
  threadId: '5b0c7a44-9d1e-4c58-8a70-1f2e3d4c5b6a',
  guard: true,
  numResultEvents: 2,
  numResultsPerEvent: 5,
  fmtOptions: { fields: ['title'] },
  qsParam: { sort_by: 'price' },
};

// A stream by default, the JSON document with `stream: false`, and either when the choice is made at run time
expectType<Promise<ReadableStream<AgentInsightsEvent>>>(agent.getChatInsights(chatParameters));
expectType<Promise<ReadableStream<AgentInsightsEvent>>>(agent.getChatInsights(chatParameters, {}, { timeout: 500 }));
expectType<Promise<AgentInsightsResponse>>(agent.getChatInsights(chatParameters, { stream: false }));
expectType<Promise<ReadableStream<AgentInsightsEvent> | AgentInsightsResponse>>(
  agent.getChatInsights(chatParameters, { stream }),
);
expectType<Promise<AgentInsightsResponse>>(agent.getSearchInsights({
  shopperInput: 'waterproof jacket',
  pageContext: { pageType: 'home' },
}, { stream: false }));
expectType<Promise<ReadableStream<AgentInsightsEvent>>>(agent.getQnaInsights({
  shopperInput: 'Is this jacket machine washable?',
  pageContext: { pageType: 'pdp', itemId: 'jacket-1' },
}));
expectType<Promise<ReadableStream<AgentInsightsEvent>>>(agent.getRecommendationsInsights({
  strategy: 'complementary_pod',
  pageContext: { pageType: 'pdp', itemId: 'jacket-1' },
}));
expectType<Promise<ReadableStream<AgentInsightsEvent>>>(agent.getQueryRefinementInsights({
  pageContext: { pageType: 'plp', searchTerm: 'sneakers' },
}));

// Values the API does not accept
expectNotAssignable<AgentInsightsPageContext>({ pageType: 'checkout' });
expectNotAssignable<AgentInsightsPageContext>({
  pageType: 'plp',
  filters: [{ name: 'color', value: 'blue', matchType: 'some' }],
});
expectNotAssignable<AgentInsightsPrice>({
  itemId: 'jacket-1',
  amount: '89.95',
  currency: 'USD',
  expiresAt: '2027-01-01T00:00:00Z',
  source: 'server',
});

// Fields a mode requires
expectNotAssignable<AgentChatInsightsParameters>({
  shopperInput: 'I need a waterproof jacket',
  pageContext: { pageType: 'home' },
});
expectNotAssignable<AgentQnaInsightsParameters>({
  shopperInput: 'Is this jacket machine washable?',
  pageContext: { pageType: 'pdp' },
});
expectNotAssignable<AgentRecommendationsInsightsParameters>({
  pageContext: { pageType: 'pdp', itemId: 'jacket-1' },
});
expectNotAssignable<AgentQueryRefinementInsightsParameters>({
  pageContext: { pageType: 'pdp', searchTerm: 'sneakers' },
});

expectAssignable<AgentInsightsResponse>({
  result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10',
  thread_id: '5b0c7a44-9d1e-4c58-8a70-1f2e3d4c5b6a',
  status: 'complete',
  message: 'Here are a few options.',
  item_results: [
    {
      result_id: '3d6f0a52-8c1b-4e7a-b2d9-6f4e1a7c9b03',
      title: 'Waterproof jackets',
      request: { type: 'search', params: { num_results_per_page: 20 } },
      response: {
        results: [
          {
            value: 'Storm jacket',
            matched_terms: ['jacket'],
            data: { id: 'jacket-1', url: 'https://example.com/jacket-1' },
          },
        ],
      },
      listing: {
        page_context: {
          page_type: 'plp',
          search_term: 'jacket',
          filters: [{ name: 'color', value: ['blue'], match_type: 'any' }],
        },
        added: [{ name: 'color', value: ['blue'] }],
        removed: [],
      },
    },
  ],
  article_references: [{ source: 'https://example.com/guide', title: 'How to choose a jacket' }],
  images: [{ item_id: 'jacket-1', image_url: 'https://example.com/jacket-1.jpg' }],
  follow_up_refinement: {
    question: 'Which color do you prefer?',
    options: ['Blue', 'Green'],
    choices: [{ label: 'Blue', filter: { name: 'color', value: 'blue' } }],
  },
});
expectNotAssignable<AgentInsightsResponse>({
  result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10',
  status: 'done',
});

expectAssignable<AgentInsightsEvent>({
  type: 'start',
  data: {
    result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10',
    thread_id: '5b0c7a44-9d1e-4c58-8a70-1f2e3d4c5b6a',
    request: { mode: 'chat', page_context: { page_type: 'home' } },
  },
});
expectAssignable<AgentInsightsEvent>({
  type: 'message',
  data: { result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10', text: 'Here are a few options.' },
});
expectAssignable<AgentInsightsEvent>({
  type: 'item_results',
  data: { result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10', response: { results: [] } },
});
// A message event needs its text, and the stream never delivers the end event
expectNotAssignable<AgentInsightsEvent>({
  type: 'message',
  data: { result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10' },
});
expectNotAssignable<AgentInsightsEvent>({
  type: 'end',
  data: { result_id: 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10' },
});
