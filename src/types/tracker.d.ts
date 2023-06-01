import EventEmitter = require('events');
import { ConstructorClientOptions, NetworkParameters } from '.';
import RequestQueue = require('../utils/request-queue');

export default Tracker;

declare class Tracker {
  constructor(options: ConstructorClientOptions);

  private options: ConstructorClientOptions;

  private eventemitter: EventEmitter;

  private requests: RequestQueue;

  trackSessionStart(networkParameters?: NetworkParameters): true | Error;

  trackInputFocus(networkParameters?: NetworkParameters): true | Error;

  trackItemDetailLoad(
    parameters: {
      itemName: string;
      itemId: string;
      variationId?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAutocompleteSelect(
    term: string,
    parameters: {
      originalQuery: string;
      section: string;
      tr?: string;
      groupId?: string;
      displayName?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchSubmit(
    term: string,
    parameters: {
      originalQuery: string;
      groupId?: string;
      displayName?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchResultsLoaded(
    term: string,
    parameters: {
      numResults: number;
      itemIds?: string[];
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchResultClick(
    term: string,
    parameters: {
      itemName: string;
      itemId: string;
      variationId?: string;
      resultId?: string;
      itemIsConvertible?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackConversion(
    term?: string,
    parameters: {
      itemId: string;
      revenue?: number;
      itemName?: string;
      variationId?: string;
      type?: string;
      isCustomType?: boolean;
      displayName?: string;
      resultId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackPurchase(
    parameters: {
      items: object[];
      revenue: number;
      orderId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackRecommendationView(
    parameters: {
      url: string;
      podId: string;
      numResultsViewed: number;
      items?: object[];
      resultCount?: number;
      resultPage?: number;
      resultId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackRecommendationClick(
    parameters: {
      podId: string;
      strategyId: string;
      itemId: string;
      itemName: string;
      variationId?: string;
      section?: string;
      resultId?: string;
      resultCount?: number;
      resultPage?: number;
      resultPositionOnPage?: number;
      numResultsPerPage?: number;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackBrowseResultsLoaded(
    parameters: {
      url: string;
      filterName: string;
      filterValue: string;
      section?: string;
      resultCount?: number;
      resultPage?: number;
      resultId?: string;
      selectedFilters?: object;
      sortOrder?: string;
      sortBy?: string;
      items?: object[];
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackBrowseResultClick(
    parameters: {
      filterName: string;
      filterValue: string;
      itemId: string;
      section?: string;
      variationId?: string;
      resultId?: string;
      resultCount?: number;
      resultPage?: number;
      resultPositionOnPage?: number;
      numResultsPerPage?: number;
      selectedFilters?: object;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackGenericResultClick(
    parameters: {
      itemId: string;
      itemName?: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackQuizResultsLoaded(
    parameters: {
      quizId: string;
      quizVersionId: string;
      quizSessionId: string;
      url: string;
      section?: string;
      resultCount?: number;
      resultPage?: number;
      resultId?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackQuizResultClick(
    parameters: {
      quizId: string;
      quizVersionId: string;
      quizSessionId: string;
      itemId?: string;
      itemName?: string;
      section?: string;
      resultCount?: number;
      resultPage?: number;
      resultId?: string;
      resultPositionOnPage?: number;
      numResultsPerPage?: number;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackQuizConversion(
    parameters: {
      quizId: string;
      quizVersionId: string;
      quizSessionId: string;
      itemId?: string;
      itemName?: string;
      section?: string;
      variationId?: string;
      revenue?: string;
      type?: string;
      isCustomType?: boolean;
      displayName?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  on(messageType: string, callback: Function): true | Error;
}
