import { EventEmitter } from './events';
import { ConstructorClientOptions, ItemTracked, ItemTrackedPurchase, Question, TimeSpan, NetworkParameters } from '.';
import RequestQueue from './request-queue';

export default Tracker;

declare class Tracker {
  constructor(options: ConstructorClientOptions);

  private options: ConstructorClientOptions;

  private eventemitter: EventEmitter;

  private requests: RequestQueue;

  trackSessionStart(networkParameters?: NetworkParameters): true | Error;

  trackInputFocus(networkParameters?: NetworkParameters): true | Error;

  trackInputFocusV2(
    parameters: {
      userInput: string;
      analyticsTags?: Record<string, string>;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackItemDetailLoad(
    parameters: {
      itemName: string;
      itemId: string;
      url: string;
      variationId?: string;
      analyticsTags?: Record<string, string>;
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
      itemId?: string;
      slCampaignId?: string;
      slCampaignOwner?: string;
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

  trackSearchSubmitV2(
    term: string,
    parameters: {
      originalQuery: string;
      groupId?: string;
      displayName?: string;
      section?: string;
      userInput: string;
      analyticsTags?: Record<string, string>;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackSearchResultsLoaded(
    term: string,
    parameters: {
      url: string;
      items: ItemTracked[];
      resultCount?: number;
      resultPage?: number;
      resultId?: string;
      selectedFilters?: Record<string, any>;
      sortOrder?: string;
      sortBy?: string;
      section?: string;
      analyticsTags?: Record<string, string>;
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
      analyticsTags?: Record<string, string>;
      slCampaignId?: string;
      slCampaignOwner?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackConversion(
    term?: string,
    parameters?: {
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
      items: ItemTrackedPurchase[];
      revenue: number;
      orderId?: string;
      section?: string;
      analyticsTags?: Record<string, string>;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackRecommendationView(
    parameters: {
      url: string;
      podId: string;
      numResultsViewed: number;
      items?: ItemTracked[];
      resultCount?: number;
      resultPage?: number;
      resultId?: string;
      section?: string;
      analyticsTags?: Record<string, string>;
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
      analyticsTags?: Record<string, string>;
      slCampaignId?: string;
      slCampaignOwner?: string;
      seedItemIds?: string[] | string | number;
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
      items: ItemTracked[];
      analyticsTags?: Record<string, string>;
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
      analyticsTags?: Record<string, string>;
      slCampaignId?: string;
      slCampaignOwner?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackGenericResultClick(
    parameters: {
      itemId: string;
      itemName?: string;
      variationId?: string;
      section?: string;
      analyticsTags?: Record<string, string>;
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
      items: ItemTracked[];
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
      variationId?: string;
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

  trackAgentSubmit(
    parameters: {
      intent: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAgentResultLoadStarted(
    parameters: {
      intent: string;
      section?: string;
      intentResultId?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAgentResultLoadFinished(
    parameters: {
      intent: string;
      searchResultCount: number;
      section?: string;
      intentResultId?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAgentResultClick(
    parameters: {
      intent: string;
      searchResultId: string;
      itemId?: string;
      itemName?: string;
      variationId?: string;
      section?: string;
      intentResultId?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAgentResultView(
    parameters: {
      intent: string;
      searchResultId: string;
      numResultsViewed: number;
      items?: ItemTracked[];
      intentResultId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAgentSearchSubmit(
    parameters: {
      intent: string;
      searchTerm: string;
      userInput: string;
      searchResultId: string;
      groupId?: string;
      section?: string;
      intentResultId?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackAssistantSubmit: typeof Tracker.prototype.trackAgentSubmit;

  trackAssistantResultLoadStarted: typeof Tracker.prototype.trackAgentResultLoadStarted;

  trackAssistantResultLoadFinished: typeof Tracker.prototype.trackAgentResultLoadFinished;

  trackAssistantResultClick: typeof Tracker.prototype.trackAgentResultClick;

  trackAssistantResultView: typeof Tracker.prototype.trackAgentResultView;

  trackAssistantSearchSubmit: typeof Tracker.prototype.trackAgentSearchSubmit;

  trackProductInsightsAgentViews(
    parameters: {
      questions: Question[];
      itemId: string;
      itemName: string;
      viewTimespans: TimeSpan[];
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentView(
    parameters: {
      questions: Question[];
      itemId: string;
      itemName: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentOutOfView(
    parameters: {
      itemId: string;
      itemName: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentFocus(
    parameters: {
      itemId: string;
      itemName: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentQuestionClick(
    parameters: {
      itemId: string;
      itemName: string;
      question: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentQuestionSubmit(
    parameters: {
      itemId: string;
      itemName: string;
      question: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentAnswerView(
    parameters: {
      itemId: string;
      itemName: string;
      question: string;
      answerText: string;
      qnaResultId?: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  trackProductInsightsAgentAnswerFeedback(
    parameters: {
      itemId: string;
      itemName: string;
      feedbackLabel: string;
      qnaResultId?: string;
      variationId?: string;
      section?: string;
    },
    networkParameters?: NetworkParameters
  ): true | Error;

  on(messageType: string, callback: Function): true | Error;
}
