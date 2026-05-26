import { ChevronDownIcon } from "./Icons";
import { countries } from "../../utils/countries";
import {
	ANIME_FILTER_OPTIONS,
	STORE_FILTER_OPTIONS,
	CATEGORY_FILTER_OPTIONS,
	COUNTRY_FILTER_OPTIONS,
	PICKER_SORT_OPTIONS,
	FILTER_ALL,
} from "../../constants/productFilters";

const SUB_CATEGORY_MAP = {
	"Clothing": ["T-Shirts", "Hoodies", "Pants", "Jackets", "Other"],
	"Electronics": ["Mouse Pads", "Phone Cases", "Keyboards", "Headphones", "Other"],
	"Posters": ["Canvas Print", "Paper Poster", "Metal Print", "Framed Poster", "Other"],
	"Gadgets": ["Keychains", "Mugs", "Lamps", "Other"],
	"Figures": ["Action Figure", "Statue", "Funko Pop", "Nendoroid", "Other"],
	"Accessories": ["Necklace", "Bracelet", "Ring", "Earrings", "Bag", "Other"],
	"Cosplay": ["Costume", "Props", "Wigs", "Other"],
};

const FilterPanel = ({ onFilterChange, selectedFilters = {}, showCountryFilter = false }) => {
	const animeOptions = ANIME_FILTER_OPTIONS;
	const storeOptions = STORE_FILTER_OPTIONS;
	const categoryOptions = CATEGORY_FILTER_OPTIONS;
	const sortOptions = PICKER_SORT_OPTIONS;

	const selectedCategory = selectedFilters.category || "All Categories";
	const subCategoryOptions = SUB_CATEGORY_MAP[selectedCategory] || [];
	const showSubCategory = subCategoryOptions.length > 0;

	const handleFilterChange = (filterType, value) => {
		const updated = { ...selectedFilters, [filterType]: value };
		// Reset subCategory when category changes
		if (filterType === "category") {
			updated.subCategory = "All";
		}
		onFilterChange(updated);
	};

	// Calculate grid cols
	let cols = 4; // base: anime, store, category, sort
	if (showCountryFilter) cols++;
	if (showSubCategory) cols++;
	const gridClass = `grid grid-cols-2 sm:grid-cols-3 gap-3 ${
		cols === 6 ? "lg:grid-cols-6" :
		cols === 5 ? "lg:grid-cols-5" :
		"lg:grid-cols-4"
	}`;

	const selectClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors";

	return (
		<div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-sm">
			<div className="flex items-center gap-2 mb-4">
				<ChevronDownIcon className="h-4 w-4 text-purple-400" />
				<h3 className="text-sm font-semibold text-white uppercase tracking-wider">Filters</h3>
				{/* Active filter count badge */}
				{(() => {
					const activeCount = [
						selectedFilters.animeTag && selectedFilters.animeTag !== "All Anime",
						selectedFilters.store && selectedFilters.store !== "All Stores",
						selectedFilters.category && selectedFilters.category !== "All Categories",
						selectedFilters.subCategory && selectedFilters.subCategory !== "All",
						showCountryFilter && selectedFilters.regionCountry && selectedFilters.regionCountry !== "All Countries",
					].filter(Boolean).length;
					return activeCount > 0 ? (
						<span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
							{activeCount}
						</span>
					) : null;
				})()}
			</div>

			<div className={gridClass}>
				{showCountryFilter && (
					<div>
						<label className="block text-xs font-medium text-zinc-400 mb-1.5">Country</label>
						<select
							value={selectedFilters.regionCountry || "All Countries"}
							onChange={(e) => handleFilterChange("regionCountry", e.target.value)}
							className={selectClass}
						>
							<option value="All Countries">All Countries</option>
							{countries
								.filter((c) => c.value !== "Worldwide")
								.map((c) => (
									<option key={c.value} value={c.value}>{c.label}</option>
								))}
						</select>
					</div>
				)}

				<div>
					<label className="block text-xs font-medium text-zinc-400 mb-1.5">Anime</label>
					<select
						value={selectedFilters.animeTag || "All Anime"}
						onChange={(e) => handleFilterChange("animeTag", e.target.value)}
						className={selectClass}
					>
						{animeOptions.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-xs font-medium text-zinc-400 mb-1.5">Store</label>
					<select
						value={selectedFilters.store || "All Stores"}
						onChange={(e) => handleFilterChange("store", e.target.value)}
						className={selectClass}
					>
						{storeOptions.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
					<select
						value={selectedFilters.category || "All Categories"}
						onChange={(e) => handleFilterChange("category", e.target.value)}
						className={selectClass}
					>
						{categoryOptions.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
				</div>

				{showSubCategory && (
					<div>
						<label className="block text-xs font-medium text-violet-400 mb-1.5 flex items-center gap-1">
							<span>Sub Category</span>
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500"></span>
						</label>
						<select
							value={selectedFilters.subCategory || "All"}
							onChange={(e) => handleFilterChange("subCategory", e.target.value)}
							className="w-full rounded-lg border border-violet-700/50 bg-zinc-900 px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
						>
							<option value="All">All {selectedCategory}</option>
							{subCategoryOptions.map((sc) => (
								<option key={sc} value={sc}>{sc}</option>
							))}
						</select>
					</div>
				)}

				<div>
					<label className="block text-xs font-medium text-zinc-400 mb-1.5">Sort By</label>
					<select
						value={selectedFilters.sort || "-createdAt"}
						onChange={(e) => handleFilterChange("sort", e.target.value)}
						className={selectClass}
					>
						{sortOptions.map((option) => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
};

export default FilterPanel;
