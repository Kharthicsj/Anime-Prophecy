import React, { useState, useCallback, useRef, useEffect } from "react";
import { FiCopy, FiX, FiRefreshCw, FiSearch } from "react-icons/fi";
import apiClient from "../../services/apiClient";
import FilterBar from "../common/FilterBar";

const CopyProductModal = ({ onSelect, onClose }) => {
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

	const sentinelRef = useRef(null);
	const isFetchingRef = useRef(false);

	const PAGE_SIZE = 20;

	const fetchPage = useCallback(async (page, reset = false) => {
		if (isFetchingRef.current) return;
		isFetchingRef.current = true;
		setIsLoading(true);
		try {
			const params = new URLSearchParams({
				page,
				limit: PAGE_SIZE,
				sort: selectedFilters.sort || "-createdAt",
				...(selectedFilters.search && { search: selectedFilters.search }),
				...(selectedFilters.animeTag && selectedFilters.animeTag !== "All Anime" && { animeTag: selectedFilters.animeTag }),
				...(selectedFilters.category && selectedFilters.category !== "All Categories" && { category: selectedFilters.category }),
				...(selectedFilters.store && selectedFilters.store !== "All Stores" && { store: selectedFilters.store }),
				...(selectedFilters.country && selectedFilters.country !== "All Countries" && { country: selectedFilters.country }),
				...(selectedFilters.status && selectedFilters.status !== "All Statuses" && { status: selectedFilters.status === "Inactive (Private)" ? "inactive" : selectedFilters.status.toLowerCase() }),
			});
			const res = await apiClient.get(`/products/admin/all?${params}`);
			const data = res.data?.data;
			const newProducts = Array.isArray(data?.products) ? data.products : [];
			const total = data?.pagination?.total || 0;

			setTotalProducts(total);
			setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
			setHasMore(newProducts.length === PAGE_SIZE && newProducts.length < total);
			setCurrentPage(page);
		} catch (err) {
			console.error("Failed to fetch products for copy modal", err);
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [selectedFilters]);

	// Reset on filter change
	useEffect(() => {
		setProducts([]);
		setCurrentPage(1);
		setHasMore(true);
		fetchPage(1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFilters]);

	// Intersection Observer
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

	// Close on Escape & Body Scroll Lock
	useEffect(() => {
		const handler = (e) => { if (e.key === "Escape") onClose(); };
		document.addEventListener("keydown", handler);
		document.body.style.overflow = "hidden";
		
		return () => {
			document.removeEventListener("keydown", handler);
			document.body.style.overflow = "unset";
		};
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6"
			onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
				{/* Header */}
				<div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900 shrink-0">
					<div>
						<h2 className="text-xl font-bold text-white flex items-center gap-2.5">
							<FiCopy className="text-purple-400" /> Copy from Existing Product
						</h2>
						<p className="text-sm text-zinc-400 mt-1.5">
							All data including images, affiliate link, category, store & price will be copied.
							<span className="text-purple-400 font-medium ml-1">Images will be handled as new uploads.</span>
						</p>
					</div>
					<button
						onClick={onClose}
						className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
					>
						<FiX className="w-5 h-5" />
					</button>
				</div>

				{/* Search & Filters */}
				<div className="p-6 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
					<FilterBar
						selectedFilters={selectedFilters}
						onFilterChange={setSelectedFilters}
					/>
					<div className="flex justify-between items-center mt-5">
						<p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
							{products.length} of {totalProducts} products loaded
						</p>
					</div>
				</div>

				{/* Product List Grid */}
				<div className="overflow-y-auto flex-1 p-6 bg-black/20">
					{products.length === 0 && !isLoading ? (
						<div className="py-32 text-center text-zinc-500 flex flex-col items-center justify-center">
							<FiSearch className="text-6xl mb-5 opacity-40" />
							<p className="font-semibold text-xl text-zinc-300">No products match your search</p>
							<p className="text-sm mt-2 text-zinc-500">Try adjusting your filters to find what you're looking for.</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
								{products.map(p => (
									<div
										key={p._id}
										onClick={() => onSelect(p)}
										className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-900/20 group cursor-pointer flex flex-col"
									>
										{/* Product Image */}
										<div className="relative overflow-hidden bg-zinc-800 aspect-square">
											<img
												src={p.images?.[0]?.url || "placeholder.jpg"}
												alt={p.title}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
											/>
											<div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-col items-start">
												<span className="bg-purple-600/95 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm">
													{p.animeTag}
												</span>
											</div>
											<div className="absolute top-2.5 right-2.5">
												<span className="bg-zinc-900/95 text-yellow-400 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border border-zinc-700 shadow-sm">
													{p.store}
												</span>
											</div>
										</div>

										{/* Product Info */}
										<div className="p-4 flex flex-col flex-1 justify-between gap-4">
											<div>
												<h3 className="font-bold text-zinc-100 line-clamp-2 text-sm leading-relaxed group-hover:text-purple-300 transition-colors">
													{p.title}
												</h3>
												<p className="text-zinc-500 text-xs mt-2 font-medium">
													{p.category}{p.subCategory ? ` \u00b7 ${p.subCategory}` : ""}
												</p>
											</div>

											{/* Price & Countries */}
											<div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
												<span className="text-purple-400 font-bold text-sm tracking-wide">
													{p.currency} {p.price.toLocaleString(p.currency === 'INR' ? 'en-IN' : 'en-US')}
												</span>
												<span className="text-[10px] text-zinc-500 truncate ml-3 font-medium bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800">
													{(p.countries || []).join(", ")}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Infinite Scroll Sentinel */}
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
	);
};
export default CopyProductModal;
