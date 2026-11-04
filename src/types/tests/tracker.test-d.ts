import { expectError, expectType } from 'tsd';
import ConstructorIO from '..';

const { tracker } = new ConstructorIO({ apiKey: 'api-key' });

// conversionLocation accepts only the values the API accepts for `conversion_location`
expectType<true | Error>(tracker.trackConversion('term', { itemId: 'item-id', conversionLocation: 'plp' }));
expectType<true | Error>(tracker.trackConversion('term', { itemId: 'item-id', conversionLocation: 'pdp' }));
expectError(tracker.trackConversion('term', { itemId: 'item-id', conversionLocation: 'PLP' }));
expectError(tracker.trackConversion('term', { itemId: 'item-id', conversionLocation: '' }));

const quizConversion = {
  quizId: 'coffee-quiz',
  quizVersionId: '1231244',
  quizSessionId: '3123',
  itemId: 'item-id',
};

expectType<true | Error>(tracker.trackQuizConversion({ ...quizConversion, conversionLocation: 'plp' }));
expectType<true | Error>(tracker.trackQuizConversion({ ...quizConversion, conversionLocation: 'pdp' }));
expectError(tracker.trackQuizConversion({ ...quizConversion, conversionLocation: 'checkout' }));
