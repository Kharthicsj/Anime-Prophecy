/** Product is "newly added" if created within the last 2 days */
export const NEWLY_ADDED_MS = 2 * 24 * 60 * 60 * 1000;

export const isNewlyAdded = (product) => {
	if (!product?.createdAt) return false;
	return Date.now() - new Date(product.createdAt).getTime() < NEWLY_ADDED_MS;
};

export const getProductImage = (product) =>
	product?.images?.find((i) => i.isMain)?.url ||
	product?.images?.[0]?.url ||
	"";

export const sortProducts = (products, sortBy) => {
	const list = [...products];
	switch (sortBy) {
		case "newest":
			return list.sort(
				(a, b) => new Date(b.createdAt) - new Date(a.createdAt),
			);
		case "oldest":
			return list.sort(
				(a, b) => new Date(a.createdAt) - new Date(b.createdAt),
			);
		case "price-asc":
			return list.sort((a, b) => (a.price || 0) - (b.price || 0));
		case "price-desc":
			return list.sort((a, b) => (b.price || 0) - (a.price || 0));
		case "title-asc":
			return list.sort((a, b) =>
				(a.title || "").localeCompare(b.title || ""),
			);
		default:
			return list;
	}
};

export const filterProducts = (products, { search, category, store, animeTag }) => {
	let list = products;
	const q = search?.trim().toLowerCase();
	if (q) {
		list = list.filter(
			(p) =>
				p.title?.toLowerCase().includes(q) ||
				p.animeTag?.toLowerCase().includes(q) ||
				p.store?.toLowerCase().includes(q),
		);
	}
	if (category && category !== "All Categories") {
		list = list.filter((p) => p.category === category);
	}
	if (store && store !== "All Stores") {
		list = list.filter((p) => p.store === store);
	}
	if (animeTag && animeTag !== "All Anime") {
		list = list.filter((p) => p.animeTag === animeTag);
	}
	return list;
};

export const mapIsoToCountryValue = (iso) => {
	const map = {
		US: "US",
		JP: "Japan",
		IN: "India",
		GB: "UK",
		KR: "South Korea",
		ALL: null,
	};
	return map[iso] ?? null;
};
