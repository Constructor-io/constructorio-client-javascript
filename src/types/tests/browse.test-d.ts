import { expectType } from "tsd";
import { GetBrowseResultsResponse, GetBrowseGroupsResponse, GetBrowseFacetsResponse, GetBrowseFacetOptionsResponse } from "../browse";

// Example response from https://www.petflow.com/explorer?group_id=33149&f%5B%5D=pet:dog&limit=24&type=list&f%5B%5D=type:flea_%26_tick&f%5B%5D=pet:dog_%26_cat
expectType<GetBrowseResultsResponse>({
	response: {
		result_sources: {
			token_match: {
				count: 19,
			},
			embeddings_match: {
				count: 0,
			},
		},
		facets: [
			{
				display_name: "pet",
				name: "pet",
				type: "multiple",
				options: [
					{
						status: "selected",
						count: 17,
						display_name: "dog",
						value: "dog",
						data: {},
					},
				],
				hidden: false,
				data: {},
			},
		],
		results: [
			{
				matched_terms: [],
				data: {
					id: "47771",
					url: "https://www.petflow.com/product/bravecto/bravecto-soft-chews-fluralaner-for-large-breed-dogs?size=55940",
					brand: "Bravecto",
					price: 21.99,
					item_name: "bravecto soft chews fluralaner for large breed dogs",
					image_url:
						"https://www.petflow.com/images/default/products/maximal/47771-1631032159.jpg",
					purchasable: 1,
					order_limit: 0,
					deactivated: false,
					max_per_order: 0,
					review_quality: 0,
					review_quantity: 0,
					default_option_id: 55940,
					upc: 8713184199225,
					msrp: 34.99,
					published: true,
					brand_slug: "bravecto",
					variation_id: "55932",
					size_description: "1-Month Supply",
				},
				value: "Bravecto Soft Chews Fluralaner for Large Breed Dogs",
				is_slotted: false,
				labels: {},
				variations: [
					{
						data: {
							upc: 8713184199225,
							msrp: 34.99,
							price: 21.99,
							published: true,
							brand_slug: "bravecto",
							purchasable: 1,
							deactivated: false,
							variation_id: "55932",
							max_per_order: 0,
							size_description: "1-Month Supply",
						},
						value: "Bravecto Soft Chews Fluralaner for Large Breed Dogs",
					},
				],
			},
		],
		sort_options: [
			{
				sort_by: "item_name",
				display_name: "A - Z",
				sort_order: "descending",
				status: "",
			},
		],
		refined_content: [],
		total_num_results: 19,
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
	result_id: "e5941e13-f4ca-4efb-9326-893fd49b4e71",
	request: {
		page: 1,
		num_results_per_page: 24,
		filters: {
			pet: ["dog", "dog_&_cat"],
			type: ["flea_&_tick"],
		},
		sort_by: "relevance",
		sort_order: "descending",
		browse_filter_name: "group_id",
		browse_filter_value: "33149",
		term: "",
		fmt_options: {
			groups_start: "current",
			groups_max_depth: 1,
		},
		section: "Products",
		features: {
			query_items: true,
			auto_generated_refined_query_rules: true,
			manual_searchandizing: true,
			personalization: true,
			filter_items: true,
		},
		feature_variants: {
			query_items: "query_items_ctr_and_l2r",
			auto_generated_refined_query_rules: "default_rules",
			manual_searchandizing: null,
			personalization: "default_personalization",
			filter_items: "filter_items_w_atcs_and_purchases",
		},
		filter_match_types: {
			pet: "any",
			type: "any",
		},
		searchandized_items: {},
	},
	ad_based: true,
});

// Example response from https://www.everydayyoga.com/collections/mens-yoga-shirts-2405
expectType<GetBrowseResultsResponse>({
	response: {
		result_sources: {
			token_match: {
				count: 49,
			},
			embeddings_match: {
				count: 0,
			},
		},
		facets: [
			{
				display_name: "SizeList",
				name: "SizeList",
				type: "multiple",
				options: [
					{
						status: "",
						count: 37,
						display_name: "XL",
						value: "XL",
						data: {},
					},
					{
						status: "",
						count: 32,
						display_name: "L",
						value: "L",
						data: {},
					},
					{
						status: "",
						count: 39,
						display_name: "M",
						value: "M",
						data: {},
					},
					{
						status: "",
						count: 32,
						display_name: "S",
						value: "S",
						data: {},
					},
					{
						status: "",
						count: 3,
						display_name: "XXL",
						value: "XXL",
						data: {},
					},
					{
						status: "",
						count: 2,
						display_name: "XS",
						value: "XS",
						data: {},
					},
				],
				hidden: false,
				data: {},
			},
		],
		groups: [
			{
				group_id: "All",
				display_name: "All",
				count: 49,
				data: {},
				children: [
					{
						group_id: "87547117603",
						display_name: "CAT:Yoga Shop|yoga-shop|2384|Y",
						count: 49,
						data: {},
						children: [
							{
								group_id: "87551442979",
								display_name: "CAT:Yoga Clothing |yoga-clothes|2385|Y",
								count: 49,
								data: {},
								children: [],
								parents: [
									{
										display_name: "All",
										group_id: "All",
									},
									{
										display_name: "CAT:Yoga Shop|yoga-shop|2384|Y",
										group_id: "87547117603",
									},
								],
							},
						],
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
				matched_terms: [],
				data: {
					id: "8139734",
					url: "https://www.everydayyoga.com/products/yak-yeti-mens-bohemian-long-sleeve-8139734",
					group_ids: ["87552491555"],
					VideoSize: 0,
					ListPrice: 27,
					NextColor: "Blue|210|14826148921379|1740075925539",
					image_url:
						"https://cdn.shopify.com/s/files/1/0032/7539/1011/products/1740075696163-2t.jpg?v=1636444021",
					AvgRating: 4.6,
					SalePrice: 0,
					PriceRange: "",
					IsMapPrice: "N",
					IsFinalSale: false,
					description:
						"Use this Bohemian Long Sleeve top after your yoga session or wear with your favorite pair of jeans for a laid-back look. Features    Long sleeve pullover short. All over stripped pattern. Button-up neckline with collar.   Details    Fabric: 100% Cott",
					ColorIdlist: "_Green_$_209_,_Blue_$_210_,",
					productCode: 8139734,
					MemberPrice: "",
					TotalReviews: 10,
					facets: [
						{
							name: "IsBestSeller",
							values: ["True"],
						},
					],
					NextColorSale: "Green|209|14826149773347|1740076285987",
					ShopifyImgList:
						"1740075925539-blue-1a.jpg?v=1636444023;1740075925539-blue-2a.jpg?v=1636444026;1740075925539-blue-3a.jpg?v=1636444028;1740075925539-blue-4a.jpg?v=1636444030;1740075925539-blue-5a.jpg?v=1636444032;1740075925539-swatch-blue.jpg?v=1636444034;1740075925539-blue.jpg?v=1636444036;1740076285987-green-1a.jpg?v=1636444039;1740076285987-green-2a.jpg?v=1636444041;1740076285987-green-3a.jpg?v=1636444043;1740076285987-green-4a.jpg?v=1636444046;1740076285987-green-5a.jpg?v=1636444048;1740076285987-swatch-green.jpg?v=1636444050;1740076285987-green.jpg?v=1636444052",
					ColorSwatchList: "*$Green*$_*$209*$_*$1*$,*$Blue*$_*$210*$_*$1*$",
					HasVideoCaption: "N",
					DisplaySalePrice: 0,
					ShopifyProductId: 1740075696163,
					AdditionalMessage: "",
					ColorSwatchListSale: "*$Green*$_*$209*$_*$1*$,*$Blue*$_*$210*$_*$1*$",
				},
				value: "Yak & Yeti Men's Bohemian Long Sleeve",
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
		total_num_results: 49,
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
	result_id: "6a42ecb5-4852-4267-bdda-b5d8f3085da4",
	request: {
		page: 1,
		num_results_per_page: 48,
		fmt_options: {
			groups_start: "top",
			groups_max_depth: 6,
		},
		browse_filter_name: "group_id",
		browse_filter_value: "87552491555",
		term: "",
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
			query_items: "query_items_ctr_and_l2r",
			auto_generated_refined_query_rules: "default_rules",
			manual_searchandizing: null,
			personalization: "default_personalization",
			filter_items: "filter_items_w_atcs_and_purchases",
		},
		searchandized_items: {},
	},
	ad_based: true,
});

expectType<GetBrowseGroupsResponse>({
	response: {
		result_sources: {
		},
		groups: [
			{
				group_id: "All",
				display_name: "All",
				count: 49,
				data: {},
				children: [
					{
						group_id: "87547117603",
						display_name: "CAT:Yoga Shop|yoga-shop|2384|Y",
						count: 49,
						data: {},
						children: [
							{
								group_id: "87551442979",
								display_name: "CAT:Yoga Clothing |yoga-clothes|2385|Y",
								count: 49,
								data: {},
								children: [],
								parents: [
									{
										display_name: "All",
										group_id: "All",
									},
									{
										display_name: "CAT:Yoga Shop|yoga-shop|2384|Y",
										group_id: "87547117603",
									},
								],
							},
						],
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
	},
});

expectType<GetBrowseFacetsResponse>({
	response: {
		facets: [
			{
				display_name: "SizeList",
				name: "SizeList",
				type: "multiple",
				options: [
					{
						status: "",
						count: 37,
						display_name: "XL",
						value: "XL",
						data: {},
					},
					{
						status: "",
						count: 32,
						display_name: "L",
						value: "L",
						data: {},
					},
					{
						status: "",
						count: 39,
						display_name: "M",
						value: "M",
						data: {},
					},
					{
						status: "",
						count: 32,
						display_name: "S",
						value: "S",
						data: {},
					},
					{
						status: "",
						count: 3,
						display_name: "XXL",
						value: "XXL",
						data: {},
					},
					{
						status: "",
						count: 2,
						display_name: "XS",
						value: "XS",
						data: {},
					},
				],
				hidden: false,
				data: {},
			},
		],
		total_num_results: 4
	},
});


expectType<GetBrowseFacetOptionsResponse>({
	response: {
		facets: [
			{
				display_name: "SizeList",
				name: "SizeList",
				type: "multiple",
				options: [
					{
						status: "",
						count: 37,
						display_name: "XL",
						value: "XL",
						data: {},
					},
					{
						status: "",
						count: 32,
						display_name: "L",
						value: "L",
						data: {},
					},
					{
						status: "",
						count: 39,
						display_name: "M",
						value: "M",
						data: {},
					},
					{
						status: "",
						count: 32,
						display_name: "S",
						value: "S",
						data: {},
					},
					{
						status: "",
						count: 3,
						display_name: "XXL",
						value: "XXL",
						data: {},
					},
					{
						status: "",
						count: 2,
						display_name: "XS",
						value: "XS",
						data: {},
					},
				],
				hidden: false,
				data: {},
			},
		],
	},
});