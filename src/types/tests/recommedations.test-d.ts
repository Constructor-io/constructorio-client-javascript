import { RecommendationsResponse } from "./../recommendations.d";
import { expectType } from "tsd";

expectType<RecommendationsResponse>({
	request: {
		num_results: 4,
		item_id: "",
		filters: {
			group_id: "87552491555",
		},
		pod_id: "collection_page_1",
	},
	response: {
		results: [
			{
				matched_terms: [],
				data: {
					id: "123",
					url: "https://example",
					group_ids: ["123", "1234"],
					ListPrice: 30,
					image_url: "https://example",
					facets: [
						{
							name: "IsBestSeller",
							values: ["False"],
						},
					],
				},
				value: "ABC",
				is_slotted: false,
				labels: {},
				strategy: {
					id: "filtered_items",
				},
			},
		],
		total_num_results: 12,
		pod: {
			id: "collection_page_1",
			display_name: "Highly Rated Products",
		},
	},
	result_id: "618c2aa1-b851-451f-b228-61d02bf7e3c5",
});
