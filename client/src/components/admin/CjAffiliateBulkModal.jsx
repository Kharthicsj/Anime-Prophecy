import React, { useState } from "react";
import { FiX, FiSearch, FiList, FiLink } from "react-icons/fi";
import apiClient from "../../services/apiClient";
import SearchableSelect from "../ui/SearchableSelect";
import CurrencySearchableSelect from "../ui/CurrencySearchableSelect";
import { ALL_COUNTRIES, CURRENCY_LIST, ANIME_OPTIONS, CATEGORY_OPTIONS, SUB_CATEGORY_MAP } from "../../utils/constants";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { SearchableDropdown } from "../common/FilterPanel";

const CjAffiliateBulkModal = ({ onClose, onUploadSuccess, formAnimeOptions = [], formCategoryOptions = [], dynamicSubCategories = [] }) => {
	const [activeTab, setActiveTab] = useState("search"); // 'search', 'ids', 'csv'

	// Form States
	const [keywords, setKeywords] = useState("");
	const [targetCurrency, setTargetCurrency] = useState("");
	const [availability, setAvailability] = useState("IN_STOCK");

	const [productIdsInput, setProductIdsInput] = useState("");
	const [csvFile, setCsvFile] = useState(null);

	// Classification States
	const [defaultAnimeTag, setDefaultAnimeTag] = useState("Other");
	const [customAnimeTag, setCustomAnimeTag] = useState("");
	const [defaultCategory, setDefaultCategory] = useState("Other");
	const [customCategory, setCustomCategory] = useState("");
	const [defaultSubCategory, setDefaultSubCategory] = useState("Other");
	const [customSubCategory, setCustomSubCategory] = useState("");
	const [defaultCountries, setDefaultCountries] = useState(["Worldwide"]);

	// Data States
	const [products, setProducts] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [selectedProductIds, setSelectedProductIds] = useState(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [importResult, setImportResult] = useState(null);
	const [existingIds, setExistingIds] = useState(new Set());
	const [displayLimit, setDisplayLimit] = useState(100);
	const [localFilterKeyword, setLocalFilterKeyword] = useState("");
	const [localFilterStore, setLocalFilterStore] = useState("");
	const [localFilterCategory, setLocalFilterCategory] = useState("");
	const [localFilterCountry, setLocalFilterCountry] = useState("");
	const [localFilterCurrency, setLocalFilterCurrency] = useState("");
	const [localFilterSort, setLocalFilterSort] = useState("default");
	const [localFilterAddedState, setLocalFilterAddedState] = useState("all");
	const [isClassifyModalOpen, setIsClassifyModalOpen] = useState(false);

	const resolvedAnimeOptions = formAnimeOptions.length > 0 ? formAnimeOptions : Array.from(new Set([...ANIME_OPTIONS, "Other"]));
	const resolvedCategoryOptions = formCategoryOptions.length > 0 ? formCategoryOptions : Array.from(new Set([...CATEGORY_OPTIONS, "Other"]));

	const toggleSelection = (idx) => {
		const product = products[idx];
		if (existingIds.has(product.affiliateProductId)) return;

		const newSet = new Set(selectedProductIds);
		if (newSet.has(idx)) {
			newSet.delete(idx);
		} else {
			newSet.add(idx);
		}
		setSelectedProductIds(newSet);
	};

	let filteredProducts = products.filter(p => {
		const matchKeyword = p.title.toLowerCase().includes(localFilterKeyword.toLowerCase());
		const matchStore = localFilterStore ? p.store === localFilterStore : true;
		const matchCurrency = localFilterCurrency ? p.currency === localFilterCurrency : true;
		const matchCategory = localFilterCategory ? p.category === localFilterCategory : true;
		const matchCountry = localFilterCountry ? p.countries?.includes(localFilterCountry) : true;

		let matchAddedState = true;
		if (localFilterAddedState === "added") {
			matchAddedState = existingIds.has(p.affiliateProductId);
		} else if (localFilterAddedState === "not-added") {
			matchAddedState = !existingIds.has(p.affiliateProductId);
		}

		return matchKeyword && matchStore && matchCurrency && matchCategory && matchCountry && matchAddedState;
	});

	if (localFilterSort === "price-asc") {
		filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
	} else if (localFilterSort === "price-desc") {
		filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
	}

	const uniqueStores = [...new Set(products.map(p => p.store).filter(Boolean))].sort();
	const uniqueCurrencies = [...new Set(products.map(p => p.currency).filter(Boolean))].sort();
	const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
	const uniqueCountries = [...new Set(products.flatMap(p => p.countries || []).filter(Boolean))].sort();

	const selectAll = () => {
		const selectableIndices = filteredProducts
			.map((p) => products.indexOf(p))
			.filter((globalIndex) => !existingIds.has(products[globalIndex].affiliateProductId));

		// Check if all filtered selectable items are already selected
		const allSelected = selectableIndices.every(idx => selectedProductIds.has(idx));

		if (allSelected) {
			// Deselect only the filtered items
			const newSet = new Set(selectedProductIds);
			selectableIndices.forEach(idx => newSet.delete(idx));
			setSelectedProductIds(newSet);
		} else {
			// Select all filtered items
			const newSet = new Set(selectedProductIds);
			selectableIndices.forEach(idx => newSet.add(idx));
			setSelectedProductIds(newSet);
		}
	};

	const handleFetch = async () => {
		if (activeTab === "search" && !keywords.trim()) {
			setError("Please enter search keywords.");
			return;
		}
		if (activeTab === "ids" && !productIdsInput.trim()) {
			setError("Please enter Product IDs or SKUs.");
			return;
		}

		setError("");
		setImportResult(null);
		setIsLoading(true);

		try {
			let res;
			if (activeTab === "search") {
				res = await apiClient.post("/products/admin/cj/search", {
					keywords,
					targetCurrency,
					availability: availability === "Both" ? "" : availability
				});
			} else if (activeTab === "ids") {
				res = await apiClient.post("/products/admin/cj/fetch-ids", {
					ids: productIdsInput.split(/[\n,]+/).map(id => id.trim()).filter(Boolean)
				});
			}

			if (res && res.data?.data?.products) {
				const fetched = res.data.data.products;

				if (fetched.length > 0) {
					console.log("Sample Fetched CJ Product Data:", fetched[0]);
				}

				setProducts(fetched);
				setHasSearched(true);
				setDisplayLimit(100);

				let existingSet = new Set();
				const ids = fetched.map(p => p.affiliateProductId).filter(Boolean);
				try {
					if (ids.length > 0) {
						const existingRes = await apiClient.post("/products/admin/check-existing", { ids });
						if (existingRes.data?.success) {
							existingSet = new Set(existingRes.data.data.existingIds);
							setExistingIds(existingSet);
						}
					}
				} catch (e) {
					console.error("Failed to check existing IDs", e);
				}

				// Don't auto-select items initially as requested
				setSelectedProductIds(new Set());
			}
		} catch (err) {
			setError(err.response?.data?.message || "Failed to fetch products from CJ Affiliate.");
		} finally {
			setIsLoading(false);
		}
	};



	const handleSaveSelected = async () => {
		if (selectedProductIds.size === 0) return;
		setIsClassifyModalOpen(true);
	};

	const confirmAndSave = async () => {
		let finalAnimeTag = defaultAnimeTag === "Other" ? customAnimeTag.trim() : defaultAnimeTag;
		let finalCategory = defaultCategory === "Other" ? customCategory.trim() : defaultCategory;
		let finalSubCategory = defaultSubCategory === "Other" ? customSubCategory.trim() : defaultSubCategory;

		if (!finalAnimeTag || !finalCategory || defaultCountries.length === 0) {
			setError("Anime Tag, Category, and Target Countries are required.");
			return;
		}

		setError("");
		setIsSaving(true);
		setImportResult(null);

		const selectedProductsArray = Array.from(selectedProductIds).map(idx => products[idx]);

		const validProducts = selectedProductsArray.filter(p => p.affiliateLink && p.affiliateLink.trim() !== "");

		if (validProducts.length === 0) {
			setError("None of the selected products have a valid affiliate link (they were rejected by CJ). Please select valid products.");
			setIsSaving(false);
			return;
		}

		const productsToSave = validProducts.map(p => ({
			...p,
			animeTag: finalAnimeTag,
			category: finalCategory,
			subCategory: finalSubCategory,
			countries: defaultCountries.map(c => (c === "USA" || c === "United States" || c === "Unites States") ? "US" : c),
			images: (p.images && p.images.length > 0) ? p.images : ["https://via.placeholder.com/400x400?text=No+Image"],
			affiliateLink: p.affiliateLink,
			description: p.description || p.title || "CJ Affiliate Product",
			price: Number(p.price) > 0 ? Number(p.price) : 0,
			title: p.title || "CJ Affiliate Product",
			store: p.store || "CJ Affiliate"
		}));

		try {
			const res = await apiClient.post("/products/admin/bulk", { products: productsToSave });
			setImportResult({
				count: res.data.data.count || 0,
				skippedCount: res.data.data.skippedCount || 0,
				logs: [...(res.data.data.insertedProducts || []), ...(res.data.data.skippedProducts || [])]
			});
			setIsClassifyModalOpen(false);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to save products.");
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
			<div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl">

				{/* Header */}
				<div className="sticky top-0 z-10 bg-zinc-900 shadow-md shrink-0 border-b border-zinc-800 rounded-t-2xl">
					<div className="p-5 flex justify-between items-center">
						<div>
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								{(products.length > 0 || hasSearched) && (
									<button onClick={() => {
										setProducts([]);
										setHasSearched(false);
									}} className="mr-1 text-zinc-400 hover:text-white transition-colors" title="Back to Search">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
										</svg>
									</button>
								)}
								<FiLink className="text-green-500 text-2xl" /> CJ Affiliate Integration
							</h2>
							<p className="text-sm text-zinc-400 mt-1">
								Fetch products securely via CJ API.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Button
								onClick={() => window.open('https://members.cj.com', '_blank')}
								className="bg-transparent hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs py-1.5 px-3 flex items-center gap-2 font-medium transition-colors"
							>
								CJ Dashboard
							</Button>
							<button onClick={onClose} className="text-zinc-400 hover:text-white p-2 transition-colors rounded-lg hover:bg-zinc-800">
								<FiX className="w-5 h-5" />
							</button>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex border-b border-zinc-800 px-5 gap-6 text-sm font-semibold">
						<button
							onClick={() => setActiveTab("search")}
							className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${activeTab === "search" ? "border-green-500 text-green-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
						>
							<FiSearch /> Keyword Search
						</button>
						<button
							onClick={() => setActiveTab("ids")}
							className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${activeTab === "ids" ? "border-green-500 text-green-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
						>
							<FiList /> Product IDs / SKUs
						</button>
					</div>

					{/* Controls */}
					{products.length === 0 && (
						<div className="px-5 py-4 bg-zinc-900 space-y-4">
							{activeTab === "search" && (
								<div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 w-full">
									<div className="flex flex-col gap-1.5 flex-1 w-full min-w-[200px]">
										<label className="text-xs font-semibold text-zinc-400">Search Keywords</label>
										<Input
											placeholder="e.g. Demon Slayer Figures"
											value={keywords}
											onChange={(e) => setKeywords(e.target.value)}
											onKeyDown={(e) => { if (e.key === 'Enter') handleFetch(); }}
											className="!bg-zinc-800 !border-zinc-700 text-sm h-[42px]"
										/>
									</div>
									<div className="flex flex-col gap-1.5 w-full sm:w-[150px] shrink-0">
										<label className="text-xs font-semibold text-zinc-400">Stock Status</label>
										<select 
											value={availability}
											onChange={(e) => setAvailability(e.target.value)}
											className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm py-2.5 px-3 h-[42px] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors cursor-pointer"
										>
											<option value="IN_STOCK">In Stock</option>
											<option value="OUT_OF_STOCK">Out of Stock</option>
											<option value="Both">Both Types</option>
										</select>
									</div>
									<div className="flex flex-col gap-1.5 w-full sm:w-[180px] shrink-0">
										<label className="text-xs font-semibold text-zinc-400">Fetch by Currency</label>
										<div className="h-[42px] [&>div>div]:h-[42px]">
											<CurrencySearchableSelect
												name="targetCurrency"
												value={targetCurrency}
												onChange={(e) => setTargetCurrency(e.target.value)}
												currencies={CURRENCY_LIST}
											/>
										</div>
									</div>
									<Button onClick={handleFetch} disabled={isLoading || isSaving} className="bg-green-600 hover:bg-green-700 w-full sm:w-[140px] shrink-0 text-sm h-[42px] !p-0 flex items-center justify-center">
										{isLoading ? "Fetching..." : "Fetch Products"}
									</Button>
								</div>
							)}

							{activeTab === "ids" && (
								<div className="flex flex-col gap-4 w-full">
									<div className="flex flex-col gap-1.5 w-full">
										<label className="text-xs font-semibold text-zinc-400">CJ SKUs Id (Comma-separated or newline)</label>
										<textarea
											value={productIdsInput}
											onChange={(e) => setProductIdsInput(e.target.value)}
											onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFetch(); } }}
											placeholder="e.g. 692a77cef59..., 45241087623330"
											className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:outline-none focus:border-green-500/50 h-24 custom-scrollbar resize-none w-full"
										/>
									</div>
									<div className="flex justify-end w-full">
										<Button onClick={handleFetch} disabled={isLoading || isSaving} className="bg-green-600 hover:bg-green-700 w-full sm:w-[180px] text-sm py-2 h-[42px] mt-1">
											{isLoading ? "Fetching..." : "Fetch Products"}
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="overflow-y-auto flex-1 p-5 bg-black/20">
					{products.length === 0 ? (
						<div className="text-center text-zinc-500 py-12 text-sm flex flex-col items-center">
							<FiSearch className="text-4xl mb-4 opacity-50" />
							{hasSearched ? (
								<div className="text-red-400">No products found from the API for your search. Try different keywords or options.</div>
							) : (
								<>
									{activeTab === "search" && "Enter keywords and fetch to see CJ products."}
									{activeTab === "ids" && "Enter unique CJ Product IDs or SKUs and fetch."}
								</>
							)}
						</div>
					) : (
						<div className="flex flex-col items-center w-full pb-8">
							<div className="p-5 border border-zinc-800 bg-zinc-900 rounded-xl flex flex-col gap-4 w-full mb-6 shadow-md">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-3">
										<h3 className="text-sm font-semibold text-zinc-200">Filter Fetched Products</h3>
										{(localFilterKeyword || localFilterStore || localFilterCategory || localFilterCountry || localFilterCurrency || localFilterSort !== "default" || localFilterAddedState !== "all") && (
											<button
												onClick={() => {
													setLocalFilterKeyword("");
													setLocalFilterStore("");
													setLocalFilterCategory("");
													setLocalFilterCountry("");
													setLocalFilterCurrency("");
													setLocalFilterSort("default");
													setLocalFilterAddedState("all");
												}}
												className="text-[0.72rem] text-zinc-500 hover:text-red-400 transition-colors underline bg-transparent border-none cursor-pointer p-0"
											>
												Clear all
											</button>
										)}
									</div>
								</div>

								<div className="relative w-full mb-4">
									<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
									<input
										type="text"
										value={localFilterKeyword}
										onChange={(e) => setLocalFilterKeyword(e.target.value)}
										placeholder="Search by title..."
										className="w-full pl-10 pr-4 py-2.5 rounded-[8px] bg-[#09090b] border border-[#3f3f46] text-white text-[0.82rem] focus:outline-none focus:border-purple-500 transition-colors"
									/>
									{localFilterKeyword && (
										<button onClick={() => setLocalFilterKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
											<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
										</button>
									)}
								</div>

								<div className="grid grid-cols-2 lg:grid-cols-6 gap-4 w-full">
									<div className="flex flex-col justify-end">
										<SearchableDropdown
											label="DB STATUS"
											value={localFilterAddedState}
											onChange={(v) => setLocalFilterAddedState(v)}
											options={[
												{ value: "all", label: "All Products" },
												{ value: "not-added", label: "New (Not Added)" },
												{ value: "added", label: "Already in DB" }
											]}
										/>
									</div>
									<div className="flex flex-col justify-end">
										<SearchableDropdown
											label="ADVERTISER"
											value={localFilterStore || "All Stores"}
											onChange={(v) => setLocalFilterStore(v === "All Stores" ? "" : v)}
											options={[
												{ value: "All Stores", label: "All Stores" },
												...uniqueStores.map(store => ({ value: store, label: store }))
											]}
										/>
									</div>
									<div className="flex flex-col justify-end">
										<SearchableDropdown
											label="CATEGORY"
											value={localFilterCategory || "All Categories"}
											onChange={(v) => setLocalFilterCategory(v === "All Categories" ? "" : v)}
											options={[
												{ value: "All Categories", label: "All Categories" },
												...uniqueCategories.map(cat => ({ value: cat, label: cat }))
											]}
										/>
									</div>
									<div className="flex flex-col justify-end">
										<SearchableDropdown
											label="COUNTRY"
											value={localFilterCountry || "All Countries"}
											onChange={(v) => setLocalFilterCountry(v === "All Countries" ? "" : v)}
											options={[
												{ value: "All Countries", label: "All Countries" },
												...uniqueCountries.map(country => ({ value: country, label: country }))
											]}
										/>
									</div>
									<div className="flex flex-col justify-end">
										<SearchableDropdown
											label="CURRENCY"
											value={localFilterCurrency || "All"}
											onChange={(v) => setLocalFilterCurrency(v === "All" ? "" : v)}
											options={[
												{ value: "All", label: "All" },
												...uniqueCurrencies.map(currency => ({ value: currency, label: currency }))
											]}
										/>
									</div>
									<div className="flex flex-col justify-end">
										<SearchableDropdown
											label="SORT BY"
											value={localFilterSort}
											onChange={(v) => setLocalFilterSort(v)}
											options={[
												{ value: "default", label: "Latest / Relevance" },
												{ value: "price-asc", label: "Price: Low to High" },
												{ value: "price-desc", label: "Price: High to Low" }
											]}
										/>
									</div>
								</div>

								{!importResult && (
									<div className="flex justify-between items-center pt-4 border-t border-zinc-800 mt-2">
										<div className="text-sm text-zinc-400 font-semibold">
											{selectedProductIds.size} selected
										</div>
										<div className="flex gap-3">
											<Button onClick={selectAll} variant="secondary" className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700">
												Select Visible Items
											</Button>
											<Button onClick={handleSaveSelected} disabled={selectedProductIds.size === 0} className="bg-purple-600 hover:bg-purple-700 text-sm disabled:opacity-50 text-white border-transparent shadow-md">
												Save {selectedProductIds.size} Selected
											</Button>
										</div>
									</div>
								)}

								{importResult && (
									<div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden text-sm flex flex-col">
										<div className="flex items-center gap-4 p-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
											<div className="flex items-center gap-2 text-green-400 font-semibold">
												<span>✓</span> {importResult.count} Imported
											</div>
											<div className={`flex items-center gap-2 font-semibold ${importResult.skippedCount > 0 ? "text-amber-400" : "text-zinc-500"}`}>
												<span>⚠</span> {importResult.skippedCount} Skipped
											</div>
										</div>

										<div className="p-3 h-48 overflow-y-auto text-zinc-400 text-xs custom-scrollbar bg-black/50 font-mono">
											<p className="font-semibold text-zinc-300 mb-2 font-sans flex items-center gap-2">
												<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
												Import Console Log:
											</p>
											<ul className="space-y-1.5">
												{importResult.logs?.map((log, idx) => (
													<li key={idx} className="truncate">
														<span className="text-zinc-300">Product {idx + 1}</span> =&gt;
														<span className="text-purple-400 mx-1">{log.id}</span>
														<span className="text-zinc-500">({log.title.substring(0, 30)}...)</span> -
														<span className={`ml-2 font-semibold ${log.status === 'Added' ? 'text-green-400' : 'text-amber-400'}`}>
															{log.status}
														</span>
													</li>
												))}
											</ul>
										</div>

										<div className="p-3 bg-zinc-900 flex justify-end border-t border-zinc-800 shrink-0">
											<Button onClick={() => { onUploadSuccess(); onClose(); }} className="bg-zinc-800 hover:bg-zinc-700 text-xs py-1.5 px-4 text-white border border-zinc-700">
												Done & Close
											</Button>
										</div>
									</div>
								)}
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full mb-6">
								{filteredProducts.slice(0, displayLimit).map((p, idx) => {
									const globalIndex = products.indexOf(p);
									const isExisting = existingIds.has(p.affiliateProductId);
									const isSelected = selectedProductIds.has(globalIndex);

									return (
										<div
											key={globalIndex}
											onClick={() => toggleSelection(globalIndex)}
											className={`relative bg-zinc-900 border rounded-xl overflow-hidden p-3 transition-all ${isExisting ? "border-zinc-800 opacity-60 cursor-not-allowed bg-black/40" : isSelected ? "border-green-500 shadow-lg shadow-green-900/20 bg-zinc-800/50 cursor-pointer" : "border-zinc-800 hover:border-zinc-600 cursor-pointer"}`}
										>
											{!isExisting && (
												<div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-green-500 border-green-400" : "bg-zinc-900/80 border-zinc-600"}`}>
													{isSelected && <span className="text-white text-xs font-bold leading-none">✓</span>}
												</div>
											)}
											{isExisting && (
												<div className="absolute top-2 left-2 right-2 z-10 flex justify-center">
													<div className="bg-zinc-800/90 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700/50 flex items-center gap-1 backdrop-blur-sm shadow-md">
														<span>✓</span> Already Added
													</div>
												</div>
											)}

											<div className={`aspect-square bg-zinc-800 rounded-lg mb-2 overflow-hidden flex items-center justify-center p-1 ${isExisting ? 'grayscale' : ''}`}>
												{p.images && p.images[0] ? (
													<img src={p.images[0]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
												) : (
													<span className="text-zinc-600 text-xs">No Image</span>
												)}
											</div>
											<h4 className="text-[11px] text-white line-clamp-2 mb-1 leading-snug">{p.title}</h4>
											<div className="flex justify-between items-center mt-1">
												<div className="text-green-400 text-xs font-bold">{p.currency} {p.price}</div>
												<div className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase">{p.store}</div>
											</div>
										</div>
									);
								})}
							</div>

							{displayLimit < filteredProducts.length && (
								<Button
									onClick={() => setDisplayLimit(prev => Math.min(prev + 100, filteredProducts.length))}
									variant="secondary"
									className="px-8 py-2 border-zinc-700"
								>
									Load Next 100 Products (Showing {displayLimit} of {filteredProducts.length})
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			{isClassifyModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
					<div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
						<h3 className="text-lg font-bold text-white mb-2">Classify & Save Products</h3>
						<p className="text-sm text-zinc-400 mb-6">
							You are about to import <span className="text-green-400 font-bold">{selectedProductIds.size}</span> selected products into the Prophecy Hub database. Please classify them.
						</p>

						<div className="flex flex-col gap-5">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-400">Anime Tag <span className="text-red-500">*</span></label>
								<SearchableSelect
									name="defaultAnimeTag"
									value={defaultAnimeTag}
									onChange={(e) => setDefaultAnimeTag(e.target.value)}
									options={resolvedAnimeOptions}
									placeholder="Select Anime"
								/>
								{defaultAnimeTag === "Other" && (
									<Input placeholder="Enter custom anime" value={customAnimeTag} onChange={(e) => setCustomAnimeTag(e.target.value)} />
								)}
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-400">Category <span className="text-red-500">*</span></label>
								<SearchableSelect
									name="defaultCategory"
									value={defaultCategory}
									onChange={(e) => {
										setDefaultCategory(e.target.value);
										setDefaultSubCategory("");
									}}
									options={resolvedCategoryOptions}
									placeholder="Select Category"
								/>
								{defaultCategory === "Other" && (
									<Input placeholder="Enter custom category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
								)}
							</div>

							{(SUB_CATEGORY_MAP[defaultCategory]?.length > 0 || defaultCategory === "Other" || dynamicSubCategories.length > 0) && (
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-zinc-400">SubCategory</label>
									<SearchableSelect
										name="defaultSubCategory"
										value={defaultSubCategory}
										onChange={(e) => setDefaultSubCategory(e.target.value)}
										options={Array.from(new Set([...(SUB_CATEGORY_MAP[defaultCategory] || []), ...dynamicSubCategories, "Other"]))}
										placeholder="Select SubCategory"
										upwards={true}
									/>
									{defaultSubCategory === "Other" && (
										<Input placeholder="Specify subcategory" value={customSubCategory} onChange={(e) => setCustomSubCategory(e.target.value)} />
									)}
								</div>
							)}

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-400">Target Countries <span className="text-red-500">*</span></label>
								<SearchableSelect
									name="defaultCountries"
									value={defaultCountries}
									onChange={(e) => setDefaultCountries(e.target.value)}
									options={ALL_COUNTRIES}
									placeholder="Select Countries"
									multiple={true}
									upwards={true}
								/>
							</div>
						</div>

						{error && <div className="text-red-400 bg-red-900/20 border border-red-800/50 p-3 rounded-lg text-sm mt-5">{error}</div>}

						<div className="flex gap-3 justify-end mt-8">
							<Button onClick={() => setIsClassifyModalOpen(false)} variant="secondary" className="px-5">
								Go Back
							</Button>
							<Button onClick={confirmAndSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 px-6 disabled:opacity-50">
								{isSaving ? "Saving..." : "Confirm & Save to DB"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
export default CjAffiliateBulkModal;
