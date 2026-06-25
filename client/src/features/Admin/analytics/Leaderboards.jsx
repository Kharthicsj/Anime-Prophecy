import { useState, useMemo, useEffect } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	PieChart,
	Pie,
} from "recharts";
import { TrendingUp, MousePointer, Package } from "lucide-react";
import DrillDownChart from "./DrillDownChart";
import ChartTooltip from "./ChartTooltip";
import {
	CHART_COLORS,
	CHART_GRID,
	CHART_AXIS,
	CHART_AXIS_LINE,
	STOCK_COLORS,
	PIE_STROKE,
} from "./chartTheme";
import {
	metricByCountry,
	metricByCategory,
	metricBySubCategory,
	topProductsInSubCategory,
	storeDistribution,
	countByCountry,
} from "./analyticsUtils";
import ProductCard from "../../../components/common/ProductCard";
import { SearchableDropdown } from "../../../components/common/FilterPanel";
import { countries } from "../../../utils/countries";
import apiClient from "../../../services/apiClient";

function useCountryPerformanceFlow(products, field, metricLabel) {
	const [depth, setDepth] = useState(0);
	const [country, setCountry] = useState(null);
	const [category, setCategory] = useState(null);
	const [subCategory, setSubCategory] = useState(null);

	const data = useMemo(() => {
		if (depth === 0) return metricByCountry(products, field);
		if (depth === 1 && country) return metricByCategory(products, country, field);
		if (depth === 2 && country && category)
			return metricBySubCategory(products, country, category, field);
		if (depth === 3 && country && category && subCategory)
			return topProductsInSubCategory(
				products,
				country,
				category,
				subCategory,
				field,
			);
		return [];
	}, [products, depth, country, category, subCategory, field]);

	const breadcrumbs = useMemo(() => {
		const crumbs = ["Global"];
		if (country) crumbs.push(`Country: ${country}`);
		if (category) crumbs.push(`Category: ${category}`);
		if (subCategory) crumbs.push(`Sub-Category: ${subCategory}`);
		return crumbs;
	}, [country, category, subCategory]);

	const title = useMemo(() => {
		if (depth === 0)
			return metricLabel === "Views"
				? "Most Viewed by Country"
				: "Most Clicked by Country";
		if (depth === 1) return `Categories in ${country}`;
		if (depth === 2) return `Sub-Categories in ${category}`;
		return `Top in ${subCategory}`;
	}, [depth, country, category, subCategory, metricLabel]);

	const subtitle = useMemo(() => {
		if (depth === 0) return `Total ${metricLabel.toLowerCase()} per country`;
		if (depth === 1) return `Total ${metricLabel.toLowerCase()} per category`;
		if (depth === 2) return `Total ${metricLabel.toLowerCase()} per sub-category`;
		return `Highest ${metricLabel.toLowerCase()} products`;
	}, [depth, metricLabel]);

	const handleClick = (name) => {
		if (depth === 0) {
			setCountry(name);
			setDepth(1);
		} else if (depth === 1) {
			setCategory(name);
			setDepth(2);
		} else if (depth === 2) {
			setSubCategory(name);
			setDepth(3);
		}
	};

	const handleBack = () => {
		if (depth === 3) {
			setSubCategory(null);
			setDepth(2);
		} else if (depth === 2) {
			setCategory(null);
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
		canDrill: depth < 3,
		chartType: depth === 0 ? "bar" : "horizontal-bar",
		valueLabel: metricLabel.toLowerCase(),
		totalLabel: metricLabel,
		onSegmentClick: handleClick,
		onBack: handleBack,
	};
}

const StoreStockPanel = ({ products, stockFilter, onToggle }) => {
	const filteredProducts = useMemo(() => {
		if (stockFilter === "inStock") return products.filter((p) => p.inStock);
		if (stockFilter === "outOfStock") return products.filter((p) => !p.inStock);
		return products;
	}, [products, stockFilter]);

	const countryData = useMemo(() => countByCountry(filteredProducts), [filteredProducts]);
	const storeData = useMemo(() => storeDistribution(filteredProducts, false), [filteredProducts]);

	const countryTotal = useMemo(
		() => countryData.reduce((s, d) => s + d.value, 0),
		[countryData],
	);

	const getBtnText = () => {
		if (stockFilter === "inStock") return "In Stock Only";
		if (stockFilter === "outOfStock") return "Out Of Stock Only";
		return "Include Out Of Stock";
	};

	const getBtnClass = () => {
		if (stockFilter === "inStock")
			return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400/90";
		if (stockFilter === "outOfStock")
			return "border-rose-500/30 bg-rose-500/10 text-rose-400/90";
		return "border-zinc-700/60 bg-zinc-800/50 text-zinc-400";
	};

	return (
		<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-400/90">
						<Package className="h-4 w-4" />
					</div>
					<h4 className="text-sm font-semibold text-zinc-100">
						Stock & Store Distribution
					</h4>
				</div>
				<button
					type="button"
					onClick={onToggle}
					className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all border ${getBtnClass()}`}
				>
					{getBtnText()}
				</button>
			</div>

			<div className="grid items-start gap-6 md:grid-cols-2">
				<div className="flex flex-col">
					<div className="mb-3 flex items-center justify-between">
						<p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
							By Country
						</p>
						<div className="rounded-md border border-zinc-700/50 bg-zinc-800/40 px-2.5 py-1 text-right">
							<span className="text-[10px] uppercase tracking-wider text-zinc-500">
								Total{" "}
							</span>
							<span className="text-sm font-bold tabular-nums text-zinc-200">
								{countryTotal.toLocaleString()}
							</span>
						</div>
					</div>
					<ResponsiveContainer width="100%" height={220}>
						<BarChart
							data={countryData}
							margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke={CHART_GRID}
								vertical={false}
							/>
							<XAxis
								dataKey="name"
								tick={{ fill: CHART_AXIS, fontSize: 10 }}
								axisLine={{ stroke: CHART_AXIS_LINE }}
								tickLine={false}
							/>
							<YAxis
								allowDecimals={false}
								tick={{ fill: CHART_AXIS, fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								width={32}
							/>
							<Tooltip content={<ChartTooltip />} />
							<Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
								{countryData.map((_, i) => (
									<Cell
										key={i}
										fill={CHART_COLORS[i % CHART_COLORS.length]}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className="flex flex-col">
					<p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
						By Store
					</p>
					<div className="flex flex-col items-center">
						<ResponsiveContainer width="100%" height={180}>
							<PieChart>
								<Pie
									data={storeData}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="50%"
									innerRadius={42}
									outerRadius={72}
								paddingAngle={3}
								stroke={PIE_STROKE}
								strokeWidth={2}
							>
								{storeData.map((_, i) => (
									<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
								))}
							</Pie>
							<Tooltip content={<ChartTooltip />} />
							</PieChart>
						</ResponsiveContainer>
						<div className="mt-2 flex flex-wrap justify-center gap-5 text-xs text-zinc-400">
							{storeData.map((s, i) => (
								<span key={s.name} className="flex items-center gap-1.5">
									<span
										className="h-2 w-2 rounded-full"
										style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
									/>
									{s.name}:{" "}
									<span className="font-semibold text-zinc-300">
										{s.value}
									</span>
								</span>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const TrendingProductsPanel = ({ products }) => {
	const [selectedCountry, setSelectedCountry] = useState("All Countries");
	const [dynamicCountries, setDynamicCountries] = useState([]);

	useEffect(() => {
		const fetchMeta = async () => {
			try {
				const res = await apiClient.get("/products/meta/filters");
				setDynamicCountries(res.data?.data?.countries || []);
			} catch {
				// silent
			}
		};
		fetchMeta();
	}, []);

	const staticCountry = countries.filter((c) => c.value !== "Worldwide");
	const knownCountryValues = new Set(staticCountry.map((c) => c.value));
	const customCountries = dynamicCountries.filter(
		(v) => !knownCountryValues.has(v) && v !== "Worldwide",
	);
	const countryOptions = [
		{ value: "All Countries", label: "All Countries" },
		...staticCountry.map((c) => ({ value: c.value, label: c.label })),
		...customCountries.map((v) => ({ value: v, label: v })),
	];

	const trendingProducts = useMemo(() => {
		let filtered = products;
		if (selectedCountry !== "All Countries") {
			filtered = products.filter((p) => {
				const c = Array.isArray(p.countries) ? p.countries : [p.countries];
				return c.includes(selectedCountry) || c.includes("Worldwide");
			});
		}
		const sorted = [...filtered].sort((a, b) => {
			const scoreA = (a.views || 0) + (a.clicks || 0);
			const scoreB = (b.views || 0) + (b.clicks || 0);
			return scoreB - scoreA;
		});
		return sorted.slice(0, 5);
	}, [products, selectedCountry]);

	return (
		<div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400/90">
						<TrendingUp className="h-4 w-4" />
					</div>
					<h4 className="text-sm font-semibold text-zinc-100">
						Trending Products
					</h4>
				</div>
				<div className="w-64">
					<SearchableDropdown
						value={selectedCountry}
						options={countryOptions}
						onChange={setSelectedCountry}
					/>
				</div>
			</div>
			
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
				{trendingProducts.length > 0 ? (
					trendingProducts.map((p) => (
						<ProductCard key={p._id} product={p} showCountryTag={true} />
					))
				) : (
					<div className="col-span-full py-8 text-center text-zinc-500 text-sm">
						No trending products found for {selectedCountry}.
					</div>
				)}
			</div>
		</div>
	);
};

const Leaderboards = ({ products, stockFilter, onToggleStock }) => {
	const viewsFlow = useCountryPerformanceFlow(products, "views", "Views");
	const clicksFlow = useCountryPerformanceFlow(products, "clicks", "Clicks");

	return (
		<div className="space-y-5">
			<div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
				<TrendingUp className="h-4 w-4 text-violet-400/80" />
				<h3 className="text-sm font-semibold text-zinc-200">
					Performance & Engagement
				</h3>
			</div>

			<div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
				<DrillDownChart
					title={viewsFlow.title}
					subtitle={viewsFlow.subtitle}
					breadcrumbs={viewsFlow.breadcrumbs}
					data={viewsFlow.data}
					canDrill={viewsFlow.canDrill}
					chartType={viewsFlow.chartType}
					valueLabel={viewsFlow.valueLabel}
					totalLabel={viewsFlow.totalLabel}
					onSegmentClick={viewsFlow.onSegmentClick}
					onBack={viewsFlow.onBack}
				/>
				<DrillDownChart
					title={clicksFlow.title}
					subtitle={clicksFlow.subtitle}
					breadcrumbs={clicksFlow.breadcrumbs}
					data={clicksFlow.data}
					canDrill={clicksFlow.canDrill}
					chartType={clicksFlow.chartType}
					valueLabel={clicksFlow.valueLabel}
					totalLabel={clicksFlow.totalLabel}
					onSegmentClick={clicksFlow.onSegmentClick}
					onBack={clicksFlow.onBack}
				/>
			</div>

			<TrendingProductsPanel products={products} />

			<StoreStockPanel
				products={products}
				stockFilter={stockFilter}
				onToggle={onToggleStock}
			/>
		</div>
	);
};

export default Leaderboards;
