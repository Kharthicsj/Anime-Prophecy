import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "./Icons";
import { countries } from "../../utils/countries";
import {
	ANIME_FILTER_OPTIONS,
	STORE_FILTER_OPTIONS,
	CATEGORY_FILTER_OPTIONS,
	PICKER_SORT_OPTIONS,
} from "../../constants/productFilters";
import apiClient from "../../services/apiClient";

/* ─── SUB_CATEGORY_MAP (static) ───────────────────────────────────────────── */
const SUB_CATEGORY_MAP = {
	"Clothing": ["T-Shirts", "Hoodies", "Pants", "Jackets", "Other"],
	"Electronics": ["Mouse Pads", "Phone Cases", "Keyboards", "Headphones", "Other"],
	"Posters": ["Canvas Print", "Paper Poster", "Metal Print", "Framed Poster", "Other"],
	"Gadgets": ["Keychains", "Mugs", "Lamps", "Other"],
	"Figures": ["Action Figure", "Statue", "Funko Pop", "Nendoroid", "Other"],
	"Accessories": ["Necklace", "Bracelet", "Ring", "Earrings", "Bag", "Other"],
	"Cosplay": ["Costume", "Props", "Wigs", "Other"],
};

/* ─── SearchableDropdown ───────────────────────────────────────────────────── */
/**
 * A custom searchable dropdown that mirrors the admin panel style.
 * Renders a text input that filters the option list; selecting an option
 * fires onChange with the chosen value.
 */
export const SearchableDropdown = ({ label, value, options, onChange, accentColor = "#a855f7" }) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const containerRef = useRef(null);
	const inputRef = useRef(null);

	// Derive the display label for the current value
	const currentLabel = typeof options[0] === "object"
		? (options.find(o => o.value === value)?.label ?? value)
		: value;

	// Filter options based on search query
	const filtered = options.filter(o => {
		const lbl = typeof o === "object" ? o.label : o;
		return lbl.toLowerCase().includes(query.toLowerCase());
	});

	// Close on outside click
	useEffect(() => {
		const handler = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setOpen(false);
				setQuery("");
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleOpen = () => {
		setOpen(true);
		setQuery("");
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const handleSelect = (optVal) => {
		onChange(optVal);
		setOpen(false);
		setQuery("");
	};

	const dropdownStyle = {
		position: "absolute",
		top: "calc(100% + 4px)",
		left: 0,
		right: 0,
		zIndex: 9999,
		background: "#18181b",
		border: "1px solid #3f3f46",
		borderRadius: "10px",
		boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
		overflow: "hidden",
	};

	return (
		<div style={{ position: "relative" }} ref={containerRef}>
			{label && (
				<label style={{ display: "block", fontSize: "0.72rem", fontWeight: 500, color: "#a1a1aa", marginBottom: "6px" }}>
					{label}
				</label>
			)}
			{/* Trigger button */}
			<button
				type="button"
				onClick={handleOpen}
				style={{
					width: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0.45rem 0.75rem",
					background: "#09090b",
					border: `1px solid ${open ? accentColor : "#3f3f46"}`,
					borderRadius: "8px",
					color: "#fff",
					fontSize: "0.82rem",
					cursor: "pointer",
					gap: "0.4rem",
					transition: "border-color 0.18s",
					textAlign: "left",
					fontFamily: "inherit",
				}}
			>
				<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
					{currentLabel}
				</span>
				<svg
					width="12" height="12" fill="none" stroke="#a1a1aa" viewBox="0 0 24 24"
					style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{open && (
				<div style={dropdownStyle}>
					{/* Search input */}
					<div style={{ padding: "8px", borderBottom: "1px solid #27272a" }}>
						<div style={{ position: "relative" }}>
							<svg
								style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
								width="13" height="13" fill="none" stroke="#71717a" viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={e => setQuery(e.target.value)}
								placeholder="Search..."
								style={{
									width: "100%",
									paddingLeft: "28px",
									paddingRight: "8px",
									paddingTop: "6px",
									paddingBottom: "6px",
									background: "#27272a",
									border: "1px solid #3f3f46",
									borderRadius: "6px",
									color: "#fff",
									fontSize: "0.78rem",
									outline: "none",
									fontFamily: "inherit",
									boxSizing: "border-box",
								}}
								onFocus={e => { e.target.style.borderColor = accentColor; }}
								onBlur={e => { e.target.style.borderColor = "#3f3f46"; }}
							/>
						</div>
					</div>
					{/* Options list */}
					<ul style={{ maxHeight: "200px", overflowY: "auto", margin: 0, padding: "4px", listStyle: "none" }}>
						{filtered.length === 0 ? (
							<li style={{ padding: "8px 12px", color: "#52525b", fontSize: "0.78rem", textAlign: "center" }}>
								No options found
							</li>
						) : filtered.map((o, i) => {
							const optVal = typeof o === "object" ? o.value : o;
							const optLbl = typeof o === "object" ? o.label : o;
							const isSelected = optVal === value;
							return (
								<li
									key={i}
									onClick={() => handleSelect(optVal)}
									style={{
										padding: "7px 12px",
										borderRadius: "6px",
										cursor: "pointer",
										fontSize: "0.82rem",
										color: isSelected ? "#fff" : "#d4d4d8",
										background: isSelected ? `${accentColor}22` : "transparent",
										fontWeight: isSelected ? 600 : 400,
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: "8px",
										transition: "background 0.12s",
									}}
									onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#27272a"; }}
									onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
								>
									{optLbl}
									{isSelected && (
										<svg width="13" height="13" fill="none" stroke={accentColor} viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
										</svg>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
};


/* ─── FilterPanel ──────────────────────────────────────────────────────────── */
const FilterPanel = ({ onFilterChange, selectedFilters = {}, showCountryFilter = false }) => {
	const sortOptions = PICKER_SORT_OPTIONS;

	// Dynamic options fetched from DB (merged with static lists)
	const [dynamicOptions, setDynamicOptions] = useState({
		animeTags: [],
		categories: [],
		stores: [],
		countries: [],
	});
	const [categorySubCategories, setCategorySubCategories] = useState([]);

	useEffect(() => {
		const fetchMeta = async () => {
			try {
				const res = await apiClient.get("/products/meta/filters");
				const d = res.data?.data || {};
				setDynamicOptions({
					animeTags: d.animeTags || [],
					categories: d.categories || [],
					stores: d.stores || [],
					countries: d.countries || [],
				});
			} catch {
				// silently fallback to static lists
			}
		};
		fetchMeta();
	}, []);

	const selectedCategory = selectedFilters.category || "All Categories";

	useEffect(() => {
		if (selectedCategory === "All Categories") {
			setCategorySubCategories([]);
			return;
		}
		const fetchSubCategories = async () => {
			try {
				const res = await apiClient.get(
					`/products/meta/filters?category=${encodeURIComponent(selectedCategory)}`,
				);
				setCategorySubCategories(res.data?.data?.subCategories || []);
			} catch {
				setCategorySubCategories([]);
			}
		};
		fetchSubCategories();
	}, [selectedCategory]);

	// Merge static + dynamic for each filter (deduplicated)
	const staticAnime = ANIME_FILTER_OPTIONS.filter(v => v !== "All Anime");
	const staticCategory = CATEGORY_FILTER_OPTIONS.filter(v => v !== "All Categories");
	const staticStore = STORE_FILTER_OPTIONS.filter(v => v !== "All Stores");
	const staticCountry = countries.filter(c => c.value !== "Worldwide");

	const mergeUnique = (staticArr, dynamicArr) => {
		const set = new Set([...staticArr, ...dynamicArr]);
		return [...set];
	};

	const animeOptions = [
		{ value: "All Anime", label: "All Anime" },
		...mergeUnique(staticAnime, dynamicOptions.animeTags).map(v => ({ value: v, label: v })),
	];

	const storeOptions = [
		{ value: "All Stores", label: "All Stores" },
		...mergeUnique(staticStore, dynamicOptions.stores).map(v => ({ value: v, label: v })),
	];

	const categoryOptions = [
		{ value: "All Categories", label: "All Categories" },
		...mergeUnique(staticCategory, dynamicOptions.categories).map(v => ({ value: v, label: v })),
	];

	const knownCountryValues = new Set(staticCountry.map(c => c.value));
	const customCountries = dynamicOptions.countries.filter(v => !knownCountryValues.has(v) && v !== "Worldwide");
	const countryOptions = [
		{ value: "All Countries", label: "All Countries" },
		...staticCountry.map(c => ({ value: c.value, label: c.label })),
		...customCountries.map(v => ({ value: v, label: v })),
	];

	// Sub-category options: static map for selected category + dynamic extras from DB
	const staticSubCatList = SUB_CATEGORY_MAP[selectedCategory] || [];
	const dynamicSubCatExtras = categorySubCategories.filter(
		v => !staticSubCatList.includes(v) && v !== ""
	);
	const showSubCategory = selectedCategory !== "All Categories";
	const subCategoryOptions = [
		{ value: "All", label: `All ${selectedCategory}` },
		...mergeUnique(staticSubCatList, dynamicSubCatExtras).map(v => ({ value: v, label: v })),
	];

	// Sort options (plain label-value pairs)
	const sortDropdownOptions = sortOptions.map(o => ({ value: o.value, label: o.label }));

	const handleFilterChange = (filterType, value) => {
		const updated = { ...selectedFilters, [filterType]: value };
		if (filterType === "category") updated.subCategory = "All";
		onFilterChange(updated);
	};

	// Active filter count badge
	const activeCount = [
		selectedFilters.animeTag && selectedFilters.animeTag !== "All Anime",
		selectedFilters.store && selectedFilters.store !== "All Stores",
		selectedFilters.category && selectedFilters.category !== "All Categories",
		selectedFilters.subCategory && selectedFilters.subCategory !== "All",
		showCountryFilter && selectedFilters.regionCountry && selectedFilters.regionCountry !== "All Countries",
	].filter(Boolean).length;

	// Dynamic grid columns
	let cols = 4;
	if (showCountryFilter) cols++;
	if (showSubCategory) cols++;

	return (
		<div
			style={{
				borderRadius: "14px",
				border: "1px solid #27272a",
				background: "rgba(9,9,11,0.7)",
				padding: "1.25rem",
				backdropFilter: "blur(8px)",
			}}
		>
			{/* Header row */}
			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
				<ChevronDownIcon className="h-4 w-4 text-purple-400" />
				<span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase" }}>
					Filters
				</span>
				{activeCount > 0 && (
					<span style={{
						marginLeft: "4px",
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: "20px",
						height: "20px",
						borderRadius: "50%",
						background: "#7c3aed",
						color: "#fff",
						fontSize: "0.65rem",
						fontWeight: 700,
					}}>
						{activeCount}
					</span>
				)}
				{activeCount > 0 && (
					<button
						onClick={() => onFilterChange({})}
						style={{
							marginLeft: "auto",
							fontSize: "0.72rem",
							color: "#71717a",
							background: "none",
							border: "none",
							cursor: "pointer",
							fontFamily: "inherit",
							padding: "2px 8px",
							borderRadius: "4px",
							transition: "color 0.15s",
						}}
						onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
						onMouseLeave={e => e.currentTarget.style.color = "#71717a"}
					>
						Clear all
					</button>
				)}
			</div>

			{/* Filter dropdowns */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: cols <= 2
						? "1fr"
						: cols <= 3
							? "repeat(2, 1fr)"
							: `repeat(${Math.min(cols, 3)}, 1fr)`,
					gap: "0.75rem",
				}}
			>
				{showCountryFilter && (
					<SearchableDropdown
						label="Country"
						value={selectedFilters.regionCountry || "All Countries"}
						options={countryOptions}
						onChange={v => handleFilterChange("regionCountry", v)}
					/>
				)}

				<SearchableDropdown
					label="Anime"
					value={selectedFilters.animeTag || "All Anime"}
					options={animeOptions}
					onChange={v => handleFilterChange("animeTag", v)}
				/>

				<SearchableDropdown
					label="Store"
					value={selectedFilters.store || "All Stores"}
					options={storeOptions}
					onChange={v => handleFilterChange("store", v)}
				/>

				<SearchableDropdown
					label="Category"
					value={selectedFilters.category || "All Categories"}
					options={categoryOptions}
					onChange={v => handleFilterChange("category", v)}
				/>

				{showSubCategory && (
					<SearchableDropdown
						label={<span style={{ color: "#c4b5fd" }}>Sub Category <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", display: "inline-block", verticalAlign: "middle" }} /></span>}
						value={selectedFilters.subCategory || "All"}
						options={subCategoryOptions}
						onChange={v => handleFilterChange("subCategory", v)}
						accentColor="#8b5cf6"
					/>
				)}

				<SearchableDropdown
					label="Sort By"
					value={selectedFilters.sort || "newest"}
					options={sortDropdownOptions}
					onChange={v => handleFilterChange("sort", v)}
				/>
			</div>
		</div>
	);
};

export default FilterPanel;
