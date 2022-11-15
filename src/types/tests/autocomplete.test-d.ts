import { expectType } from "tsd";
import { AutocompleteResponse } from "../autocomplete";

expectType<AutocompleteResponse>({
	sections: {
		Products: [
			{
				matched_terms: ["red"],
				data: {
					id: "ABC",
					url: "https://example",
				},
				value: "ABC",
				is_slotted: false,
				labels: {},
				variations: [
					{
						data: {
							url: "https://example",
							name: "Orange, One Size / Fitment 6",
						},
						value: "ABC",
					},
				],
			},
		],
		"Search Suggestions": [
			{
				matched_terms: ["red"],
				data: {
					id: "ABC",
				},
				value: "ABC",
				is_slotted: false,
				labels: {},
			},
		],
	},
	result_id: "5a7e6a84-5ded-4315-83b5-71f08c175a4a",
	request: {
		query: "red",
		term: "red",
		features: {
			query_items: true,
			auto_generated_refined_query_rules: true,
			manual_searchandizing: true,
			personalization: true,
			filter_items: true,
		},
		feature_variants: {
			query_items: "query_items",
			auto_generated_refined_query_rules: "default_rules",
			manual_searchandizing: null,
			personalization: "default_personalization",
			filter_items: "filter_items_w_atcs_and_purchases",
		},
		searchandized_items: {},
	},
});
