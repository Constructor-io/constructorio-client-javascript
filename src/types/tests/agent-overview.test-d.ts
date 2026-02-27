import { expectAssignable } from 'tsd';
import { IAgentParameters } from '../agent';

expectAssignable<IAgentParameters>({
  domain: 'sportsgear',
});

expectAssignable<IAgentParameters>({
  domain: 'sportsgear',
  threadId: 'f0e1d2c3-b4a5-6789-0abc-def123456789',
  guard: true,
  numResultsPerEvent: 5,
  numResultEvents: 3,
  numResultsPerPage: 10,
  qs: { section: 'Products' },
  preFilterExpression: { and: [{ name: 'brand', value: 'Nike' }] },
  fmtOptions: {
    fields: ['title', 'price'],
    hidden_fields: ['internal_id'],
  },
});
