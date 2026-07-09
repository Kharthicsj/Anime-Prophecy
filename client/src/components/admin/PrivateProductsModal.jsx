import React, { useState, useCallback, useRef, useEffect } from "react";
import { FiX, FiRefreshCw, FiSearch } from "react-icons/fi";
import apiClient from "../../services/apiClient";
import FilterBar from "../common/FilterBar";

const PrivateProductsModal = ({ onClose, onPrivacyChanged }) => {
	const [selectedFilters, setSelectedFilters] = useState({
		search: "",
		animeTag: "All Anime",
		store: "All Stores",
		category: "All Categories",
		country: "All Countries",
		status: "All Statuses",
		sort: "-createdAt"
	});
	const [products, setProducts] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [totalProducts, setTotalProducts] = useState(0);
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [selectAllMode, setSelectAllMode] = useState(false);
	const [isConverting, setIsConverting] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	const sentinelRef = useRef(null);
	const isFetchingRef = useRef(false);
	const PAGE_SIZE = 20;

	const buildParams = useCallback((extra = {}) => {
		return new URLSearchParams({
			sort: selectedFilters.sort || "-createdAt",
			...(selectedFilters.search && { search: selectedFilters.search }),
			...(selectedFilters.animeTag && selectedFilters.animeTag !== "All Anime" && { animeTag: selectedFilters.animeTag }),
			...(selectedFilters.category && selectedFilters.category !== "All Categories" && { category: selectedFilters.category }),
			...(selectedFilters.store && selectedFilters.store !== "All Stores" && { store: selectedFilters.store }),
			...(selectedFilters.country && selectedFilters.country !== "All Countries" && { country: selectedFilters.country }),
			...(selectedFilters.status && selectedFilters.status !== "All Statuses" && { status: selectedFilters.status === "Inactive (Private)" ? "inactive" : selectedFilters.status.toLowerCase() }),
			...extra,
		});
	}, [selectedFilters]);

	const fetchPage = useCallback(async (page, reset = false) => {
		if (isFetchingRef.current) return;
		isFetchingRef.current = true;
		setIsLoading(true);
		try {
			const params = buildParams({ page, limit: PAGE_SIZE });
			const res = await apiClient.get(`/products/admin/all?${params}`);
			const data = res.data?.data;
			const newProducts = Array.isArray(data?.products) ? data.products : [];
			const total = data?.pagination?.total || 0;
			setTotalProducts(total);
			setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
			setHasMore(newProducts.length === PAGE_SIZE && newProducts.length < total);
			setCurrentPage(page);
		} catch (err) {
			console.error("Failed to fetch products for private modal", err);
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [buildParams]);

	useEffect(() => {
		setProducts([]);
		setCurrentPage(1);
		setHasMore(true);
		setSelectedIds(new Set());
		setSelectAllMode(false);
		fetchPage(1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFilters]);

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !isLoading) {
				fetchPage(currentPage + 1);
			}
		}, { rootMargin: "200px" });
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, isLoading, currentPage, fetchPage]);

	useEffect(() => {
		const handler = (e) => { if (e.key === "Escape") onClose(); };
		document.addEventListener("keydown", handler);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handler);
			document.body.style.overflow = "unset";
		};
	}, [onClose]);

	const toggleSelect = (id) => {
		setSelectAllMode(false);
		setSelectedIds(prev => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleSelectAll = async () => {
		if (selectAllMode) {
			setSelectAllMode(false);
			setSelectedIds(new Set());
			return;
		}
		if (selectedIds.size === products.length && products.length > 0) {
			setIsLoading(true);
			try {
				const params = buildParams({ page: 1, limit: totalProducts });
				const res = await apiClient.get(`/products/admin/all?${params}`);
				const allProds = res.data?.data?.products || [];
				setSelectedIds(new Set(allProds.map(p => p._id)));
				setSelectAllMode(true);
			} catch {
				setErrorMsg("Failed to fetch all product IDs.");
				setTimeout(() => setErrorMsg(""), 4000);
			} finally {
				setIsLoading(false);
			}
		} else {
			setSelectedIds(new Set(products.map(p => p._id)));
		}
	};

	const handleBulkUpdate = async (isActive) => {
		if (selectedCount === 0) return;
		setIsConverting(true);
		setErrorMsg("");
		try {
			let body;
			if (selectAllMode) {
				body = {
					isActive,
					applyToAll: true,
					filters: {
						search: selectedFilters.search || "",
						animeTag: selectedFilters.animeTag,
						category: selectedFilters.category,
						store: selectedFilters.store,
						country: selectedFilters.country,
						status: selectedFilters.status === "Inactive (Private)" ? "inactive"
							: selectedFilters.status === "All Statuses" ? ""
							: selectedFilters.status.toLowerCase(),
					},
				};
			} else {
				body = { isActive, ids: [...selectedIds] };
			}

			const res = await apiClient.patch("/products/bulk-visibility", body);
			const { modifiedCount } = res.data?.data || {};
			const action = isActive ? "made active" : "set to private";
			setSuccessMsg(`${modifiedCount ?? selectedCount} product(s) ${action} successfully.`);
			setSelectedIds(new Set());
			setSelectAllMode(false);
			setProducts([]);
			setCurrentPage(1);
			setHasMore(true);
			fetchPage(1, true);
			onPrivacyChanged();
			setTimeout(() => setSuccessMsg(""), 5000);
		} catch (err) {
			const msg = err.response?.data?.message || "Update failed. Please try again.";
			setErrorMsg(msg);
			setTimeout(() => setErrorMsg(""), 5000);
			console.error("Bulk update failed", err);
		} finally {
			setIsConverting(false);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedCount === 0) return;
		if (!window.confirm(`Are you sure you want to permanently delete ${selectedCount} product(s)? This cannot be undone.`)) return;
		
		setIsConverting(true);
		setErrorMsg("");
		try {
			let body;
			if (selectAllMode) {
				body = {
					applyToAll: true,
					filters: {
						search: selectedFilters.search || "",
						animeTag: selectedFilters.animeTag,
						category: selectedFilters.category,
						store: selectedFilters.store,
						country: selectedFilters.country,
						status: selectedFilters.status === "Inactive (Private)" ? "inactive"
							: selectedFilters.status === "All Statuses" ? ""
							: selectedFilters.status.toLowerCase(),
					},
				};
			} else {
				body = { ids: [...selectedIds] };
			}

			const res = await apiClient.delete("/products/bulk-delete", { data: body });
			const { deletedCount } = res.data?.data || {};
			setSuccessMsg(`${deletedCount ?? selectedCount} product(s) deleted successfully.`);
			setSelectedIds(new Set());
			setSelectAllMode(false);
			setProducts([]);
			setCurrentPage(1);
			setHasMore(true);
			fetchPage(1, true);
			onPrivacyChanged();
			setTimeout(() => setSuccessMsg(""), 5000);
		} catch (err) {
			const msg = err.response?.data?.message || "Delete failed. Please try again.";
			setErrorMsg(msg);
			setTimeout(() => setErrorMsg(""), 5000);
			console.error("Bulk delete failed", err);
		} finally {
			setIsConverting(false);
		}
	};

	const selectedCount = selectAllMode ? totalProducts : selectedIds.size;
	const allLoadedSelected = products.length > 0 && products.every(p => selectedIds.has(p._id));
	const selectedProducts = products.filter(p => selectedIds.has(p._id));
	const anyActive = selectAllMode || selectedProducts.some(p => p.isActive !== false);
	const anyPrivate = selectAllMode || selectedProducts.some(p => p.isActive === false);

	return (
		<div
			className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6"
			onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
				{/* Header */}
				<div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900 shrink-0">
					<div>
						<h2 className="text-xl font-bold text-white flex items-center gap-2.5">
							<span className="text-rose-400">📦</span> Manage Products
						</h2>
						<p className="text-sm text-zinc-400 mt-1">
							Select products in bulk to change their visibility or permanently delete them from the database.
						</p>
					</div>
					<button
						onClick={onClose}
						className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
					>
						<FiX className="w-5 h-5" />
					</button>
				</div>

				{/* Scrollable Container for Filters and Products */}
				<div className="overflow-y-auto flex-1 bg-black/20">
					{/* Filters - Now scrolling inside the container */}
					<div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
						<FilterBar selectedFilters={selectedFilters} onFilterChange={setSelectedFilters} />
						<div className="flex flex-wrap justify-between items-center mt-4 gap-3">
							<p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
								{products.length} of {totalProducts} products loaded
							</p>
							<div className="flex flex-wrap items-center gap-2">
								{/* Select All — 3-state button */}
								<button
									onClick={handleSelectAll}
									disabled={isLoading || isConverting}
									className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all disabled:opacity-60 ${
										selectAllMode
											? "bg-purple-600/20 border-purple-500 text-purple-300"
											: allLoadedSelected && products.length > 0
												? "bg-rose-600/20 border-rose-500 text-rose-300"
												: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
									}`}
								>
									<span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
										selectAllMode
											? "border-purple-400 bg-purple-500"
											: allLoadedSelected && products.length > 0
												? "border-rose-400 bg-rose-500"
												: "border-zinc-500"
									}`}>
										{(selectAllMode || (allLoadedSelected && products.length > 0)) && <span className="text-white text-xs leading-none">✓</span>}
									</span>
									{selectAllMode
										? `All ${totalProducts} Selected ✕`
										: allLoadedSelected && products.length > 0
											? `Select All ${totalProducts} in DB`
											: "Select All"}
								</button>

								{/* Action buttons — shown when anything is selected */}
								{selectedCount > 0 && (
									<>
										{anyActive && (
											<button
												onClick={() => handleBulkUpdate(false)}
												disabled={isConverting}
												className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all shadow-lg shadow-rose-900/30 border border-rose-500"
											>
												🔒 {isConverting ? "Updating..." : `Make Private (${selectedCount})`}
											</button>
										)}
										{anyPrivate && (
											<button
												onClick={() => handleBulkUpdate(true)}
												disabled={isConverting}
												className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-lg shadow-emerald-900/30 border border-emerald-500"
											>
												✓ {isConverting ? "Updating..." : `Make Active (${selectedCount})`}
											</button>
										)}
										<button
											onClick={handleBulkDelete}
											disabled={isConverting}
											className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-all shadow-lg shadow-red-900/30 border border-red-500 ml-2"
										>
											🗑️ {isConverting ? "Deleting..." : `Delete Selected (${selectedCount})`}
										</button>
									</>
								)}
							</div>
						</div>

						{/* Success message */}
						{successMsg && (
							<div className="mt-3 px-4 py-2.5 rounded-lg bg-green-900/30 border border-green-700/60 text-green-300 text-sm font-medium flex items-center gap-2">
								<span>✓</span> {successMsg}
							</div>
						)}

						{/* Error message */}
						{errorMsg && (
							<div className="mt-3 px-4 py-2.5 rounded-lg bg-red-900/30 border border-red-700/60 text-red-300 text-sm font-medium">
								⚠ {errorMsg}
							</div>
						)}

						{/* Selected count badge */}
						{selectedCount > 0 && (
							<div className="mt-3 flex items-center gap-2 text-xs">
								<span className={`px-2.5 py-1 rounded-full font-semibold border ${
									selectAllMode
										? "bg-purple-900/30 border-purple-800/50 text-purple-400"
										: "bg-rose-900/30 border-rose-800/50 text-rose-400"
								}`}>
									{selectAllMode ? `All ${totalProducts}` : selectedCount} product{selectedCount !== 1 ? "s" : ""} selected
									{selectAllMode && " (entire DB)"}
								</span>
								<button
									onClick={() => { setSelectedIds(new Set()); setSelectAllMode(false); }}
									className="text-zinc-500 hover:text-rose-400 transition-colors underline"
								>
									Clear selection
								</button>
							</div>
						)}
					</div>

					{/* Product Grid */}
					<div className="p-6">
						{products.length === 0 && !isLoading ? (
							<div className="py-32 text-center text-zinc-500 flex flex-col items-center justify-center">
								<FiSearch className="text-6xl mb-5 opacity-40" />
								<p className="font-semibold text-xl text-zinc-300">No products match your search</p>
								<p className="text-sm mt-2 text-zinc-500">Try adjusting your filters.</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
									{products.map(p => {
										const isSelected = selectAllMode || selectedIds.has(p._id);
										const isPrivate = !p.isActive;
										return (
											<div
												key={p._id}
												onClick={() => toggleSelect(p._id)}
												className={`relative bg-zinc-950 border rounded-xl overflow-hidden cursor-pointer flex flex-col transition-all duration-200 ${
													isSelected
														? "border-rose-500 shadow-lg shadow-rose-900/30 ring-2 ring-rose-500/30"
														: "border-zinc-800 hover:border-zinc-600 hover:shadow-lg"
												}`}
											>
												{/* Selection indicator */}
												<div className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
													isSelected ? "bg-rose-500 border-rose-400" : "bg-zinc-900/80 border-zinc-600"
												}`}>
													{isSelected && <span className="text-white text-xs leading-none font-bold">✓</span>}
												</div>

												{/* Private badge */}
												{isPrivate && (
													<div className="absolute top-2.5 right-2.5 z-10">
														<span className="bg-rose-900/90 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-700">
															🔒 Private
														</span>
													</div>
												)}

												{/* Image */}
												<div className="relative overflow-hidden bg-zinc-800 aspect-square">
													<img
														src={p.images?.[0]?.url || "placeholder.jpg"}
														alt={p.title}
														className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
													/>
													<div className="absolute bottom-2 left-2">
														<span className="bg-purple-600/90 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded shadow-sm">
															{p.animeTag}
														</span>
													</div>
												</div>

												{/* Info */}
												<div className="p-3 flex flex-col flex-1">
													<h3 className={`font-bold line-clamp-2 text-xs leading-relaxed mb-1.5 transition-colors ${isSelected ? "text-rose-200" : "text-zinc-100"}`}>
														{p.title}
													</h3>
													<p className="text-zinc-500 text-[10px] mb-2">{p.category}{p.subCategory ? ` · ${p.subCategory}` : ""}</p>
													<div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-auto">
														<span className="text-purple-400 font-bold text-xs">
															{p.currency} {p.price?.toLocaleString(p.currency === "INR" ? "en-IN" : "en-US")}
														</span>
														<span className="text-[10px] text-zinc-600 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800">
															{p.store}
														</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>

								{hasMore && (
									<div ref={sentinelRef} className="h-24 flex items-center justify-center mt-6">
										{isLoading && (
											<span className="text-sm font-medium text-zinc-400 flex items-center gap-3 bg-zinc-900/80 px-5 py-2.5 rounded-full border border-zinc-800 shadow-sm">
												<FiRefreshCw className="animate-spin text-purple-400" /> Loading more...
											</span>
										)}
									</div>
								)}

								{!hasMore && products.length > 0 && (
									<p className="text-center text-zinc-600 text-sm mt-12 mb-4 font-semibold">
										All {totalProducts} products loaded ✓
									</p>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
export default PrivateProductsModal;
