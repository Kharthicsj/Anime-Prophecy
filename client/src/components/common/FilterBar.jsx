import { SearchIcon } from "./Icons";
import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import {
	ANIME_FILTER_OPTIONS,
	STORE_FILTER_OPTIONS,
	CATEGORY_FILTER_OPTIONS,
} from "../../constants/productFilters";
import { SearchableDropdown } from "./FilterPanel";
import { countries } from "../../utils/countries";

// Merge two arrays, deduplicating
const mergeUnique = (a, b) => [...new Set([...a, ...b])];

/**
 * Filter Bar Component
 * Multi-criteria filtering for anime, stores, categories, etc.
 * Options are merged from static defaults + live DB values.
 */
const FilterBar = ({
	onFilterChange,
	selectedFilters = {},
	className = "",
	showPinterestFilter = false,
}) => {
	const [localFilters, setLocalFilters] = useState(selectedFilters);

	useEffect(() => {
		setLocalFilters(selectedFilters);
	}, [selectedFilters]);

	// ── Dynamic options from DB ──────────────────────────────────────────────
	const [dynamicOptions, setDynamicOptions] = useState({
		animeTags: [],
		stores: [],
		categories: [],
	});

	useEffect(() => {
		const fetchMeta = async () => {
			try {
				const res = await apiClient.get("/products/meta/filters");
				const d = res.data?.data || {};
				setDynamicOptions({
					animeTags: d.animeTags || [],
					stores: d.stores || [],
					categories: d.categories || [],
				});
			} catch {
				// silently fall back to static lists
			}
		};
		fetchMeta();
	}, []);

	// Static base lists (shared constants, same as FilterPanel)
	const staticAnime    = ANIME_FILTER_OPTIONS.filter(v => v !== "All Anime");
	const staticStore    = STORE_FILTER_OPTIONS.filter(v => v !== "All Stores");
	const staticCategory = CATEGORY_FILTER_OPTIONS.filter(v => v !== "All Categories");

	// Merged option lists (static + dynamic, deduped)
	const animeOptions    = ["All Anime",      ...mergeUnique(staticAnime,    dynamicOptions.animeTags)];
	const storeOptions    = ["All Stores",     ...mergeUnique(staticStore,    dynamicOptions.stores)];
	const categoryOptions = ["All Categories", ...mergeUnique(staticCategory, dynamicOptions.categories)];

	const sortOptions = [
		{ label: "Newest",             value: "-createdAt" },
		{ label: "Price: Low to High", value: "price" },
		{ label: "Price: High to Low", value: "-price" },
		{ label: "Most Viewed",        value: "-views" },
		{ label: "Top Rated",          value: "-rating" },
	];

	const countryOptions = [
		{ label: "All Countries", value: "All Countries" },
		...countries.filter(c => c.value !== "Worldwide").map(c => ({ label: c.label, value: c.value }))
	];

	const statusOptions = [
		{ label: "All Statuses", value: "All Statuses" },
		{ label: "Active", value: "Active" },
		{ label: "Inactive (Private)", value: "Inactive (Private)" },
		{ label: "Scheduled", value: "Scheduled" }
	];

	const pinterestExportOptions = [
		{ label: "All Statuses", value: "All" },
		{ label: "Exported", value: "Exported" },
		{ label: "Not Exported", value: "NotExported" }
	];

	const handleLocalFilterChange = (filterType, value) => {
		const updated = { ...localFilters };
		if (Array.isArray(value)) {
			updated[filterType] = value.join(',');
			if (value.length === 0) {
				delete updated[filterType];
			}
		} else {
			updated[filterType] = value;
		}
		setLocalFilters(updated);
	};

	const applyFilters = () => {
		onFilterChange(localFilters);
	};

	const [localSearch, setLocalSearch] = useState(localFilters.search || "");

	useEffect(() => {
		setLocalSearch(localFilters.search || "");
	}, [localFilters.search]);

	const triggerSearch = () => {
		const updated = { ...localFilters, search: localSearch };
		setLocalFilters(updated);
		onFilterChange(updated);
	};

	return (
		<div className={`space-y-4 ${className}`}>
			<div className="relative w-full">
				<SearchIcon
					className="pointer-events-auto cursor-pointer absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 hover:text-purple-400 transition-colors"
					onClick={triggerSearch}
				/>
				<input
					type="text"
					placeholder="Search products, series, or stores"
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
					className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 py-3.5 pl-11 pr-4 text-white placeholder-zinc-500 outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
				/>
			</div>

			<div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${showPinterestFilter ? 'lg:grid-cols-7' : 'lg:grid-cols-6'}`}>
				<SearchableDropdown
					label="Sort By"
					value={localFilters.sort || "-createdAt"}
					onChange={(v) => handleLocalFilterChange("sort", v)}
					options={sortOptions}
				/>
				<SearchableDropdown
					label="Category"
					value={localFilters.category || "All Categories"}
					onChange={(v) => handleLocalFilterChange("category", v)}
					options={categoryOptions}
					isMulti
				/>
				<SearchableDropdown
					label="Anime"
					value={localFilters.animeTag || "All Anime"}
					onChange={(v) => handleLocalFilterChange("animeTag", v)}
					options={animeOptions}
					isMulti
				/>
				<SearchableDropdown
					label="Store"
					value={localFilters.store || "All Stores"}
					onChange={(v) => handleLocalFilterChange("store", v)}
					options={storeOptions}
					isMulti
				/>
				<SearchableDropdown
					label="Country"
					value={localFilters.country || "All Countries"}
					onChange={(v) => handleLocalFilterChange("country", v)}
					options={countryOptions}
					isMulti
				/>
				<SearchableDropdown
					label="Status"
					value={localFilters.status || "All Statuses"}
					onChange={(v) => handleLocalFilterChange("status", v)}
					options={statusOptions}
				/>
				{showPinterestFilter && (
					<SearchableDropdown
						label="Export Status"
						value={localFilters.pinterestExported || "All"}
						onChange={(v) => handleLocalFilterChange("pinterestExported", v)}
						options={pinterestExportOptions}
					/>
				)}
			</div>

			<div className="flex justify-end mt-4">
				<button
					onClick={applyFilters}
					className="bg-purple-600 hover:bg-purple-700 text-white border-none py-2 px-6 rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
				>
					Apply Filters
				</button>
			</div>

			{/* Active Filters Display */}
			{Object.entries(selectedFilters).length > 0 && (
				<div className="flex flex-wrap gap-2">
					{Object.entries(selectedFilters).map(
						([key, value]) =>
							value &&
							key !== "sort" &&
							key !== "search" &&
							value !== "All Anime" &&
							value !== "All Stores" &&
							value !== "All Categories" &&
							value !== "All Countries" &&
							value !== "All Statuses" && 
							!(key === "pinterestExported" && value === "All") && (
								<div
									key={key}
									className="bg-purple-900/30 border border-purple-700 rounded-full px-3 py-1 text-xs text-purple-200 flex items-center gap-2"
								>
									<span>
										{key}: {value}
									</span>
									<button
										onClick={() => {
											const updated = { ...selectedFilters };
											delete updated[key];
											onFilterChange(updated);
										}}
										className="hover:text-purple-400 cursor-pointer"
									>
										✕
									</button>
								</div>
							),
					)}
				</div>
			)}
		</div>
	);
};

export default FilterBar;
