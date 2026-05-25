import { SearchIcon } from "./Icons";
import { useState, useEffect } from "react";

/**
 * Filter Bar Component
 * Multi-criteria filtering for anime, stores, categories, etc.
 */
const FilterBar = ({
	onFilterChange,
	selectedFilters = {},
	className = "",
}) => {
	const animeOptions = [
		"All Anime",
		"AOT",
		"JJK",
		"Naruto",
		"One Piece",
		"Demon Slayer",
		"MHA",
		"Other",
	];
	const storeOptions = [
		"All Stores",
		"Amazon",
		"Flipkart",
		"Etsy",
		"eBay",
		"AliExpress",
	];
	const categoryOptions = [
		"All Categories",
		"T-Shirts",
		"Hoodies",
		"Figures",
		"Posters",
		"Keychains",
		"Mouse Pads",
		"More",
	];
	const sortOptions = [
		{ label: "Newest", value: "-createdAt" },
		{ label: "Price: Low to High", value: "price" },
		{ label: "Price: High to Low", value: "-price" },
		{ label: "Most Viewed", value: "-views" },
		{ label: "Top Rated", value: "-rating" },
	];

	const handleFilterChange = (filterType, value) => {
		onFilterChange({
			...selectedFilters,
			[filterType]: value,
		});
	};

	const [localSearch, setLocalSearch] = useState(selectedFilters.search || "");

	useEffect(() => {
		setLocalSearch(selectedFilters.search || "");
	}, [selectedFilters.search]);

	const triggerSearch = () => {
		onFilterChange({
			...selectedFilters,
			search: localSearch,
		});
	};

	return (
		<div className={`space-y-4 ${className}`}>
			<div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
				<div className="relative">
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

				<select
					value={selectedFilters.animeTag || "All Anime"}
					onChange={(e) =>
						handleFilterChange("animeTag", e.target.value)
					}
					className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
				>
					{animeOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>

				<select
					value={selectedFilters.store || "All Stores"}
					onChange={(e) =>
						handleFilterChange("store", e.target.value)
					}
					className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
				>
					{storeOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			</div>

			{/* Filter Controls */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
				<select
					value={selectedFilters.category || "All Categories"}
					onChange={(e) =>
						handleFilterChange("category", e.target.value)
					}
					className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
				>
					{categoryOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>

				<select
					value={selectedFilters.sort || "-createdAt"}
					onChange={(e) => handleFilterChange("sort", e.target.value)}
					className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
				>
					{sortOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{/* Active Filters Display */}
			{Object.entries(selectedFilters).length > 0 && (
				<div className="flex flex-wrap gap-2">
					{Object.entries(selectedFilters).map(
						([key, value]) =>
							value &&
							value !== "All Anime" &&
							value !== "All Stores" &&
							value !== "All Categories" && (
								<div
									key={key}
									className="bg-purple-900/30 border border-purple-700 rounded-full px-3 py-1 text-xs text-purple-200 flex items-center gap-2"
								>
									<span>
										{key}: {value}
									</span>
									<button
										onClick={() =>
											handleFilterChange(key, undefined)
										}
										className="hover:text-purple-400"
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
