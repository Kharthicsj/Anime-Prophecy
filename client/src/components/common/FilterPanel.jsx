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
export const SearchableDropdown = ({ label, value, options, onChange, accentColor = "#a855f7", isMulti = false, buttonStyle = {} }) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const containerRef = useRef(null);
	const inputRef = useRef(null);

	const selectedValues = isMulti 
		? (Array.isArray(value) ? value : (value && value !== options[0]?.value ? value.split(',') : []))
		: value;

	let currentLabel;
	if (isMulti) {
		if (selectedValues.length === 0) {
			currentLabel = options[0]?.label || "All";
		} else if (selectedValues.length === 1) {
			currentLabel = typeof options[0] === "object" ? (options.find(o => o.value === selectedValues[0])?.label ?? selectedValues[0]) : selectedValues[0];
		} else {
			currentLabel = `${selectedValues.length} Selected`;
		}
	} else {
		currentLabel = typeof options[0] === "object"
			? (options.find(o => o.value === value)?.label ?? value)
			: value;
	}

	const filtered = options.filter(o => {
		const lbl = typeof o === "object" ? o.label : o;
		return lbl.toLowerCase().includes(query.toLowerCase());
	});

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
		if (isMulti) {
			if (optVal === options[0]?.value) {
				onChange([]);
				setOpen(false);
			} else {
				let newValues;
				if (selectedValues.includes(optVal)) {
					newValues = selectedValues.filter(v => v !== optVal);
				} else {
					newValues = [...selectedValues, optVal];
				}
				onChange(newValues.length > 0 ? newValues : []);
			}
		} else {
			onChange(optVal);
			setOpen(false);
			setQuery("");
		}
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
                    ...buttonStyle
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
					<ul style={{ maxHeight: "200px", overflowY: "auto", margin: 0, padding: "4px", listStyle: "none" }}>
						{filtered.length === 0 ? (
							<li style={{ padding: "8px 12px", color: "#52525b", fontSize: "0.78rem", textAlign: "center" }}>
								No options found
							</li>
						) : filtered.map((o, i) => {
							const optVal = typeof o === "object" ? o.value : o;
							const optLbl = typeof o === "object" ? o.label : o;
							const isSelected = isMulti ? (optVal === options[0]?.value ? selectedValues.length === 0 : selectedValues.includes(optVal)) : optVal === value;
							return (
								<li
									key={i}
									onClick={(e) => {
										e.preventDefault();
										handleSelect(optVal);
									}}
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
									{isMulti ? (
										<div style={{
											width: "16px", height: "16px", border: `1px solid ${isSelected ? accentColor : "#52525b"}`,
											borderRadius: "3px", background: isSelected ? accentColor : "transparent",
											display: "flex", alignItems: "center", justifyContent: "center"
										}}>
											{isSelected && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
										</div>
									) : (
										isSelected && (
											<svg width="13" height="13" fill="none" stroke={accentColor} viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
											</svg>
										)
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

	const [localFilters, setLocalFilters] = useState(selectedFilters);

	useEffect(() => {
		setLocalFilters(selectedFilters);
	}, [selectedFilters]);

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
			}
		};
		fetchMeta();
	}, []);

	const selectedCategoryRaw = localFilters.category || "All Categories";
	const selectedCategories = Array.isArray(selectedCategoryRaw) ? selectedCategoryRaw : (selectedCategoryRaw && selectedCategoryRaw !== "All Categories" ? selectedCategoryRaw.split(',') : []);
	
	const firstSelectedCategory = selectedCategories.length > 0 ? selectedCategories[0] : "All Categories";

	useEffect(() => {
		if (firstSelectedCategory === "All Categories") {
			setCategorySubCategories([]);
			return;
		}
		const fetchSubCategories = async () => {
			try {
				const res = await apiClient.get(
					`/products/meta/filters?category=${encodeURIComponent(firstSelectedCategory)}`,
				);
				setCategorySubCategories(res.data?.data?.subCategories || []);
			} catch {
				setCategorySubCategories([]);
			}
		};
		fetchSubCategories();
	}, [firstSelectedCategory]);

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

	let staticSubCatList = [];
	if (selectedCategories.length > 0) {
		selectedCategories.forEach(cat => {
			if (SUB_CATEGORY_MAP[cat]) {
				staticSubCatList = [...staticSubCatList, ...SUB_CATEGORY_MAP[cat]];
			}
		});
	}
	
	const dynamicSubCatExtras = categorySubCategories.filter(
		v => !staticSubCatList.includes(v) && v !== ""
	);
	const showSubCategory = selectedCategories.length > 0;
	const subCategoryOptions = [
		{ value: "All", label: `All Sub Categories` },
		...mergeUnique(staticSubCatList, dynamicSubCatExtras).map(v => ({ value: v, label: v })),
	];

	const sortDropdownOptions = sortOptions.map(o => ({ value: o.value, label: o.label }));

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
		
		if (filterType === "category") {
			delete updated.subCategory;
		}
		setLocalFilters(updated);
	};

	const applyFilters = () => {
		onFilterChange(localFilters);
	};

	const clearAll = () => {
		setLocalFilters({});
		onFilterChange({});
	};

	const activeCount = [
		localFilters.animeTag && localFilters.animeTag !== "All Anime",
		localFilters.store && localFilters.store !== "All Stores",
		localFilters.category && localFilters.category !== "All Categories",
		localFilters.subCategory && localFilters.subCategory !== "All",
		showCountryFilter && localFilters.regionCountry && localFilters.regionCountry !== "All Countries",
	].filter(Boolean).length;

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
						onClick={clearAll}
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

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
				{showCountryFilter && (
					<SearchableDropdown
						label="Country"
						value={localFilters.regionCountry || "All Countries"}
						options={countryOptions}
						onChange={v => handleLocalFilterChange("regionCountry", v)}
						isMulti
					/>
				)}

				<SearchableDropdown
					label="Anime"
					value={localFilters.animeTag || "All Anime"}
					options={animeOptions}
					onChange={v => handleLocalFilterChange("animeTag", v)}
					isMulti
				/>

				<SearchableDropdown
					label="Store"
					value={localFilters.store || "All Stores"}
					options={storeOptions}
					onChange={v => handleLocalFilterChange("store", v)}
					isMulti
				/>

				<SearchableDropdown
					label="Category"
					value={localFilters.category || "All Categories"}
					options={categoryOptions}
					onChange={v => handleLocalFilterChange("category", v)}
					isMulti
				/>

				{showSubCategory && (
					<SearchableDropdown
						label={<span style={{ color: "#c4b5fd" }}>Sub Category <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", display: "inline-block", verticalAlign: "middle" }} /></span>}
						value={localFilters.subCategory || "All"}
						options={subCategoryOptions}
						onChange={v => handleLocalFilterChange("subCategory", v)}
						accentColor="#8b5cf6"
						isMulti
					/>
				)}

				<SearchableDropdown
					label="Sort By"
					value={localFilters.sort || "newest"}
					options={sortDropdownOptions}
					onChange={v => handleLocalFilterChange("sort", v)}
				/>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
				<button
					onClick={applyFilters}
					style={{
						background: "#7c3aed",
						color: "#fff",
						border: "none",
						padding: "0.6rem 1.5rem",
						borderRadius: "8px",
						fontSize: "0.85rem",
						fontWeight: 600,
						cursor: "pointer",
						transition: "background 0.2s",
						boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
					}}
					onMouseEnter={e => e.currentTarget.style.background = "#6d28d9"}
					onMouseLeave={e => e.currentTarget.style.background = "#7c3aed"}
				>
					Apply Filters
				</button>
			</div>
		</div>
	);
};

export default FilterPanel;
