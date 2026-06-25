import { useState, useMemo, useCallback, useEffect } from "react";
import {
	Package,
	Eye,
	MousePointer,
	Globe,
	BarChart3,
	Loader2,
	RefreshCw,
} from "lucide-react";
import apiClient from "../../../services/apiClient";
import DrillDownChart from "./DrillDownChart";
import Leaderboards from "./Leaderboards";
import {
	computeKPIs,
	countByCountry,
	countByField,
	geoLevel1,
	geoLevel2,
	geoLevel3,
	geoLevel4,
	catalogLevel1,
	catalogLevel2,
	formatNumber,
} from "./analyticsUtils";

const KPI_CONFIG = [
	{
		key: "totalProducts",
		label: "Total Products",
		sub: "Active listings",
		icon: Package,
		accent: "border-violet-500/40 text-violet-400/90",
		format: (v) => v.toLocaleString(),
	},
	{
		key: "totalViews",
		label: "Total Views",
		sub: "Page impressions",
		icon: Eye,
		accent: "border-sky-500/40 text-sky-400/90",
		format: formatNumber,
	},
	{
		key: "totalClicks",
		label: "Total Clicks",
		sub: "Product card clicks",
		icon: MousePointer,
		accent: "border-amber-500/40 text-amber-400/80",
		format: formatNumber,
	},
];

const KpiCard = ({ label, value, sub, icon: Icon, accent }) => (
	<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
		<div className="mb-3 flex items-center justify-between">
			<p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
				{label}
			</p>
			<div
				className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-zinc-800/50 ${accent}`}
			>
				<Icon className="h-4 w-4" />
			</div>
		</div>
		<p className="text-3xl font-bold tabular-nums tracking-tight text-zinc-100">
			{value}
		</p>
		<p className="mt-1 text-xs text-zinc-600">{sub}</p>
	</div>
);

/** Flow A: Global → Country → Anime → Store → Category → SubCategory */
function useGeoFlow(products) {
	const [depth, setDepth] = useState(0);
	const [country, setCountry] = useState(null);
	const [anime, setAnime] = useState(null);
	const [store, setStore] = useState(null);
	const [category, setCategory] = useState(null);

	const data = useMemo(() => {
		if (depth === 0) return countByCountry(products);
		if (depth === 1 && country) return geoLevel1(products, country);
		if (depth === 2 && country && anime)
			return geoLevel2(products, country, anime);
		if (depth === 3 && country && anime && store)
			return geoLevel3(products, country, anime, store);
		if (depth === 4 && country && anime && store && category)
			return geoLevel4(products, country, anime, store, category);
		return [];
	}, [products, depth, country, anime, store, category]);

	const breadcrumbs = useMemo(() => {
		const crumbs = ["Global"];
		if (country) crumbs.push(`Country: ${country}`);
		if (anime) crumbs.push(`Anime: ${anime}`);
		if (store) crumbs.push(`Store: ${store}`);
		if (category) crumbs.push(`Category: ${category}`);
		return crumbs;
	}, [country, anime, store, category]);

	const title = useMemo(() => {
		if (depth === 0) return "Country Distribution";
		if (depth === 1) return `Anime Tags in ${country}`;
		if (depth === 2) return `Store Distribution · ${anime}`;
		if (depth === 3) return `Categories · ${store}`;
		return `Sub-Categories · ${category}`;
	}, [depth, country, anime, store, category]);

	const subtitle = useMemo(() => {
		if (depth === 0) return "Product counts per country";
		if (depth === 1) return `Anime tags available in ${country}`;
		if (depth === 2) return `Store breakdown for ${anime} in ${country}`;
		if (depth === 3)
			return `Category breakdown at ${store} (${anime}, ${country})`;
		return `Sub-categories within ${category} at ${store}`;
	}, [depth, country, anime, store, category]);

	const handleClick = (name) => {
		if (depth === 0) {
			setCountry(name);
			setDepth(1);
		} else if (depth === 1) {
			setAnime(name);
			setDepth(2);
		} else if (depth === 2) {
			setStore(name);
			setDepth(3);
		} else if (depth === 3) {
			setCategory(name);
			setDepth(4);
		}
	};

	const handleBack = () => {
		if (depth === 4) {
			setCategory(null);
			setDepth(3);
		} else if (depth === 3) {
			setStore(null);
			setDepth(2);
		} else if (depth === 2) {
			setAnime(null);
			setDepth(1);
		} else if (depth === 1) {
			setCountry(null);
			setDepth(0);
		}
	};

	return {
		data,
		breadcrumbs,
		title,
		subtitle,
		canDrill: depth < 4,
		chartType: "bar",
		valueLabel: "products",
		totalLabel: depth === 0 ? "Listings" : "Products",
		onSegmentClick: handleClick,
		onBack: handleBack,
	};
}

/** Flow B: Global → Anime → Category → SubCategory */
function useCatalogFlow(products) {
	const [depth, setDepth] = useState(0);
	const [anime, setAnime] = useState(null);
	const [category, setCategory] = useState(null);

	const data = useMemo(() => {
		if (depth === 0) return countByField(products, "animeTag");
		if (depth === 1 && anime) return catalogLevel1(products, anime);
		if (depth === 2 && anime && category)
			return catalogLevel2(products, anime, category);
		return [];
	}, [products, depth, anime, category]);

	const breadcrumbs = useMemo(() => {
		const crumbs = ["Catalog"];
		if (anime) crumbs.push(`Anime: ${anime}`);
		if (category) crumbs.push(`Category: ${category}`);
		return crumbs;
	}, [anime, category]);

	const title = useMemo(() => {
		if (depth === 0) return "Anime Distribution";
		if (depth === 1) return `Categories · ${anime}`;
		return `Sub-Categories · ${category}`;
	}, [depth, anime, category]);

	const subtitle = useMemo(() => {
		if (depth === 0) return "Product counts per anime tag";
		if (depth === 1) return `Category breakdown for ${anime}`;
		return `Sub-categories within ${category} (${anime})`;
	}, [depth, anime, category]);

	const handleClick = (name) => {
		if (depth === 0) {
			setAnime(name);
			setDepth(1);
		} else if (depth === 1) {
			setCategory(name);
			setDepth(2);
		}
	};

	const handleBack = () => {
		if (depth === 2) {
			setCategory(null);
			setDepth(1);
		} else if (depth === 1) {
			setAnime(null);
			setDepth(0);
		}
	};

	return {
		data,
		breadcrumbs,
		title,
		subtitle,
		canDrill: depth < 2,
		chartType: depth === 0 ? "pie" : "bar",
		valueLabel: "products",
		totalLabel: "Products",
		onSegmentClick: handleClick,
		onBack: handleBack,
	};
}

const AnalyticsPanel = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [stockFilter, setStockFilter] = useState("all");

	const fetchProducts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiClient.get("/products/analytics/products");
			if (res.data.success) {
				setProducts(res.data.data.products || []);
			} else {
				setError("Failed to load analytics data.");
			}
		} catch {
			setError("Could not fetch product analytics. Check your connection.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	const kpis = useMemo(() => computeKPIs(products), [products]);
	const geo = useGeoFlow(products);
	const catalog = useCatalogFlow(products);

	if (loading) {
		return (
			<div className="flex w-full flex-col items-center justify-center gap-3 py-24 text-zinc-500">
				<Loader2 className="h-8 w-8 animate-spin text-violet-400/80" />
				<p className="text-sm">Loading analytics from database…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex w-full flex-col items-center justify-center gap-4 py-24">
				<p className="text-sm text-red-400/90">{error}</p>
				<button
					type="button"
					onClick={fetchProducts}
					className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-600"
				>
					<RefreshCw className="h-4 w-4" />
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="w-full space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="mb-1 flex items-center gap-2">
						<BarChart3 className="h-5 w-5 text-violet-400/80" />
						<h2 className="text-xl font-bold text-zinc-100">
							Analytics Dashboard
						</h2>
					</div>
					<p className="text-sm text-zinc-500">
						Live data from {products.length} active products
					</p>
				</div>
				<button
					type="button"
					onClick={fetchProducts}
					title="Refresh data"
					className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
				>
					<RefreshCw className="h-3.5 w-3.5" />
					Refresh
				</button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{KPI_CONFIG.map(({ key, label, sub, icon, accent, format }) => (
					<KpiCard
						key={key}
						label={label}
						value={format(kpis[key])}
						sub={sub}
						icon={icon}
						accent={accent}
					/>
				))}
			</div>

			<div className="space-y-4">
				<div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
					<Globe className="h-4 w-4 text-sky-400/80" />
					<h3 className="text-sm font-semibold text-zinc-200">
						Drill-Down Explorer
					</h3>
				</div>
				<div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
					<DrillDownChart
						title={geo.title}
						subtitle={geo.subtitle}
						breadcrumbs={geo.breadcrumbs}
						data={geo.data}
						canDrill={geo.canDrill}
						chartType={geo.chartType}
						valueLabel={geo.valueLabel}
						totalLabel={geo.totalLabel}
						onSegmentClick={geo.onSegmentClick}
						onBack={geo.onBack}
					/>
					<DrillDownChart
						title={catalog.title}
						subtitle={catalog.subtitle}
						breadcrumbs={catalog.breadcrumbs}
						data={catalog.data}
						canDrill={catalog.canDrill}
						chartType={catalog.chartType}
						valueLabel={catalog.valueLabel}
						totalLabel={catalog.totalLabel}
						onSegmentClick={catalog.onSegmentClick}
						onBack={catalog.onBack}
					/>
				</div>
				<div className="flex flex-wrap gap-2 text-xs text-zinc-600">
					<span className="rounded-md border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-1">
						Geography → Anime → Store → Category → Sub-Category
					</span>
					<span className="rounded-md border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-1">
						Anime → Category → Sub-Category
					</span>
				</div>
			</div>

			<Leaderboards
				products={products}
				stockFilter={stockFilter}
				onToggleStock={() => {
					setStockFilter((prev) => {
						if (prev === "all") return "inStock";
						if (prev === "inStock") return "outOfStock";
						return "all";
					});
				}}
			/>
		</div>
	);
};

export default AnalyticsPanel;
