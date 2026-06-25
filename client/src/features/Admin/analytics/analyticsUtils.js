/** Normalize countries field (array or single string). */
export function getCountries(product) {
	const c = product?.countries;
	if (Array.isArray(c)) return c.filter(Boolean);
	if (typeof c === "string" && c) return [c];
	return [];
}

/** Aggregate products into { name, value } chart rows, sorted descending. */
export function countByField(products, field) {
	const map = {};
	for (const p of products) {
		const key = p[field];
		if (!key) continue;
		map[key] = (map[key] || 0) + 1;
	}
	return toChartData(map);
}

/** Count products per country (products may appear in multiple countries). */
export function countByCountry(products) {
	const map = {};
	for (const p of products) {
		for (const c of getCountries(p)) {
			map[c] = (map[c] || 0) + 1;
		}
	}
	return toChartData(map);
}

/** Sum a numeric metric per country. */
export function metricByCountry(products, field) {
	const map = {};
	for (const p of products) {
		for (const c of getCountries(p)) {
			map[c] = (map[c] || 0) + (p[field] || 0);
		}
	}
	return toChartData(map);
}

/** Sum a numeric metric per category within a country. */
export function metricByCategory(products, country, field) {
	const map = {};
	const filtered = filterByCountry(products, country);
	for (const p of filtered) {
		const cat = p.category || "Uncategorized";
		map[cat] = (map[cat] || 0) + (p[field] || 0);
	}
	return toChartData(map);
}

/** Sum a numeric metric per sub-category within a country and category. */
export function metricBySubCategory(products, country, category, field) {
	const map = {};
	const filtered = filterByCategory(filterByCountry(products, country), category);
	for (const p of filtered) {
		const sub = p.subCategory || "None";
		map[sub] = (map[sub] || 0) + (p[field] || 0);
	}
	return toChartData(map);
}

export function filterByCountry(products, country) {
	return products.filter((p) => getCountries(p).includes(country));
}

export function filterByAnime(products, animeTag) {
	return products.filter((p) => p.animeTag === animeTag);
}

export function filterByCategory(products, category) {
	return products.filter((p) => p.category === category);
}

export function filterByStore(products, store) {
	return products.filter((p) => p.store === store);
}

function geoContextFilter(products, country, animeTag, store = null) {
	let filtered = filterByAnime(filterByCountry(products, country), animeTag);
	if (store) filtered = filterByStore(filtered, store);
	return filtered;
}

export function geoLevel1(products, country) {
	return countByField(filterByCountry(products, country), "animeTag");
}

export function geoLevel2(products, country, animeTag) {
	return countByField(geoContextFilter(products, country, animeTag), "store");
}

export function geoLevel3(products, country, animeTag, store) {
	return countByField(
		geoContextFilter(products, country, animeTag, store),
		"category",
	);
}

export function geoLevel4(products, country, animeTag, store, category) {
	return countByField(
		filterByCategory(
			geoContextFilter(products, country, animeTag, store),
			category,
		),
		"subCategory",
	);
}

export function catalogLevel1(products, animeTag) {
	return countByField(filterByAnime(products, animeTag), "category");
}

export function catalogLevel2(products, animeTag, category) {
	return countByField(
		filterByCategory(filterByAnime(products, animeTag), category),
		"subCategory",
	);
}

export function computeKPIs(products) {
	const totalProducts = products.length;
	const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
	const totalClicks = products.reduce((s, p) => s + (p.clicks || 0), 0);

	return { totalProducts, totalViews, totalClicks };
}

export function topProductsBy(products, field, limit = 8) {
	return [...products]
		.sort((a, b) => (b[field] || 0) - (a[field] || 0))
		.slice(0, limit)
		.map((p) => ({
			name: truncateTitle(p.title),
			fullTitle: p.title,
			value: p[field] || 0,
			animeTag: p.animeTag,
		}));
}

export function topProductsInCountry(products, country, field, limit = 8) {
	return topProductsBy(filterByCountry(products, country), field, limit);
}

export function topProductsInSubCategory(products, country, category, subCategory, field, limit = 8) {
	let filtered = filterByCategory(filterByCountry(products, country), category);
	if (subCategory !== "None") {
		filtered = filtered.filter((p) => p.subCategory === subCategory);
	} else {
		filtered = filtered.filter((p) => !p.subCategory);
	}
	return topProductsBy(filtered, field, limit);
}

export function storeDistribution(products, inStockOnly = false) {
	const filtered = inStockOnly ? products.filter((p) => p.inStock) : products;
	return countByField(filtered, "store");
}

export function stockCounts(products) {
	const inStock = products.filter((p) => p.inStock).length;
	const outOfStock = products.length - inStock;
	return [
		{ name: "In Stock", value: inStock },
		{ name: "Out of Stock", value: outOfStock },
	];
}

function truncateTitle(title = "") {
	return title.length > 28 ? `${title.slice(0, 28)}…` : title;
}

function toChartData(map) {
	return Object.entries(map)
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value);
}

export function formatNumber(n) {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}
