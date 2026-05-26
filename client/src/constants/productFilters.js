/** Shared product filter options — aligned with server Product model enums */
import { countries } from "../utils/countries";

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
	"Clothing",
	"Electronics",
	"Posters",
	"Gadgets",
	"Figures",
	"Accessories",
	"Cosplay",
	"Other"
];

/** Derived dynamically from the countries utility — add a country once, updates everywhere */
export const COUNTRY_FILTER_OPTIONS = [
	FILTER_ALL.country,
	...countries.map((c) => c.value),
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
