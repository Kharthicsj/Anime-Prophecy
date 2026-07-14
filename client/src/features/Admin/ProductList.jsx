import React from "react";
import { FiCopy, FiX, FiRefreshCw, FiSearch, FiLink, FiLock } from "react-icons/fi";
import { FaPinterest } from "react-icons/fa";
import Button from "../../components/ui/Button";
import { SearchableDropdown } from "../../components/common/FilterPanel";
import { BoxIcon } from "../../components/common/Icons";

const ProductList = ({
	BoxIcon,
	Button,
	FiLink,
	FiLock,
	SearchableDropdown,
	filterAnime,
	filterCategory,
	filterSubCategory,
	filterCountry,
	filterStatus,
	filterStore,
	finalAnimeOptions,
	finalCategoryOptions,
	finalSubCategoryOptions,
	finalCountryOptions,
	finalStoreOptions,
	handleDelete,
	hasMore,
	img,
	loadingList,
	openCreate,
	openEdit,
	products,
	searchQuery,
	sentinelRef,
	setFilterAnime,
	setFilterCategory,
	setFilterSubCategory,
	setFilterCountry,
	setFilterStatus,
	setFilterStore,
	setSearchQuery,
	setShowAffiliateModal,
	setShowPrivateModal,
	setShowPinterestModal,
	setShowScheduledModal,
	setSortBy,
	sortBy,
	totalProducts,
	viewMode
}) => {
	return (
<div>
						{/* ── Catalog Header ── */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
							<div className="flex flex-wrap justify-between items-start gap-4 mb-5">
								<div>
									<h2 className="text-2xl font-bold text-white mb-1">
										Product Catalog
									</h2>
									<p className="text-zinc-400 text-sm">
										Manage {products.length} products
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										onClick={() => setShowScheduledModal(true)}
										variant="secondary"
										className="border border-purple-500/30 hover:border-purple-500"
									>
										Manage Scheduled
									</Button>
									<Button
										onClick={() => setShowPrivateModal(true)}
										variant="secondary"
										className="border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-rose-300 flex items-center gap-2"
									>
										<FiLock /> Manage Products
									</Button>
									<Button
										onClick={() => setShowPinterestModal(true)}
										variant="secondary"
										className="border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 flex items-center gap-2"
									>
										<FaPinterest className="text-lg" /> Pinterest Export
									</Button>
									<Button
										onClick={() => setShowAffiliateModal(true)}
										variant="secondary"
										className="border border-purple-500/30 hover:border-purple-500 text-purple-400 hover:text-purple-300 flex items-center gap-2"
									>
										<FiLink /> Fetch Affiliates
									</Button>
									<Button
										onClick={openCreate}
										className="bg-purple-600 hover:bg-purple-700"
									>
										+ Add Product
									</Button>
								</div>
							</div>

							{/* ── Search Bar ── */}
							<div className="relative mb-4">
								<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search by title, anime, category, store…"
									className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
								/>
								{searchQuery && (
									<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
									</button>
								)}
							</div>

							{/* ── Filters Row ── */}
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
								<SearchableDropdown
									label="Sort By"
									value={sortBy}
									onChange={(v) => setSortBy(v)}
									options={[
										{ value: "-createdAt", label: "Newest First" },
										{ value: "createdAt", label: "Oldest First" },
										{ value: "-views", label: "Most Views" },
										{ value: "-clicks", label: "Most Card Clicks" },
										{ value: "-buyNowClicks", label: "Most Buy Now Clicks" },
										{ value: "price", label: "Price ↑" },
										{ value: "-price", label: "Price ↓" },
										{ value: "title", label: "Title A–Z" }
									]}
								/>

								<SearchableDropdown
									label="Category"
									value={filterCategory}
									onChange={(v) => {
										setFilterCategory(v);
										setFilterSubCategory("All"); // Reset subcategory when category changes
									}}
									options={finalCategoryOptions}
								/>

								{filterCategory !== "All" && (
									<SearchableDropdown
										label={<span className="text-purple-300">Sub Category</span>}
										value={filterSubCategory}
										onChange={(v) => setFilterSubCategory(v)}
										options={finalSubCategoryOptions}
									/>
								)}

								<SearchableDropdown
									label="Anime"
									value={filterAnime}
									onChange={(v) => setFilterAnime(v)}
									options={finalAnimeOptions}
								/>

								<SearchableDropdown
									label="Store"
									value={filterStore}
									onChange={(v) => setFilterStore(v)}
									options={finalStoreOptions}
								/>

								<SearchableDropdown
									label="Country"
									value={filterCountry}
									onChange={(v) => setFilterCountry(v)}
									options={finalCountryOptions}
								/>

								<SearchableDropdown
									label="Status"
									value={filterStatus}
									onChange={(v) => setFilterStatus(v)}
									options={[
										{ value: "All", label: "All Statuses" },
										{ value: "Active", label: "Active" },
										{ value: "Inactive", label: "Inactive (Private)" },
										{ value: "Scheduled", label: "Scheduled" }
									]}
								/>
							</div>

							{/* Active filter chips */}
							{(searchQuery || filterCategory !== "All" || filterSubCategory !== "All" || filterAnime !== "All" || filterStore !== "All" || filterCountry !== "All" || filterStatus !== "All") && (
								<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800">
									<span className="text-xs text-zinc-500">Active filters:</span>
									{searchQuery && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">Search: "{searchQuery}"</span>}
									{filterCategory !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterCategory}</span>}
									{filterSubCategory !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterSubCategory}</span>}
									{filterAnime !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterAnime}</span>}
									{filterStore !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterStore}</span>}
									{filterCountry !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterCountry}</span>}
									{filterStatus !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterStatus}</span>}
									<button onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterSubCategory("All"); setFilterAnime("All"); setFilterStore("All"); setFilterCountry("All"); setFilterStatus("All"); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors underline">Clear all</button>
								</div>
							)}
						</div>

						{loadingList && products.length === 0 ? (
						<div className="flex justify-center items-center py-12">
							<p className="text-zinc-400">
								Loading products...
							</p>
						</div>
					) : (() => {
						if (products.length === 0 && !loadingList && (searchQuery !== "" || filterCategory !== "All" || filterSubCategory !== "All" || filterAnime !== "All" || filterStore !== "All" || filterCountry !== "All" || filterStatus !== "All")) return (
							<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
								<BoxIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
								<p className="text-zinc-400 mb-4">Try adjusting your search or filters.</p>
								<button onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterSubCategory("All"); setFilterAnime("All"); setFilterStore("All"); setFilterCountry("All"); setFilterStatus("All"); }} className="text-purple-400 hover:underline text-sm">Clear filters</button>
							</div>
						);

						if (products.length === 0 && !loadingList) return (
							<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
								<BoxIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold text-white mb-2">No Products Yet</h3>
								<p className="text-zinc-400 mb-6">Start by adding your first product to the catalog</p>
								<Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">Create First Product</Button>
							</div>
						);

						return (
						<>
						<p className="text-zinc-500 text-xs mb-3">Showing {products.length} of {totalProducts} products</p>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{products.map((p) => (
									<div
										key={p._id}
										className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500 transition-colors group"
									>
										{/* Product Image */}
										<div className="relative overflow-hidden bg-zinc-800 aspect-square">
											<img
												src={
													p.images?.[0]?.url ||
													"placeholder.jpg"
												}
												alt={p.title}
												className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
											/>
											<div className="absolute top-3 left-3">
												<span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
													{p.animeTag}
												</span>
											</div>
											<div className="absolute top-3 right-3">
												<span className="bg-zinc-900 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
													{p.store}
												</span>
											</div>
										</div>

										{/* Product Info */}
										<div className="p-4 space-y-3">
											<div>
												<h3 className="font-bold text-white line-clamp-2 text-sm">
													{p.title}
												</h3>
												<p className="text-zinc-500 text-xs mt-1">
													{p.category}{p.subCategory ? ` \u00b7 ${p.subCategory}` : ""}
												</p>
											</div>

											{/* Stats */}
											<div className="grid grid-cols-3 gap-2 text-xs">
												<div className="bg-zinc-800/50 rounded p-2 text-center">
													<p className="text-zinc-500">
														Views
													</p>
													<p className="text-purple-400 font-bold">
														{p.views || 0}
													</p>
												</div>
												<div className="bg-zinc-800/50 rounded p-2 text-center">
													<p className="text-zinc-500">
														Card Clicks
													</p>
													<p className="text-purple-400 font-bold">
														{p.clicks || 0}
													</p>
												</div>
												<div className="bg-zinc-800/50 rounded p-2 text-center">
													<p className="text-zinc-500">
														Buy Now Clicks
													</p>
													<p className="text-purple-400 font-bold">
														{p.buyNowClicks || 0}
													</p>
												</div>
											</div>

											{/* Price */}
											<div className="flex items-center justify-between pt-2 border-t border-zinc-800">
												<span className="text-purple-400 font-bold">
													{p.currency} {p.price.toLocaleString(p.currency === 'INR' ? 'en-IN' : 'en-US')}
												</span>
												<div className="flex gap-2 items-center">
													{(!p.isActive) && (
														<span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700" title="Private Mode">
															Private
														</span>
													)}
													{(p.isActive && p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date()) && (
														<span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-800/50" title={`Scheduled for ${new Date(p.scheduledUploadTime).toLocaleString()}`}>
															Scheduled
														</span>
													)}
													{p.pinterestExported && (
														<span className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-800/50" title="Exported to Pinterest">
														<span className="flex items-center gap-1"><FaPinterest /> Exported</span>
														</span>
													)}
													<span
														className={`text-xs px-2 py-1 rounded ${p.inStock ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
													>
														{p.inStock
															? "In Stock"
															: "Out of Stock"}
													</span>
												</div>
											</div>

											{/* Actions */}
											<div className="flex gap-2 pt-3 border-t border-zinc-800">
												<button
													onClick={() => openEdit(p)}
													className="flex-1 px-3 py-2 rounded bg-zinc-800 hover:bg-purple-600/30 text-purple-400 text-sm font-medium transition-colors border border-zinc-700 hover:border-purple-500"
												>
													Edit
												</button>
												<button
													onClick={() =>
														handleDelete(p._id)
													}
													className="flex-1 px-3 py-2 rounded bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm font-medium transition-colors border border-red-900/30"
												>
													Delete
												</button>
											</div>
										</div>
									</div>
									))}
								</div>

								{/* Infinite Scroll Sentinel */}
								{hasMore && (
									<div ref={sentinelRef} className="h-24 flex items-center justify-center mt-6">
										{loadingList ? (
											<span className="text-sm font-medium text-zinc-400 flex items-center gap-3 bg-zinc-900/80 px-5 py-2.5 rounded-full border border-zinc-800 shadow-sm">
												<svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading more...
											</span>
										) : null}
									</div>
								)}

								{!hasMore && products.length > 0 && (
									<p className="text-center text-zinc-600 text-sm mt-12 mb-4 font-semibold">
										All {totalProducts} products loaded ✓
									</p>
								)}
							</>
							);
						})()
						}
					</div>
	);
};

export default ProductList;