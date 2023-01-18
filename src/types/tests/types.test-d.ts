import { expectAssignable } from 'tsd';
import { FilterExpression } from '../index';

expectAssignable<FilterExpression>({
  or: [
    {
      and: [
        {
          name: 'group_id',
          value: 'electronics-group-id',
        },
        {
          name: 'Price',
          range: ['-inf', 200],
        },
      ],
    },
    {
      and: [
        {
          name: 'Type',
          value: 'Laptop',
        },
        {
          not: {
            name: 'Price',
            range: [800, 'inf'],
          },
        },
      ],
    },
  ],
});
