import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

fetch('https://ac.cnstrc.com/search/dog').then((response) => {
  console.log(response); //eslint-disable-line
}).catch((err) => {
  console.error(err); //eslint-disable-line
});
