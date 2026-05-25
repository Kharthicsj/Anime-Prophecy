/** Shared product filter options — aligned with server Product model enums */

export const FILTER_ALL = {
	anime: "All Anime",
	store: "All Stores",
	category: "All Categories",
	country: "All Countries",
};

export const ANIME_FILTER_OPTIONS = [
	FILTER_ALL.anime,
	"AOT",
	"JJK",
	"Naruto",
	"One Piece",
	"Demon Slayer",
	"MHA",
	"Steins;Gate",
	"Death Note",
	"Code Geass",
	"Spy x Family",
	"Chainsaw Man",
	"Solo Leveling",
	"Other",
];

export const STORE_FILTER_OPTIONS = [
	FILTER_ALL.store,
	"Amazon",
	"Flipkart",
	"Etsy",
	"eBay",
	"AliExpress",
	"Other",
];

export const CATEGORY_FILTER_OPTIONS = [
	FILTER_ALL.category,
	"T-Shirts",
	"Hoodies",
	"Figures",
	"Posters",
	"Keychains",
	"Mouse Pads",
	"Accessories",
	"Cosplay",
	"Stickers",
	"Phone Cases",
	"Mugs",
	"More",
];

export const COUNTRY_FILTER_OPTIONS = [
	FILTER_ALL.country,
	"US",
	"Japan",
	"UK",
	"South Korea",
	"India",
	"Worldwide",
];

export const PICKER_SORT_OPTIONS = [
	{ value: "newest", label: "Newest first", api: "-createdAt" },
	{ value: "oldest", label: "Oldest first", api: "createdAt" },
	{ value: "price-asc", label: "Price: Low → High", api: "price" },
	{ value: "price-desc", label: "Price: High → Low", api: "-price" },
	{ value: "title-asc", label: "Title A–Z", api: "title" },
];

export const PICKER_PAGE_SIZE = 20;

export const sortToApiParam = (sortBy) =>
	PICKER_SORT_OPTIONS.find((o) => o.value === sortBy)?.api || "-createdAt";
