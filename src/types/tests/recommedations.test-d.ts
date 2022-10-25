import { RecommendationsResponse } from "./../recommendations.d";
import { expectType } from "tsd";

// Example response from https://www.everydayyoga.com/collections/mens-yoga-shirts-2405
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
					id: "8202020",
					url: "https://www.everydayyoga.com/products/yak-yeti-mens-kurta-solid-color-8202020",
					group_ids: [
						"87552491555",
						"87552458787",
						"87547117603",
						"87552589859",
						"87551442979",
						"93122723875",
						"263188185131",
						"160858832939",
						"268773163051",
						"87601807395",
					],
					VideoSize: 0,
					ListPrice: 30,
					NextColor: "White|10890|39363787030571|6577634279467",
					image_url:
						"https://cdn.shopify.com/s/files/1/0032/7539/1011/products/6577634213931-2t.jpg?v=1623397874",
					AvgRating: 5,
					SalePrice: 0,
					PriceRange: "",
					IsMapPrice: "N",
					IsFinalSale: false,
					description:
						"The Yak & Yeti Men's Kurta Solid Color shirt is a simple staple. Features  Long sleeves Half button up front  Details  Fabric: 100% Cotton Fit: Fitted Adjustable: No Length: Below hip Closure: Pull on Country of Origin: Imported",
					ColorIdlist: "_White_$_10890_,_White_$_25994_,",
					productCode: 8202020,
					MemberPrice: "$27.00",
					TotalReviews: 1,
					facets: [
						{
							name: "IsBestSeller",
							values: ["False"],
						},
						{
							name: "isnew",
							values: ["False"],
						},
						{
							name: "issale",
							values: ["False"],
						},
						{
							name: "manufacturer",
							values: ["Yak & Yeti$87601807395$yak-yeti"],
						},
					],
					NextColorSale: "White|10890|39363787030571|6577634279467",
					ShopifyImgList:
						"6577634246699-cream-1a.jpg?v=1623397875;6577634246699-cream-2a.jpg?v=1623397875;6577634246699-cream-3a.jpg?v=1623397876;6577634246699-swatch-cream.jpg?v=1623397877;6577634246699-cream.jpg?v=1623397878;6577634279467-white-1a.jpg?v=1623397879;6577634279467-white-2a.jpg?v=1623397879;6577634279467-white-3a.jpg?v=1623397880;6577634279467-swatch-white.jpg?v=1623397881;6577634279467-white.jpg?v=1623397882",
					ColorSwatchList:
						"*$White*$_*$10890*$_*$1*$,*$Cream*$_*$25994*$_*$1*$",
					HasVideoCaption: "N",
					DisplaySalePrice: 0,
					ShopifyProductId: 6577634213931,
					AdditionalMessage: "",
					ColorSwatchListSale:
						"*$White*$_*$10890*$_*$1*$,*$Cream*$_*$25994*$_*$1*$",
				},
				value: "Yak & Yeti Men's Kurta Solid Color",
				is_slotted: false,
				labels: {},
				strategy: {
					id: "filtered_items",
				},
			},
		],
		total_num_results: 49,
		pod: {
			id: "collection_page_1",
			display_name: "Highly Rated Products",
		},
	},
	result_id: "618c2aa1-b851-451f-b228-61d02bf7e3c5",
});