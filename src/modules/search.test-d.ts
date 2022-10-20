import { ISearchResponse } from "./search.d";
import { expectType } from "tsd";

// Example response from https://www.princessauto.com/en/searchresults?Nr=product.active%3A1&Ntt=red*&Nty=1&No=0&Nrpp=50&Rdm=93&searchType=simple&type=search
expectType<ISearchResponse>({
	response: {
		result_sources: {
			token_match: {
				count: 454,
			},
			embeddings_match: {
				count: 0,
			},
		},
		facets: [
			{
				display_name: "price",
				name: "price",
				data: {},
				type: "range",
				hidden: false,
				status: {},
				min: 0.99,
				max: 4799.99,
			},
		],
		groups: [
			{
				group_id: "All",
				display_name: "All",
				count: 454,
				data: {},
				children: [
					{
						group_id: "310-000-000-000",
						display_name: "Trailer",
						count: 62,
						data: {},
						children: [],
						parents: [
							{
								display_name: "All",
								group_id: "All",
							},
						],
					},
				],
				parents: [],
			},
		],
		results: [
			{
				matched_terms: ["red"],
				data: {
					id: "PA0009015918",
					url: "https://www.princessauto.com/en/27-ton-212cc-gas-powered-log-splitter/product/PA0009015918",
					keywords: ["Red Rock"],
					image_url:
						"https://www.princessauto.com/ccstore/v1/images/?source=/file/products/9015918_A0CG_00_01.jpg",
					group_ids: ["220039", "420-010-015-010"],
					deactivated: false,
					description:
						"Use this log splitter to split logs up to 26 in. long. It features horizontal and vertical operation, low-oil shutdown, auto cylinder return, 14-second cycle time and powder-coated steel construction.",
					paProductStatus: "A",
					paProductClearance: false,
					listPrice: 1799.99,
					SaleDates: "Oct 10 2022 - Oct 23 2022",
					salePrice: 1399.99,
					variation_id: "9015918",
					selectorImage: "9015918_A0CG_00_01.jpg",
				},
				value: "27 Ton 212cc Gas-Powered Log Splitter",
				is_slotted: false,
				labels: {},
				variations: [
					{
						data: {
							listPrice: 1799.99,
							SaleDates: "Oct 10 2022 - Oct 23 2022",
							salePrice: 1399.99,
							deactivated: false,
							variation_id: "9015918",
							selectorImage: "9015918_A0CG_00_01.jpg",
						},
						value: "27 Ton 212cc Gas-Powered Log Splitter",
					},
				],
			},
		],
		sort_options: [
			{
				sort_by: "relevance",
				display_name: "Relevance",
				sort_order: "descending",
				status: "selected",
			},
		],
		refined_content: [],
		total_num_results: 454,
		features: [
			{
				feature_name: "auto_generated_refined_query_rules",
				display_name: "Affinity Engine",
				enabled: true,
				variant: {
					name: "default_rules",
					display_name: "Default weights",
				},
			},
		],
	},
	result_id: "dda3208c-0f0c-412e-92d9-7abf1d21e228",
	request: {
		page: 1,
		num_results_per_page: 50,
		section: "Products",
		blacklist_rules: true,
		term: "red",
		fmt_options: {
			groups_start: "current",
			groups_max_depth: 1,
		},
		sort_by: "relevance",
		sort_order: "descending",
		features: {
			query_items: true,
			auto_generated_refined_query_rules: true,
			manual_searchandizing: true,
			personalization: true,
			filter_items: true,
		},
		feature_variants: {
			query_items: "query_items_ctr_l2r_ctr_ss",
			auto_generated_refined_query_rules: "default_rules",
			manual_searchandizing: null,
			personalization: "default_personalization",
			filter_items: "filter_items_w_atcs_and_purchases",
		},
		searchandized_items: {},
	},
});

// Example response from https://bonobos.com/search?term=red
expectType<ISearchResponse>({
	response: {
		result_sources: {
			token_match: {
				count: 144,
			},
			embeddings_match: {
				count: 0,
			},
		},
		facets: [
			{
				display_name: "Accessory Size",
				name: "Accessory Size",
				type: "multiple",
				options: [
					{
						status: "",
						count: 4,
						display_name: "OS",
						value: "OS",
						data: {},
					},
				],
				hidden: false,
				data: {},
			},
		],
		groups: [
			{
				group_id: "this-is-a-fake-group_as_recommended-by-constructor",
				display_name: "All",
				count: 141,
				data: {},
				children: [
					{
						group_id: "19",
						display_name: "Accessories",
						count: 4,
						data: {},
						children: [],
						parents: [
							{
								display_name: "All",
								group_id: "this-is-a-fake-group_as_recommended-by-constructor",
							},
						],
					},
				],
				parents: [],
			},
		],
		results: [
			{
				matched_terms: ["red"],
				data: {
					id: "CSHRT00586-red molberg plaid",
					url: "stretch-washed-button-down-shirt",
					stores: ["Bonobos"],
					swatches: [
						{
							on_sale: false,
							markdown: false,
							inventory: 861,
							color_name: "red molberg plaid",
							final_sale: false,
							full_price: 89,
							purchasable: true,
							current_price: 89,
							novelty_badge: "",
							urgency_badge: "",
							hover_image_url:
								"https://bonobos-prod-s3.imgix.net/products/273228/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_6_hover.jpg?1663699860=",
							swatch_image_url:
								"https://bonobos-prod-s3.imgix.net/products/269951/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_swatch.jpg?1663340577=",
							primary_image_url:
								"https://bonobos-prod-s3.imgix.net/products/273225/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_2_category.jpg?1663699840=",
							color_presentation: "Red Molberg Plaid",
						},
					],
					image_url:
						"https://bonobos-prod-s3.imgix.net/products/273225/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_2_category.jpg?1663699840=",
					is_bundle: false,
					full_price: 89,
					final_sale: false,
					color_name: "red molberg plaid",
					description:
						"A soft cotton button-down updated with added stretch for flexing literally & figuratively.",
					is_gift_card: false,
					is_new_color: true,
					current_price: 89,
					is_new_program: false,
					number_of_fits: 4,
					hover_image_url:
						"https://bonobos-prod-s3.imgix.net/products/273228/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_6_hover.jpg?1663699860=",
					markdown_swatches: [
						{
							on_sale: true,
							markdown: true,
							inventory: 17,
							color_name: "plum check",
							final_sale: false,
							full_price: 88,
							purchasable: true,
							current_price: 48,
							novelty_badge: "",
							urgency_badge: "",
							hover_image_url:
								"https://bonobos-prod-s3.imgix.net/products/202675/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_26925-MVG62_3_hover.jpg?1603150771=",
							swatch_image_url:
								"https://bonobos-prod-s3.imgix.net/products/195243/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_26925-MVG62_swatch.jpg?1600202642=",
							primary_image_url:
								"https://bonobos-prod-s3.imgix.net/products/202679/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_26925-MVG62_40_category-outfitter.jpg?1603150785=",
							color_presentation: "Plum Check",
						},
					],
					number_of_swatches: 56,
					full_price_swatches: [
						{
							on_sale: false,
							markdown: false,
							inventory: 861,
							color_name: "red molberg plaid",
							final_sale: false,
							full_price: 89,
							purchasable: true,
							current_price: 89,
							novelty_badge: "",
							urgency_badge: "",
							hover_image_url:
								"https://bonobos-prod-s3.imgix.net/products/273228/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_6_hover.jpg?1663699860=",
							swatch_image_url:
								"https://bonobos-prod-s3.imgix.net/products/269951/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_swatch.jpg?1663340577=",
							primary_image_url:
								"https://bonobos-prod-s3.imgix.net/products/273225/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SG2476_2_category.jpg?1663699840=",
							color_presentation: "Red Molberg Plaid",
						},
					],
					final_sale_swatches: [
						{
							on_sale: true,
							markdown: false,
							inventory: 1,
							color_name: "heather blue plaid",
							final_sale: true,
							full_price: 89,
							purchasable: true,
							current_price: 39,
							novelty_badge: "",
							urgency_badge: "Only a few left",
							hover_image_url:
								"https://bonobos-prod-s3.imgix.net/products/224814/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SB1105_2_hover.jpg?1632924864=",
							swatch_image_url:
								"https://bonobos-prod-s3.imgix.net/products/223161/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SB1105_swatch.jpg?1632763858=",
							primary_image_url:
								"https://bonobos-prod-s3.imgix.net/products/224815/original/WOVEN-CASUAL-SHIRT_BUTTON-DOWN-WOVEN-SHIRT_BSH01760SB1105_3_category.jpg?1632924869=",
							color_presentation: "Heather Blue Plaid",
						},
					],
					number_of_markdown_swatches: 8,
					number_of_full_price_swatches: 19,
					number_of_final_sale_swatches: 29,
					variation_id: "BSH01760DG2476LS",
				},
				value: "Stretch Everyday Shirt",
				is_slotted: false,
				labels: {},
			},
		],
		sort_options: [
			{
				sort_by: "relevance",
				display_name: "Featured",
				sort_order: "descending",
				status: "selected",
			},
		],
		refined_content: [],
		total_num_results: 144,
		features: [
			{
				feature_name: "auto_generated_refined_query_rules",
				display_name: "Affinity Engine",
				enabled: true,
				variant: {
					name: "default_rules",
					display_name: "Default weights",
				},
			},
		],
	},
	result_id: "e0cd67c5-fbd0-4550-a1b7-fdbca97d03b8",
	request: {
		us: ["ecomm"],
		num_results_per_page: 90,
		blacklist_rules: true,
		term: "red",
		page: 1,
		fmt_options: {
			groups_start: "current",
			groups_max_depth: 1,
		},
		sort_by: "relevance",
		sort_order: "descending",
		section: "Products",
		features: {
			query_items: true,
			auto_generated_refined_query_rules: true,
			manual_searchandizing: true,
			personalization: true,
			filter_items: true,
		},
		feature_variants: {
			query_items: "query_items_ctr_l2r_ctr_ss",
			auto_generated_refined_query_rules: "default_rules",
			manual_searchandizing: null,
			personalization: "default_personalization",
			filter_items: "filter_items_w_atcs_and_purchases",
		},
		searchandized_items: {},
	},
});
