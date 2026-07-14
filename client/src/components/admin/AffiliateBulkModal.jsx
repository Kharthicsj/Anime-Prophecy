import React, { useState } from "react";
import { FiX, FiExternalLink } from "react-icons/fi";
import { SiAliexpress, SiFlipkart } from "react-icons/si";
import { FaAmazon } from "react-icons/fa";
import apiClient from "../../services/apiClient";
import SearchableSelect from "../ui/SearchableSelect";
import CurrencySearchableSelect from "../ui/CurrencySearchableSelect";
import { ALL_COUNTRIES, CURRENCY_LIST, SUB_CATEGORY_MAP } from "../../utils/constants";
import Button from "../ui/Button";
import Input from "../ui/Input";

const AffiliateBulkModal = ({ platform, onClose, onUploadSuccess, formAnimeOptions, formCategoryOptions }) => {
	const [productIdsInput, setProductIdsInput] = useState("");
	const [defaultAnimeTag, setDefaultAnimeTag] = useState("Demon Slayer");
	const [customAnimeTag, setCustomAnimeTag] = useState("");
	const [defaultCategory, setDefaultCategory] = useState("Figures");
	const [customCategory, setCustomCategory] = useState("");
	const [defaultSubCategory, setDefaultSubCategory] = useState("Action Figure");
	const [customSubCategory, setCustomSubCategory] = useState("");
	const [targetCountry, setTargetCountry] = useState(["Worldwide"]);
	const [targetCurrency, setTargetCurrency] = useState("USD");
	const [products, setProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [importResult, setImportResult] = useState(null);

	const handleFetch = async () => {
		if (!productIdsInput.trim()) {
			setError("Please enter at least one Product ID.");
			return;
		}

		// Split by comma, newline, or space to allow direct Excel column pasting
		const ids = productIdsInput
			.split(/[\s,]+/)
			.map((id) => id.trim())
			.filter(Boolean);

		if (ids.length === 0) {
			setError("No valid Product IDs found.");
			return;
		}

		if (ids.length > 500) {
			setError("Max 500 products at a time allowed.");
			return;
		}

		setIsLoading(true);
		setError("");
		setProducts([]);

		try {
			// Currently only aliexpress backend route is implemented, but frontend is ready
			const endpoint = platform === 'aliexpress' ? "/products/admin/aliexpress/fetch" : `/products/admin/${platform}/fetch`;
			const res = await apiClient.post(endpoint, { 
				productIds: ids,
				targetCountry,
				targetCurrency
			});
			const fetchedProducts = res.data?.data?.products || [];
			if (fetchedProducts.length === 0) {
				const backendErrors = res.data?.data?.errors;
				if (backendErrors && backendErrors.length > 0) {
					setError(`API Error: ${backendErrors[0]}`);
				} else {
					setError("No products found for the given IDs.");
				}
			} else {
				setProducts(fetchedProducts);
				if (res.data?.data?.errors?.length > 0) {
					console.warn("Some chunks failed:", res.data.data.errors);
					setError(`Warning: Some chunks failed: ${res.data.data.errors[0]}`);
				}
			}
		} catch (err) {
			setError(err.response?.data?.message || "Failed to fetch products from AliExpress.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveAll = async () => {
		if (products.length === 0) return;
		setIsSaving(true);
		setError("");
		
		try {
			// Apply default animeTag, category, and subCategory to all products before saving
			const finalAnimeTag = defaultAnimeTag === "Other" ? customAnimeTag : defaultAnimeTag;
			const finalCategory = defaultCategory === "Other" ? customCategory : defaultCategory;
			const finalSubCategory = defaultSubCategory === "Other" ? customSubCategory : defaultSubCategory;
			
			const productsToSave = products.map(p => ({
				...p,
				animeTag: finalAnimeTag,
				category: finalCategory,
				subCategory: finalSubCategory,
				affiliatePlatform: platform === 'aliexpress' ? 'AliExpress' : platform === 'amazon' ? 'Amazon' : platform === 'flipkart' ? 'Flipkart' : platform
			}));
			
			const res = await apiClient.post("/products/admin/bulk", { products: productsToSave });
			
			setImportResult({
				count: res.data.data.count || 0,
				skippedCount: res.data.data.skippedCount || 0,
				logs: [...(res.data.data.insertedProducts || []), ...(res.data.data.skippedProducts || [])]
			});
			setIsSaving(false);
			
			// We intentionally do NOT auto-close the modal here so the admin can read the full log
		} catch (err) {
			setError(err.response?.data?.message || "Failed to save products.");
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
			<div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl">
				{/* Sticky Top Section */}
				<div className="sticky top-0 z-10 bg-zinc-900 shadow-md shrink-0 border-b border-zinc-800 rounded-t-2xl">
					{/* Header */}
					<div className="p-5 flex justify-between items-center">
						<div>
							<h2 className="text-xl font-bold text-white flex items-center gap-2 capitalize">
								{platform === 'aliexpress' && <SiAliexpress className="text-orange-500 text-2xl" />}
								{platform === 'amazon' && <FaAmazon className="text-blue-500 text-2xl" />}
								{platform === 'flipkart' && <SiFlipkart className="text-yellow-500 text-2xl" />}
								{platform} Bulk Handler
							</h2>
							<p className="text-sm text-zinc-400 mt-1 capitalize">
								Fetch multiple products from {platform} using Product IDs.
							</p>
						</div>
						<div className="flex items-center gap-3">
							{platform === 'aliexpress' && (
								<Button 
									onClick={() => window.open('https://portals.aliexpress.com/adcenter/index.htm', '_blank')}
									className="bg-transparent hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs py-1.5 px-3 flex items-center gap-2 font-medium transition-colors"
								>
									Ad Center <FiExternalLink className="text-zinc-400" />
								</Button>
							)}
							<button onClick={onClose} className="text-zinc-400 hover:text-white p-2 transition-colors rounded-lg hover:bg-zinc-800">
								<FiX className="w-5 h-5" />
							</button>
						</div>
					</div>

					{/* Controls */}
					{products.length === 0 && (
						<div className="px-5 pb-5 bg-zinc-900 space-y-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-400">Product IDs (Comma-separated or newline)</label>
								<textarea
									value={productIdsInput}
									onChange={(e) => setProductIdsInput(e.target.value)}
									placeholder="e.g., 1005001234567, 1005007654321"
									className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-orange-500 text-sm"
									rows={2}
								/>
							</div>
							<div className="flex flex-wrap items-end gap-3">
								<div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
									<label className="text-xs font-semibold text-zinc-400">Store / Platform</label>
									<input
										type="text"
										value={platform === 'aliexpress' ? 'AliExpress' : platform === 'amazon' ? 'Amazon' : platform === 'flipkart' ? 'Flipkart' : platform}
										disabled
										className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-500 text-sm cursor-not-allowed capitalize"
									/>
								</div>
								<div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
									<label className="text-xs font-semibold text-zinc-400">Target Country</label>
									<SearchableSelect
										name="targetCountry"
										value={targetCountry}
										onChange={(e) => setTargetCountry(e.target.value)}
										options={ALL_COUNTRIES}
										placeholder="Select Countries"
										multiple={true}
									/>
								</div>
								<div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
									<label className="text-xs font-semibold text-zinc-400">Target Currency</label>
									<CurrencySearchableSelect
										name="targetCurrency"
										value={targetCurrency}
										onChange={(e) => setTargetCurrency(e.target.value)}
										currencies={CURRENCY_LIST}
									/>
								</div>

								<Button onClick={handleFetch} disabled={isLoading || isSaving} className="bg-orange-600 hover:bg-orange-700 flex-1 min-w-[150px] text-sm py-2">
									{isLoading ? "Fetching..." : "Fetch Products"}
								</Button>
							</div>
						</div>
					)}
				</div>

				{/* Preview Grid */}
				<div className="overflow-y-auto flex-1 p-5 bg-black/20">
					{products.length === 0 ? (
						<div className="text-center text-zinc-500 py-12 text-sm">No products loaded yet. Enter IDs and fetch.</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
							{products.map((p, i) => (
								<div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-3 hover:border-orange-500/50 transition-colors">
									<img src={p.images[0]} alt="" className="w-full aspect-square object-cover rounded-lg mb-2 bg-zinc-800" />
									<h4 className="text-xs text-white line-clamp-2 mb-1 leading-snug">{p.title}</h4>
									<div className="text-orange-400 text-sm font-bold">${p.price}</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				{products.length > 0 && (
					<div className="p-5 border-t border-zinc-800 shrink-0 bg-zinc-900 rounded-b-2xl flex flex-col gap-5">
						<div className="flex flex-col mb-1">
							<h3 className="text-sm font-semibold text-zinc-200 mb-3">Classify Extracted Products</h3>
							<div className="flex flex-wrap items-start gap-4">
								<div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
									<label className="text-xs font-semibold text-zinc-400">Anime Tag <span className="text-red-500">*</span></label>
									<SearchableSelect
										name="defaultAnimeTag"
										value={defaultAnimeTag}
										onChange={(e) => setDefaultAnimeTag(e.target.value)}
										options={formAnimeOptions}
										placeholder="Select Anime"
										upwards={true}
									/>
									{defaultAnimeTag === "Other" && (
										<Input
											placeholder="Enter custom anime"
											value={customAnimeTag}
											onChange={(e) => setCustomAnimeTag(e.target.value)}
											required
											className="mt-1"
										/>
									)}
								</div>
								<div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
									<label className="text-xs font-semibold text-zinc-400">Category <span className="text-red-500">*</span></label>
									<SearchableSelect
										name="defaultCategory"
										value={defaultCategory}
										onChange={(e) => {
											setDefaultCategory(e.target.value);
											setDefaultSubCategory("");
										}}
										options={formCategoryOptions}
										placeholder="Select Category"
										upwards={true}
									/>
									{defaultCategory === "Other" && (
										<Input
											placeholder="Enter custom category"
											value={customCategory}
											onChange={(e) => setCustomCategory(e.target.value)}
											required
											className="mt-1"
										/>
									)}
								</div>
								{(SUB_CATEGORY_MAP[defaultCategory]?.length > 0 || defaultCategory === "Other") && (
									<div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
										<label className="text-xs font-semibold text-zinc-400">SubCategory <span className="text-red-500">*</span></label>
										<SearchableSelect
											name="defaultSubCategory"
											value={defaultSubCategory}
											onChange={(e) => setDefaultSubCategory(e.target.value)}
											options={[...(SUB_CATEGORY_MAP[defaultCategory] || []), "Other"]}
											placeholder="Select SubCategory"
											upwards={true}
										/>
										{defaultSubCategory === "Other" && (
											<Input
												placeholder="Specify subcategory"
												value={customSubCategory}
												onChange={(e) => setCustomSubCategory(e.target.value)}
												required
												className="mt-1"
											/>
										)}
									</div>
								)}
							</div>
						</div>
						
						{error && <div className="text-red-400 bg-red-900/20 border border-red-800/50 p-2 rounded-lg text-xs mt-2">{error}</div>}
						
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
						{!importResult && (
							<div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
								<Button onClick={() => setProducts([])} variant="secondary" className="text-sm">Clear Grid</Button>
								<Button onClick={handleSaveAll} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-sm">
									{isSaving ? "Saving..." : `Save ${products.length} Products`}
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
export default AffiliateBulkModal;
