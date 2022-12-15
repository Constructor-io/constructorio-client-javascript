import { expectAssignable } from "tsd";
import { QuizResultsResponse, NextQuestionResponse } from "..";

expectAssignable<NextQuestionResponse>(
  {
    next_question: {
      id: 2,
      title: "What do you want to ask",
      description: "Sample description",
      type: "multiple",
      cta_text: "Next",
      images: {
        primary_url: "https://example.com/image",
        primary_alt: "Example image",
        secondary_url: "https://example.com/image",
        secondary_alt: "Example image"
      },
      options: [
        {
          id: 1,
          value: "Who",
          attribute: {
            name: "group_id",
            value: "test-value"
          },
        },
        {
          id: 2,
          value: "What",
          attribute: {
            name: "group_id",
            value: "test-value"
          },
        },
      ]
    },
    version_id: "11db5ac7-67e1-4000-9000-414d8425cab3",
    is_last_question: false
  }
)

expectAssignable<NextQuestionResponse>({
  next_question: {
    id: 1,
    title: "Sample open text question",
    description: "Sample description",
    type: "open",
    cta_text: "Next",
    images: {
      primary_url: "https://example.com/image",
      primary_alt: "Example image",
      secondary_url: "https://example.com/image",
      secondary_alt: "Example image"
    },
    input_placeholder: "Sample input placeholder"
  },
  version_id: "11db5ac7-67e1-4000-9000-414d8425cab3",
  is_last_question: false
})

expectAssignable<QuizResultsResponse>({
  result: {
    filter_expression: {
      and: [
        { name: "group_id", "value": "W123456" },
        {
          or: [
            { name: "group_id", "value": "W95680" },
            { name: "group_id", "value": "W1338473" },
          ]
        },
        {
          or: [
            { name: "color", "value": "Blue" },
          ]
        }
      ]
    },
    results_url: "https://ac.cnstrc.com/browse/items?key=xaUaZEQHQWnrNZbq&num_results_per_page=10&collection_filter_expression=%3D%7B%22and%22%3A%5B%7B%22name%22%3A%22group_id%22%2C%22value%22%3A%22W123456%22%7D%2C%7B%22or%22%3A%5B%7B%22name%22%3A%22color%22%2C%22value%22%3A%22Purple%22%7D%2C%7B%22name%22%3A%22color%22%2C%22value%22%3A%22Black%22%7D%2C%7B%22name%22%3A%22color%22%2C%22value%22%3A%22Blue%22%7D%5D%7D%5D%7D"
  },
  version_id: "11db5ac7-67e1-4000-9000-414d8425cab3"
})
