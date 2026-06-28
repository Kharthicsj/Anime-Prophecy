import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useSmartImageDrop from "../../hooks/useSmartImageDrop";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import SearchableSelect from "../../components/ui/SearchableSelect";
import apiClient from "../../services/apiClient";
import { BoxIcon, UploadIcon } from "../../components/common/Icons";
import { countries } from "../../utils/countries";
import LoadingAnimation from "../../components/common/LoadingAnimation";
import { SearchableDropdown } from "../../components/common/FilterPanel";
import FilterBar from "../../components/common/FilterBar";
import { FiCopy, FiX, FiRefreshCw, FiSearch, FiArrowDown } from "react-icons/fi";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ThemeController from "./ThemeController";

// ─── Utility to convert to Camel Case (Title Case for UI) ───────────
const toTitleCase = (str) => {
	return str.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

const SortableImageItem = ({ id, img, index, removeImage, setMain }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : 1,
	};
	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`relative group aspect-square rounded-xl overflow-hidden bg-zinc-800 border-2 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-75 ring-2 ring-purple-500 shadow-xl scale-105" : "opacity-100"} ${img.isMain ? "border-purple-500" : "border-transparent hover:border-zinc-600"}`}>
			<img src={img.previewUrl || img.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 pointer-events-none" />
			<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
				<div className="flex justify-end">
					<button type="button" onPointerDown={(e) => { e.stopPropagation(); removeImage(index); }} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer relative z-10">×</button>
				</div>
				<button type="button" onPointerDown={(e) => { e.stopPropagation(); setMain(index); }} className={`py-1.5 text-xs font-semibold rounded-lg w-full cursor-pointer relative z-10 ${img.isMain ? "bg-purple-600 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}>{img.isMain ? "Main Image" : "Set as Main"}</button>
			</div>
		</div>
	);
};

const SortableVideoItem = ({ id, vid, index, removeVideo, setPrimaryVideo }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : 1,
	};
	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-75 ring-2 ring-blue-500 shadow-xl scale-[1.02]" : "opacity-100"} ${vid.isPrimary ? "border-blue-500" : "border-zinc-700"}`}>
			<video src={vid.previewUrl || vid.url} controls preload="metadata" className="w-full max-h-48 object-contain bg-black" onPointerDown={(e) => e.stopPropagation()} />
			<div className="flex items-center justify-between px-3 py-2 bg-zinc-900 pointer-events-auto relative z-10">
				<div className="flex items-center gap-2">
					{vid.isPrimary ? (
						<span className="text-xs text-blue-400 font-semibold">&#9679; Primary Video</span>
					) : (
						<button type="button" onPointerDown={(e) => { e.stopPropagation(); setPrimaryVideo(index); }} className="text-xs text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer relative z-10">Set as Primary</button>
					)}
					{!vid.url && <span className="text-xs text-yellow-500">⏳ Pending</span>}
					{vid.url && <span className="text-xs text-green-500">✓ Saved</span>}
				</div>
				<button type="button" onPointerDown={(e) => { e.stopPropagation(); removeVideo(index); }} className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors cursor-pointer relative z-10">&times;</button>
			</div>
		</div>
	);
};

// ─── Pure helper (module-level, no React deps) ───────────────────────────────
const mergeUnique = (staticArr, dynamicArr) => {
	const set = new Set([...staticArr, ...dynamicArr]);
	return [...set];
};

// ─── Static option lists (module-level so useMemo deps are stable) ───────────
const ANIME_OPTIONS = [
	"Naruto", "Bleach", "One Piece", "Dragon Ball Z", "Fairy Tail",
	"Fullmetal Alchemist: Brotherhood", "Death Note", "Neon Genesis Evangelion",
	"Cowboy Bebop", "Steins;Gate", "Code Geass", "JoJo's Bizarre Adventure",
	"Hunter x Hunter", "AOT", "JJK", "Demon Slayer", "MHA", "Haikyuu",
	"Tokyo Revengers", "Chainsaw Man", "Vinland Saga", "Spy x Family",
	"Blue Lock", "Mob Psycho 100", "One Punch Man", "Black Clover",
	"Dr. Stone", "Sword Art Online", "Re:Zero", "Overlord", "Shield Hero",
	"That Time I Got Reincarnated as a Slime", "Bocchi the Rock", "Oshi no Ko",
	"Frieren: Beyond Journey's End", "Dungeon Meshi", "Solo Leveling",
	"Kaiju No. 8", "Violet Evergarden", "Your Lie in April", "Other",
];
const STORE_OPTIONS = ["Amazon", "Flipkart", "Etsy", "eBay", "AliExpress", "Other"];
const CATEGORY_OPTIONS = [
	"Clothing", "Electronics", "Posters", "Gadgets", "Figures", "Accessories", "Cosplay", "Other"
];

// ─── Currency Searchable Select ───────────────────────────────────────────────
const CurrencySearchableSelect = ({ currencies, value, onChange, name }) => {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);
	const searchRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				setOpen(false);
				setSearch("");
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (open && searchRef.current) searchRef.current.focus();
	}, [open]);

	const filtered = currencies.filter(c =>
		c.code.toLowerCase().includes(search.toLowerCase()) ||
		c.name.toLowerCase().includes(search.toLowerCase()) ||
		c.symbol.toLowerCase().includes(search.toLowerCase())
	);

	const selected = currencies.find(c => c.code === value);

	const handleSelect = (code) => {
		onChange({ target: { name, value: code } });
		setOpen(false);
		setSearch("");
	};

	return (
		<div ref={wrapperRef} className="relative">
			{/* Trigger */}
			<div
				className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white cursor-pointer flex justify-between items-center hover:border-zinc-500 focus-within:ring-2 focus-within:ring-purple-500 transition-colors"
				onClick={() => setOpen(o => !o)}
				tabIndex={0}
				onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
			>
				{selected ? (
					<span className="flex items-center gap-2">
						<span className="text-purple-300 font-bold text-base w-6 text-center">{selected.symbol}</span>
						<span className="font-semibold">{selected.code}</span>
						<span className="text-zinc-400 text-xs truncate hidden sm:inline">— {selected.name}</span>
					</span>
				) : (
					<span className="text-zinc-400">Select Currency</span>
				)}
				<span className={`text-zinc-400 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
			</div>

			{/* Dropdown */}
			{open && (
				<div className="absolute z-[200] w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
					{/* Search */}
					<div className="p-2 border-b border-zinc-800 bg-zinc-900 sticky top-0">
						<div className="relative">
							<svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								ref={searchRef}
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg border border-zinc-700 focus:outline-none focus:border-purple-500 placeholder-zinc-500"
								placeholder="Search by code, name or symbol…"
							/>
						</div>
					</div>
					{/* Options list */}
					<div className="max-h-56 overflow-y-auto">
						{filtered.length > 0 ? filtered.map(c => (
							<div
								key={c.code}
								className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-sm ${value === c.code ? "bg-purple-600/20 text-purple-300" : "hover:bg-zinc-800 text-zinc-200"}`}
								onClick={() => handleSelect(c.code)}
							>
								<span className="text-base w-6 text-center font-bold text-purple-400 flex-shrink-0">{c.symbol}</span>
								<span className="font-semibold w-12 flex-shrink-0">{c.code}</span>
								<span className="text-zinc-400 text-xs truncate">{c.name}</span>
								{value === c.code && <span className="ml-auto text-purple-400 text-xs">✓</span>}
							</div>
						)) : (
							<div className="px-4 py-4 text-sm text-zinc-500 text-center">No currencies found</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

// ─── Copy Product Modal ───────────────────────────────────────────────────────
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

const ProductManagement = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const fileInputRef = useRef(null);
	const videoFileInputRef = useRef(null);

	const [viewMode, setViewMode] = useState("list"); // 'list' or 'form'
	const [products, setProducts] = useState([]);
	const [loadingList, setLoadingList] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// ─── Copy-from-product feature ───────────────────────────────────────────────
	const [showCopyModal, setShowCopyModal] = useState(false);
	const [copiedFromProduct, setCopiedFromProduct] = useState(""); // name of product metadata was copied from
	const [isCopying, setIsCopying] = useState(false);
	const [urlToFetch, setUrlToFetch] = useState("");
	const [isFetchingUrl, setIsFetchingUrl] = useState(false);

	// Search / Sort / Filter state for list view
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("-createdAt");
	const [filterCategory, setFilterCategory] = useState("All");
	const [filterAnime, setFilterAnime] = useState("All");
	const [filterStore, setFilterStore] = useState("All");
	const [filterCountry, setFilterCountry] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	const [showScheduledModal, setShowScheduledModal] = useState(false);

	// Pagination & Infinite Scroll states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalProducts, setTotalProducts] = useState(0);
	const sentinelRef = useRef(null);
	const isFetchingRef = useRef(false);
	const PAGE_SIZE = 30;

	const initialForm = {
		title: "",
		description: "",
		animeTag: "AOT",
		store: "Amazon",
		affiliateLink: "",
		price: "",
		currency: "USD",
		category: "Clothing",
		subCategory: "",
		countries: ["US"],
		colors: [],
		sizes: [],
		isActive: true,
		scheduledUploadTime: "",
	};
	const [formData, setFormData] = useState(initialForm);
	const [imageItems, setImageItems] = useState([]);
	const [videoItems, setVideoItems] = useState([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isVideoDragOver, setIsVideoDragOver] = useState(false);
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [uploadingCount, setUploadingCount] = useState(0);
	const [uploadingVideoCount, setUploadingVideoCount] = useState(0);
	const [customAnimeTag, setCustomAnimeTag] = useState("");
	const [customCategory, setCustomCategory] = useState("");
	const [customSubCategory, setCustomSubCategory] = useState("");
	const [customStore, setCustomStore] = useState("");
	const [customCountryInput, setCustomCountryInput] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	const [dynamicOptions, setDynamicOptions] = useState({
		animeTags: [],
		categories: [],
		stores: [],
		countries: [],
	});

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
				// silently fallback
			}
		};
		fetchMeta();
	}, []);

	// Subcategory map: which categories have subcategories and what they are
	const subCategoryMap = {
		"Clothing": ["T-Shirts", "Hoodies", "Pants", "Jackets"],
		"Electronics": ["Mouse Pads", "Phone Cases", "Keyboards", "Headphones"],
		"Posters": ["Canvas Print", "Paper Poster", "Metal Print", "Framed Poster"],
		"Gadgets": ["Keychains", "Mugs", "Lamps"],
		"Figures": ["Action Figure", "Statue", "Funko Pop", "Nendoroid"],
		"Accessories": ["Necklace", "Bracelet", "Ring", "Earrings", "Bag"],
		"Cosplay": ["Costume", "Props", "Wigs"],
	};

	// Use module-level constants (stable references)
	const animeOptions = ANIME_OPTIONS;
	const storeOptions = STORE_OPTIONS;
	const categoryOptions = CATEGORY_OPTIONS;
	const countryOptions = countries.map((c) => c.value);

	// ─── Form dropdown options (static + dynamic, "Other" always last) ──────────
	const formAnimeOptions = useMemo(() => [
		...mergeUnique(animeOptions, dynamicOptions.animeTags).filter(v => v !== "Other"),
		"Other",
	], [dynamicOptions.animeTags]);

	const formStoreOptions = useMemo(() => [
		...mergeUnique(storeOptions, dynamicOptions.stores).filter(v => v !== "Other"),
		"Other",
	], [dynamicOptions.stores]);

	const formCategoryOptions = useMemo(() => [
		...mergeUnique(categoryOptions, dynamicOptions.categories).filter(v => v !== "Other"),
		"Other",
	], [dynamicOptions.categories]);
	// Comprehensive world currency list: { code, symbol, name }
	const CURRENCY_LIST = [
		{ code: "USD", symbol: "$",   name: "US Dollar" },
		{ code: "EUR", symbol: "€",   name: "Euro" },
		{ code: "GBP", symbol: "£",   name: "British Pound" },
		{ code: "JPY", symbol: "¥",   name: "Japanese Yen" },
		{ code: "INR", symbol: "₹",   name: "Indian Rupee" },
		{ code: "KRW", symbol: "₩",   name: "South Korean Won" },
		{ code: "CNY", symbol: "¥",   name: "Chinese Yuan" },
		{ code: "AUD", symbol: "A$",  name: "Australian Dollar" },
		{ code: "CAD", symbol: "C$",  name: "Canadian Dollar" },
		{ code: "CHF", symbol: "Fr",  name: "Swiss Franc" },
		{ code: "SEK", symbol: "kr",  name: "Swedish Krona" },
		{ code: "NOK", symbol: "kr",  name: "Norwegian Krone" },
		{ code: "DKK", symbol: "kr",  name: "Danish Krone" },
		{ code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
		{ code: "SGD", symbol: "S$",  name: "Singapore Dollar" },
		{ code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
		{ code: "MXN", symbol: "$",   name: "Mexican Peso" },
		{ code: "BRL", symbol: "R$",  name: "Brazilian Real" },
		{ code: "RUB", symbol: "₽",   name: "Russian Ruble" },
		{ code: "ZAR", symbol: "R",   name: "South African Rand" },
		{ code: "TRY", symbol: "₺",   name: "Turkish Lira" },
		{ code: "AED", symbol: "د.إ", name: "UAE Dirham" },
		{ code: "SAR", symbol: "﷼",   name: "Saudi Riyal" },
		{ code: "QAR", symbol: "﷼",   name: "Qatari Riyal" },
		{ code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
		{ code: "BHD", symbol: ".د.ب",name: "Bahraini Dinar" },
		{ code: "OMR", symbol: "﷼",   name: "Omani Rial" },
		{ code: "JOD", symbol: "JD",  name: "Jordanian Dinar" },
		{ code: "EGP", symbol: "£",   name: "Egyptian Pound" },
		{ code: "PKR", symbol: "₨",   name: "Pakistani Rupee" },
		{ code: "BDT", symbol: "৳",   name: "Bangladeshi Taka" },
		{ code: "LKR", symbol: "₨",   name: "Sri Lankan Rupee" },
		{ code: "NPR", symbol: "₨",   name: "Nepalese Rupee" },
		{ code: "MMK", symbol: "K",   name: "Myanmar Kyat" },
		{ code: "THB", symbol: "฿",   name: "Thai Baht" },
		{ code: "VND", symbol: "₫",   name: "Vietnamese Dong" },
		{ code: "IDR", symbol: "Rp",  name: "Indonesian Rupiah" },
		{ code: "MYR", symbol: "RM",  name: "Malaysian Ringgit" },
		{ code: "PHP", symbol: "₱",   name: "Philippine Peso" },
		{ code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
		{ code: "HUF", symbol: "Ft",  name: "Hungarian Forint" },
		{ code: "PLN", symbol: "zł",  name: "Polish Zloty" },
		{ code: "CZK", symbol: "Kč",  name: "Czech Koruna" },
		{ code: "RON", symbol: "lei", name: "Romanian Leu" },
		{ code: "BGN", symbol: "лв",  name: "Bulgarian Lev" },
		{ code: "HRK", symbol: "kn",  name: "Croatian Kuna" },
		{ code: "ISK", symbol: "kr",  name: "Icelandic Króna" },
		{ code: "UAH", symbol: "₴",   name: "Ukrainian Hryvnia" },
		{ code: "ILS", symbol: "₪",   name: "Israeli Shekel" },
		{ code: "NGN", symbol: "₦",   name: "Nigerian Naira" },
		{ code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
		{ code: "GHS", symbol: "₵",   name: "Ghanaian Cedi" },
		{ code: "ETB", symbol: "Br",  name: "Ethiopian Birr" },
		{ code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
		{ code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
		{ code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
		{ code: "TND", symbol: "DT",  name: "Tunisian Dinar" },
		{ code: "DZD", symbol: "دج",  name: "Algerian Dinar" },
		{ code: "LYD", symbol: "LD",  name: "Libyan Dinar" },
		{ code: "XOF", symbol: "CFA", name: "West African CFA Franc" },
		{ code: "XAF", symbol: "CFA", name: "Central African CFA Franc" },
		{ code: "MZN", symbol: "MT",  name: "Mozambican Metical" },
		{ code: "ZMW", symbol: "ZK",  name: "Zambian Kwacha" },
		{ code: "BWP", symbol: "P",   name: "Botswana Pula" },
		{ code: "MUR", symbol: "₨",   name: "Mauritian Rupee" },
		{ code: "SCR", symbol: "₨",   name: "Seychellois Rupee" },
		{ code: "IQD", symbol: "ع.د", name: "Iraqi Dinar" },
		{ code: "IRR", symbol: "﷼",   name: "Iranian Rial" },
		{ code: "LBP", symbol: "£",   name: "Lebanese Pound" },
		{ code: "SYP", symbol: "£",   name: "Syrian Pound" },
		{ code: "YER", symbol: "﷼",   name: "Yemeni Rial" },
		{ code: "AFN", symbol: "؋",   name: "Afghan Afghani" },
		{ code: "UZS", symbol: "лв",  name: "Uzbekistani Som" },
		{ code: "KZT", symbol: "₸",   name: "Kazakhstani Tenge" },
		{ code: "AZN", symbol: "₼",   name: "Azerbaijani Manat" },
		{ code: "GEL", symbol: "₾",   name: "Georgian Lari" },
		{ code: "AMD", symbol: "֏",   name: "Armenian Dram" },
		{ code: "TJS", symbol: "SM",  name: "Tajikistani Somoni" },
		{ code: "KGS", symbol: "лв",  name: "Kyrgystani Som" },
		{ code: "TMT", symbol: "T",   name: "Turkmenistani Manat" },
		{ code: "MNT", symbol: "₮",   name: "Mongolian Tögrög" },
		{ code: "KHR", symbol: "៛",   name: "Cambodian Riel" },
		{ code: "LAK", symbol: "₭",   name: "Laotian Kip" },
		{ code: "BND", symbol: "$",   name: "Brunei Dollar" },
		{ code: "MOP", symbol: "P",   name: "Macanese Pataca" },
		{ code: "MVR", symbol: "Rf",  name: "Maldivian Rufiyaa" },
		{ code: "BTN", symbol: "Nu",  name: "Bhutanese Ngultrum" },
		{ code: "PGK", symbol: "K",   name: "Papua New Guinean Kina" },
		{ code: "FJD", symbol: "FJ$", name: "Fijian Dollar" },
		{ code: "SBD", symbol: "SI$", name: "Solomon Islands Dollar" },
		{ code: "VUV", symbol: "VT",  name: "Vanuatu Vatu" },
		{ code: "WST", symbol: "WS$", name: "Samoan Tālā" },
		{ code: "TOP", symbol: "T$",  name: "Tongan Paʻanga" },
		{ code: "PEN", symbol: "S/.", name: "Peruvian Sol" },
		{ code: "COP", symbol: "$",   name: "Colombian Peso" },
		{ code: "ARS", symbol: "$",   name: "Argentine Peso" },
		{ code: "CLP", symbol: "$",   name: "Chilean Peso" },
		{ code: "UYU", symbol: "$U",  name: "Uruguayan Peso" },
		{ code: "PYG", symbol: "Gs",  name: "Paraguayan Guaraní" },
		{ code: "BOB", symbol: "Bs.", name: "Bolivian Boliviano" },
		{ code: "VES", symbol: "Bs.S",name: "Venezuelan Bolívar" },
		{ code: "GYD", symbol: "$",   name: "Guyanese Dollar" },
		{ code: "SRD", symbol: "$",   name: "Surinamese Dollar" },
		{ code: "TTD", symbol: "TT$", name: "Trinidad Dollar" },
		{ code: "JMD", symbol: "J$",  name: "Jamaican Dollar" },
		{ code: "BBD", symbol: "Bds$",name: "Barbadian Dollar" },
		{ code: "HTG", symbol: "G",   name: "Haitian Gourde" },
		{ code: "CUP", symbol: "₱",   name: "Cuban Peso" },
		{ code: "DOP", symbol: "RD$", name: "Dominican Peso" },
		{ code: "GTQ", symbol: "Q",   name: "Guatemalan Quetzal" },
		{ code: "HNL", symbol: "L",   name: "Honduran Lempira" },
		{ code: "NIO", symbol: "C$",  name: "Nicaraguan Córdoba" },
		{ code: "CRC", symbol: "₡",   name: "Costa Rican Colón" },
		{ code: "PAB", symbol: "B/.", name: "Panamanian Balboa" },
		{ code: "ALL", symbol: "L",   name: "Albanian Lek" },
		{ code: "MKD", symbol: "ден", name: "Macedonian Denar" },
		{ code: "BAM", symbol: "KM",  name: "Bosnia-Herzegovina Mark" },
		{ code: "RSD", symbol: "din", name: "Serbian Dinar" },
		{ code: "MDL", symbol: "L",   name: "Moldovan Leu" },
		{ code: "BYN", symbol: "Br",  name: "Belarusian Ruble" },
		{ code: "LTL", symbol: "Lt",  name: "Lithuanian Litas" },
		{ code: "LVL", symbol: "Ls",  name: "Latvian Lats" },
		{ code: "EEK", symbol: "kr",  name: "Estonian Kroon" },
	];
	// Build a lookup map: code → symbol
	const CURRENCY_SYMBOL_MAP = CURRENCY_LIST.reduce((acc, c) => { acc[c.code] = c.symbol; return acc; }, {});
	const currencyOptions = CURRENCY_LIST.map(c => c.code);


	const fetchProducts = useCallback(async (page = 1, reset = false) => {
		if (isFetchingRef.current) return;
		isFetchingRef.current = true;
		if (reset) setLoadingList(true);
		
		try {
			const params = new URLSearchParams({
				page,
				limit: PAGE_SIZE,
				sort: sortBy || "-createdAt",
				...(searchQuery && { search: searchQuery }),
				...(filterAnime !== "All" && { animeTag: filterAnime }),
				...(filterCategory !== "All" && { category: filterCategory }),
				...(filterStore !== "All" && { store: filterStore }),
				...(filterCountry !== "All" && { country: filterCountry }),
				...(filterStatus !== "All" && { status: filterStatus === "Inactive (Private)" ? "inactive" : filterStatus.toLowerCase() }),
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
			console.error(err);
		} finally {
			if (reset) setLoadingList(false);
			isFetchingRef.current = false;
		}
	}, [searchQuery, sortBy, filterCategory, filterAnime, filterStore, filterCountry, filterStatus]);

	// mergeUnique is defined at module level

	const finalAnimeOptions = [
		{ value: "All", label: "All Anime" },
		...mergeUnique(animeOptions, dynamicOptions.animeTags).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	const finalCategoryOptions = [
		{ value: "All", label: "All Categories" },
		...mergeUnique(categoryOptions, dynamicOptions.categories).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	const finalStoreOptions = [
		{ value: "All", label: "All Stores" },
		...mergeUnique(storeOptions, dynamicOptions.stores).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	const finalCountryOptions = [
		{ value: "All", label: "All Countries" },
		...mergeUnique(countryOptions, dynamicOptions.countries).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	useEffect(() => {
		if (user && viewMode === "list") {
			setProducts([]);
			setCurrentPage(1);
			setHasMore(true);
			fetchProducts(1, true);
		}
	}, [user, viewMode, fetchProducts]);

	// Intersection Observer for list view
	useEffect(() => {
		if (viewMode !== "list") return;
		const el = sentinelRef.current;
		if (!el) return;

		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !loadingList && !isFetchingRef.current) {
				fetchProducts(currentPage + 1, false);
			}
		}, { rootMargin: '100px' });

		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, loadingList, currentPage, fetchProducts, viewMode]);

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this product?"))
			return;
		setIsDeleting(true);
		try {
			await apiClient.delete(`/products/${id}`);
			setProducts([]);
			setCurrentPage(1);
			setHasMore(true);
			fetchProducts(1, true);
		} catch (err) {
			alert("Failed to delete");
		} finally {
			setIsDeleting(false);
		}
	};

	const openEdit = (prod) => {
		setEditingId(prod._id);
		setFormData({
			title: prod.title || "",
			description: prod.description || "",
			animeTag: prod.animeTag || "AOT",
			store: prod.store || "Amazon",
			affiliateLink: prod.affiliateLink || "",
			price: prod.price || "",
			currency: prod.currency || "USD",
			category: prod.category || "T-Shirts",
			subCategory: prod.subCategory || "",
			countries: prod.countries || [],
			colors: prod.colors || [],
			sizes: prod.sizes || [],
			isActive: prod.isActive !== undefined ? prod.isActive : true,
			scheduledUploadTime: prod.scheduledUploadTime ? new Date(prod.scheduledUploadTime).toISOString().slice(0, 16) : "",
		});
		// Use merged (static + dynamic) lists so DB-stored custom values are recognised
		const allAnime = mergeUnique(animeOptions, dynamicOptions.animeTags);
		const allCategories = mergeUnique(categoryOptions, dynamicOptions.categories);
		const allStores = mergeUnique(storeOptions, dynamicOptions.stores);

		if (!allAnime.includes(prod.animeTag)) {
			setFormData((p) => ({ ...p, animeTag: "Other" }));
			setCustomAnimeTag(prod.animeTag || "");
		} else {
			setCustomAnimeTag("");
		}
		if (!allCategories.includes(prod.category)) {
			setFormData((p) => ({ ...p, category: "Other" }));
			setCustomCategory(prod.category || "");
		} else {
			setCustomCategory("");
		}
		if (prod.subCategory && subCategoryMap[prod.category] && !subCategoryMap[prod.category].includes(prod.subCategory)) {
			setFormData((p) => ({ ...p, subCategory: "Other" }));
			setCustomSubCategory(prod.subCategory || "");
		} else {
			setCustomSubCategory("");
		}
		if (!allStores.includes(prod.store)) {
			setFormData((p) => ({ ...p, store: "Other" }));
			setCustomStore(prod.store || "");
		} else {
			setCustomStore("");
		}
		setImageItems(
			prod.images
				? prod.images.map((img) => ({
						id: img.publicId || `img-${Math.random().toString(36).substr(2, 9)}`,
						file: null,
						previewUrl: null,
						url: img.url,
						publicId: img.publicId,
						isMain: img.isMain,
					}))
				: [],
		);
		setVideoItems(
			prod.videos
				? prod.videos.map((vid) => ({
						id: vid.publicId || `vid-${Math.random().toString(36).substr(2, 9)}`,
						file: null,
						previewUrl: null,
						url: vid.url,
						publicId: vid.publicId,
						isPrimary: vid.isPrimary,
					}))
				: [],
		);
		setViewMode("form");
	};

	const openCreate = () => {
		setEditingId(null);
		setFormData(initialForm);
		setCustomAnimeTag("");
		setCustomCategory("");
		setCustomSubCategory("");
		setCustomStore("");
		setCustomCountryInput("");
		setImageItems([]);
		setVideoItems([]);
		setCopiedFromProduct("");
		// Ensure product list is available for the copy-modal even if admin never visited list view
		if (products.length === 0) fetchProducts();
		setViewMode("form");
	};

	const urlToFile = async (url, filename) => {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error("Network response was not ok");
			const blob = await res.blob();
			return new File([blob], filename, { type: blob.type });
		} catch (err) {
			console.error("Failed to fetch media:", err);
			return null;
		}
	};

	// ─── Apply metadata template from an existing product ────────────────────────
	const applyProductTemplate = async (sourceProduct) => {
		const allAnime = mergeUnique(animeOptions, dynamicOptions.animeTags);
		const allCategories = mergeUnique(categoryOptions, dynamicOptions.categories);
		const allStores = mergeUnique(storeOptions, dynamicOptions.stores);

		setFormData(prev => ({
			...prev,
			title: sourceProduct.title || "",
			description: sourceProduct.description || "",
			animeTag: sourceProduct.animeTag || "AOT",
			store: sourceProduct.store || "Amazon",
			affiliateLink: sourceProduct.affiliateLink || "", // ALL data included
			price: sourceProduct.price || "",
			currency: sourceProduct.currency || "USD",
			category: sourceProduct.category || "Clothing",
			subCategory: sourceProduct.subCategory || "",
			countries: sourceProduct.countries || ["US"],
			colors: sourceProduct.colors || [],
			sizes: sourceProduct.sizes || [],
			isActive: sourceProduct.isActive !== undefined ? sourceProduct.isActive : true,
			scheduledUploadTime: sourceProduct.scheduledUploadTime ? new Date(sourceProduct.scheduledUploadTime).toISOString().slice(0, 16) : "",
		}));

		// Handle custom anime
		if (!allAnime.includes(sourceProduct.animeTag)) {
			setFormData(p => ({ ...p, animeTag: "Other" }));
			setCustomAnimeTag(sourceProduct.animeTag || "");
		} else { setCustomAnimeTag(""); }

		// Handle custom category
		if (!allCategories.includes(sourceProduct.category)) {
			setFormData(p => ({ ...p, category: "Other" }));
			setCustomCategory(sourceProduct.category || "");
		} else { setCustomCategory(""); }

		// Handle custom subcategory
		if (sourceProduct.subCategory && subCategoryMap[sourceProduct.category] && !subCategoryMap[sourceProduct.category].includes(sourceProduct.subCategory)) {
			setFormData(p => ({ ...p, subCategory: "Other" }));
			setCustomSubCategory(sourceProduct.subCategory || "");
		} else { setCustomSubCategory(""); }

		// Handle custom store
		if (!allStores.includes(sourceProduct.store)) {
			setFormData(p => ({ ...p, store: "Other" }));
			setCustomStore(sourceProduct.store || "");
		} else { setCustomStore(""); }

		setErrors({});
		setSubmitError("");
		setCopiedFromProduct(sourceProduct.title || "selected product");
		setShowCopyModal(false);

		setIsCopying(true);
		try {
			// Fetch and set images as new files so they can be re-uploaded
			const newImageItems = [];
			if (sourceProduct.images && sourceProduct.images.length > 0) {
				for (let i = 0; i < sourceProduct.images.length; i++) {
					const img = sourceProduct.images[i];
					const file = await urlToFile(img.url, `copied_image_${i}.jpg`);
					if (file) {
						newImageItems.push({
							id: `img-${Math.random().toString(36).substr(2, 9)}`,
							file: file,
							previewUrl: URL.createObjectURL(file),
							url: null, // force re-upload
							publicId: null,
							isMain: img.isMain
						});
					}
				}
			}
			setImageItems(newImageItems);

			const newVideoItems = [];
			if (sourceProduct.videos && sourceProduct.videos.length > 0) {
				for (let i = 0; i < sourceProduct.videos.length; i++) {
					const vid = sourceProduct.videos[i];
					const file = await urlToFile(vid.url, `copied_video_${i}.mp4`);
					if (file) {
						newVideoItems.push({
							id: `vid-${Math.random().toString(36).substr(2, 9)}`,
							file: file,
							previewUrl: URL.createObjectURL(file),
							url: null, // force re-upload
							publicId: null,
							isPrimary: vid.isPrimary
						});
					}
				}
			}
			setVideoItems(newVideoItems);
		} finally {
			setIsCopying(false);
		}
	};

	const fetchFromUrl = async () => {
		if (!urlToFetch) {
			alert("Please enter a URL to fetch.");
			return;
		}
		setIsFetchingUrl(true);
		try {
			const res = await apiClient.post("/scraper/fetch-product", { url: urlToFetch });
			if (res.data.success && res.data.data) {
				const { title, description, price, imageUrl } = res.data.data;
				setFormData(prev => ({
					...prev,
					title: title || prev.title,
					description: description || prev.description,
					price: price || prev.price,
					affiliateLink: urlToFetch, // auto-fill affiliate link
				}));

				if (imageUrl) {
					// We can fetch the image as a file and add it
					const file = await urlToFile(imageUrl, `fetched_image.jpg`);
					if (file) {
						setImageItems(prev => {
							const newImage = {
								id: `img-${Math.random().toString(36).substr(2, 9)}`,
								file: file,
								previewUrl: URL.createObjectURL(file),
								url: null,
								publicId: null,
								isMain: prev.length === 0
							};
							return [...prev, newImage];
						});
					}
				}
				setUrlToFetch("");
			}
		} catch (error) {
			console.error(error);
			alert(error.response?.data?.message || "Failed to fetch product data from URL.");
		} finally {
			setIsFetchingUrl(false);
		}
	};

	const addImageFile = useCallback((file) => {
		if (!file || !file.type.startsWith("image/")) {
			setErrors((p) => ({ ...p, images: "Please provide an image file." }));
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setErrors((p) => ({ ...p, images: "File size must be under 10 MB." }));
			return;
		}
		setErrors((p) => ({ ...p, images: "" }));
		const previewUrl = URL.createObjectURL(file);
		setImageItems((prev) => {
			const isFirst = prev.length === 0;
			return [...prev, { id: `img-${Math.random().toString(36).substr(2, 9)}`, file, previewUrl, url: null, publicId: null, isMain: isFirst }];
		});
	}, []);

	const addVideoFile = useCallback((file) => {
		if (!file || !file.type.startsWith("video/")) {
			setErrors((p) => ({ ...p, videos: "Please provide a video file." }));
			return;
		}
		if (file.size > 200 * 1024 * 1024) {
			setErrors((p) => ({ ...p, videos: "Video must be under 200 MB." }));
			return;
		}
		if (videoItems.length >= 3) {
			setErrors((p) => ({ ...p, videos: "Max 3 videos allowed." }));
			return;
		}
		setErrors((p) => ({ ...p, videos: "" }));
		const previewUrl = URL.createObjectURL(file);
		setVideoItems((prev) => {
			const isFirst = prev.length === 0;
			return [...prev, { id: `vid-${Math.random().toString(36).substr(2, 9)}`, file, previewUrl, url: null, publicId: null, isPrimary: isFirst }];
		});
	}, [videoItems.length]);

	useSmartImageDrop(addImageFile, submitting);
	const onDragEnterBox = (e) => { e.preventDefault(); setIsDragOver(true); };
	const onDragLeaveBox = () => setIsDragOver(false);
	const onDropBox = (e) => {
		e.preventDefault(); setIsDragOver(false);
		addImageFile(e.dataTransfer.files?.[0]);
	};
	const onFileChange = (e) => {
		addImageFile(e.target.files?.[0]);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const onVideoDragEnter = (e) => { e.preventDefault(); setIsVideoDragOver(true); };
	const onVideoDragLeave = () => setIsVideoDragOver(false);
	const onVideoDrop = (e) => {
		e.preventDefault(); setIsVideoDragOver(false);
		addVideoFile(e.dataTransfer.files?.[0]);
	};
	const onVideoFileChange = (e) => {
		addVideoFile(e.target.files?.[0]);
		if (videoFileInputRef.current) videoFileInputRef.current.value = "";
	};

	const removeImage = (idx) => {
		setImageItems((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			if (next.length > 0 && !next.some((i) => i.isMain)) next[0].isMain = true;
			return next;
		});
	};
	const setMain = (idx) => {
		setImageItems((prev) => {
			if (idx === 0) return prev.map((img, i) => ({ ...img, isMain: i === 0 }));
			const newItems = arrayMove(prev, idx, 0);
			return newItems.map((img, i) => ({ ...img, isMain: i === 0 }));
		});
	};

	const removeVideo = (idx) => {
		setVideoItems((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			if (next.length > 0 && !next.some((v) => v.isPrimary)) next[0].isPrimary = true;
			return next;
		});
	};
	const setPrimaryVideo = (idx) => {
		setVideoItems((prev) => {
			if (idx === 0) return prev.map((vid, i) => ({ ...vid, isPrimary: i === 0 }));
			const newItems = arrayMove(prev, idx, 0);
			return newItems.map((vid, i) => ({ ...vid, isPrimary: i === 0 }));
		});
	};

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const handleImageDragEndDnd = (event) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setImageItems((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const handleVideoDragEndDnd = (event) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setVideoItems((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const uploadPendingImages = async () => {
		const pending = imageItems.filter((i) => i.file && !i.url);
		if (!pending.length) return imageItems;
		setUploadingCount(pending.length);
		const token = localStorage.getItem("token");
		const uploaded = await Promise.all(
			imageItems.map(async (item) => {
				if (!item.file || item.url) return item;
				const fd = new FormData();
				fd.append("image", item.file);
				try {
					const res = await apiClient.post("/upload", fd, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (res.data.success)
						return { ...item, url: res.data.data.url, publicId: res.data.data.publicId };
					return item;
				} catch (err) {
					return item;
				}
			}),
		);
		setUploadingCount(0);
		return uploaded;
	};

	const uploadPendingVideos = async () => {
		const pending = videoItems.filter((v) => v.file && !v.url);
		if (!pending.length) return videoItems;
		setUploadingVideoCount(pending.length);
		const token = localStorage.getItem("token");
		const uploaded = await Promise.all(
			videoItems.map(async (item) => {
				if (!item.file || item.url) return item;
				const fd = new FormData();
				fd.append("video", item.file);
				try {
					const res = await apiClient.post("/upload/video", fd, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (res.data.success)
						return { ...item, url: res.data.data.url, publicId: res.data.data.publicId };
					return item;
				} catch (err) {
					return item;
				}
			}),
		);
		setUploadingVideoCount(0);
		return uploaded;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((p) => {
			const updated = { ...p, [name]: value };
			// Reset subCategory when category changes
			if (name === "category") updated.subCategory = "";
			return updated;
		});
		setErrors((p) => ({ ...p, [name]: "" }));
	};
	const handleCountryToggle = (country) => {
		setFormData((p) => ({
			...p,
			countries: p.countries.includes(country)
				? p.countries.filter((c) => c !== country)
				: [...p.countries, country],
		}));
		setErrors((prev) => ({ ...prev, countries: "" }));
	};

	const getCustomCountries = () =>
		formData.countries.filter((c) => c !== "Other" && !countryOptions.includes(c));

	const validateForm = () => {
		const e = {};
		if (!formData.title.trim()) e.title = "Title is required";
		if (!formData.description.trim())
			e.description = "Description is required";
		if (!formData.affiliateLink.trim())
			e.affiliateLink = "Affiliate link is required";
		const parsedPrice = parseFloat((formData.price || "").toString().replace(/,/g, ""));
		if (!formData.price || isNaN(parsedPrice) || parsedPrice <= 0)
			e.price = "Valid price is required";
		if (imageItems.length === 0)
			e.images = "At least one image is required";
		if (formData.countries.length === 0)
			e.countries = "Select at least one country";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitError("");
		setSuccessMessage("");
		if (!validateForm()) return;

		const eValid = {};
		let hasErr = false;
		if (formData.animeTag === "Other" && !customAnimeTag.trim()) {
			eValid.animeTag = "Please specify the anime name";
			hasErr = true;
		}
		if (formData.category === "Other" && !customCategory.trim()) {
			eValid.category = "Please specify the category";
			hasErr = true;
		}
		if (formData.subCategory === "Other" && !customSubCategory.trim()) {
			eValid.subCategory = "Please specify the subcategory";
			hasErr = true;
		}
		if (formData.store === "Other" && !customStore.trim()) {
			eValid.store = "Please specify the store";
			hasErr = true;
		}
		const customCountries = getCustomCountries();
		if (
			formData.countries.includes("Other") &&
			customCountries.length === 0 &&
			!customCountryInput.trim()
		) {
			eValid.countries = "Please specify the custom country";
			hasErr = true;
		}

		if (hasErr) {
			setErrors(eValid);
			return;
		}

		setSubmitting(true);
		try {
			const finalImages = await uploadPendingImages();
			if (finalImages.filter((i) => !i.url).length > 0) {
				setSubmitError("Some images failed to upload.");
				setSubmitting(false);
				return;
			}
			const finalVideos = await uploadPendingVideos();
			if (finalVideos.filter((v) => !v.url).length > 0) {
				setSubmitError("Some videos failed to upload.");
				setSubmitting(false);
				return;
			}
			const payload = {
				...formData,
				animeTag:
					formData.animeTag === "Other"
						? toTitleCase(customAnimeTag.trim())
						: formData.animeTag,
				category:
					formData.category === "Other"
						? toTitleCase(customCategory.trim())
						: formData.category,
				subCategory:
					formData.subCategory === "Other"
						? toTitleCase(customSubCategory.trim())
						: formData.subCategory,
				store:
					formData.store === "Other"
						? toTitleCase(customStore.trim())
						: formData.store,
				countries: formData.countries.filter((c) => c !== "Other"),
				price: parseFloat(formData.price.toString().replace(/,/g, "")),
				images: finalImages.map(({ url, publicId, isMain }) => ({ url, publicId, isMain })),
				videos: finalVideos.map(({ url, publicId, isPrimary }) => ({ url, publicId, isPrimary })),
				isActive: formData.isActive,
				scheduledUploadTime: formData.scheduledUploadTime || null,
			};

			// Helper: inject a new custom value into dynamicOptions so the dropdown
			// reflects it immediately without waiting for a server round-trip.
			const injectDynamic = (finalAnime, finalCategory, finalStore) => {
				setDynamicOptions(prev => ({
					...prev,
					animeTags: mergeUnique(prev.animeTags, finalAnime && !ANIME_OPTIONS.includes(finalAnime) ? [finalAnime] : []),
					categories: mergeUnique(prev.categories, finalCategory && !CATEGORY_OPTIONS.includes(finalCategory) ? [finalCategory] : []),
					stores: mergeUnique(prev.stores, finalStore && !STORE_OPTIONS.includes(finalStore) ? [finalStore] : []),
				}));
			};

			if (editingId) {
				const res = await apiClient.put(
					`/products/${editingId}`,
					payload,
				);
				if (res.data.success) {
					injectDynamic(payload.animeTag, payload.category, payload.store);
					setSuccessMessage("Product updated successfully!");
					setTimeout(() => setViewMode("list"), 1500);
				}
			} else {
				const res = await apiClient.post("/products", payload);
				if (res.data.success) {
					injectDynamic(payload.animeTag, payload.category, payload.store);
					setSuccessMessage("Product created successfully!");
					setTimeout(() => setViewMode("list"), 1500);
				}
			}
		} catch (err) {
			setSubmitError(
				err.response?.data?.message || "Failed to save product",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (!user)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-white">Please log in</p>
			</div>
		);

	const mainPreview = imageItems.find((i) => i.isMain) || imageItems[0];
	const isWorking = submitting || uploadingCount > 0;

	return (
		<div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-black pb-16">
			{(submitting || isDeleting || isCopying) && (
				<LoadingAnimation
					variant="overlay"
					message={
						submitting
							? uploadingVideoCount > 0
								? `Uploading ${uploadingVideoCount} video(s)...`
								: uploadingCount > 0
									? `Uploading ${uploadingCount} image(s)...`
									: "Saving Product..."
							: isDeleting
								? "Deleting Product..."
								: "Fetching Media..."
					}
					submessage="Please wait"
				/>
			)}
			<header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-purple-300">
							<BoxIcon className="h-6 w-6" />
						</div>
						<h1 className="hidden sm:block text-xl font-bold text-white">
							{viewMode === "list"
								? "Product Management"
								: viewMode === "themes"
									? "Theme Controller"
									: editingId
										? "Edit Product"
										: "Add New Product"}
						</h1>
						<h1 className="sm:hidden text-lg font-bold text-white">
							{viewMode === "list" ? "Products" : viewMode === "themes" ? "Themes" : "Edit"}
						</h1>
					</div>

					{/* Desktop Menu */}
					<div className="hidden sm:flex gap-3">
						{viewMode !== "list" && (
							<Button
								onClick={() => setViewMode("list")}
								variant="secondary"
								size="sm"
							>
								Back to Products
							</Button>
						)}
						{viewMode === "list" && (
							<Button
								onClick={() => setViewMode("themes")}
								variant="secondary"
								size="sm"
                                className="border border-purple-500/30 hover:border-purple-500"
							>
								Manage Themes
							</Button>
						)}
						<Button
							onClick={() => navigate("/admin/dashboard")}
							variant="secondary"
							size="sm"
						>
							Dashboard
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-purple-400 transition-colors"
					>
						<svg
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{mobileMenuOpen ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							)}
						</svg>
					</button>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className="sm:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 space-y-2">
						{viewMode === "form" && (
							<Button
								onClick={() => {
									setViewMode("list");
									setMobileMenuOpen(false);
								}}
								variant="secondary"
								size="sm"
								className="w-full text-left"
							>
								Cancel
							</Button>
						)}
						<Button
							onClick={() => {
								navigate("/admin/dashboard");
								setMobileMenuOpen(false);
							}}
							variant="secondary"
							size="sm"
							className="w-full text-left"
						>
							Dashboard
						</Button>
					</div>
				)}
			</header>

			<div className="max-w-6xl mx-auto px-4 py-8">
				{viewMode === "themes" ? (
					<ThemeController />
				) : viewMode === "list" ? (
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
								<div className="flex gap-2">
									<Button
										onClick={() => setShowScheduledModal(true)}
										variant="secondary"
										className="border border-purple-500/30 hover:border-purple-500"
									>
										Manage Scheduled
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
									onChange={(v) => setFilterCategory(v)}
									options={finalCategoryOptions}
								/>

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
							{(searchQuery || filterCategory !== "All" || filterAnime !== "All" || filterStore !== "All" || filterCountry !== "All" || filterStatus !== "All") && (
								<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800">
									<span className="text-xs text-zinc-500">Active filters:</span>
									{searchQuery && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">Search: "{searchQuery}"</span>}
									{filterCategory !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterCategory}</span>}
									{filterAnime !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterAnime}</span>}
									{filterStore !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterStore}</span>}
									{filterCountry !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterCountry}</span>}
									{filterStatus !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterStatus}</span>}
									<button onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterAnime("All"); setFilterStore("All"); setFilterCountry("All"); setFilterStatus("All"); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors underline">Clear all</button>
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
						if (products.length === 0 && !loadingList && (searchQuery !== "" || filterCategory !== "All" || filterAnime !== "All" || filterStore !== "All" || filterCountry !== "All" || filterStatus !== "All")) return (
							<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
								<BoxIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
								<p className="text-zinc-400 mb-4">Try adjusting your search or filters.</p>
								<button onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterAnime("All"); setFilterStore("All"); setFilterCountry("All"); setFilterStatus("All"); }} className="text-purple-400 hover:underline text-sm">Clear filters</button>
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
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
							{/* ── Copy-from-product banner (create mode only) ── */}
							{!editingId && (
								<div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-zinc-800/70 border border-zinc-700">
									<div className="flex-1">
										<p className="text-sm font-semibold text-white">Adding a product for another country?</p>
										<p className="text-xs text-zinc-400 mt-0.5">Copy all details including images and videos from an existing product.</p>
									</div>
									<button
										type="button"
										onClick={() => setShowCopyModal(true)}
										className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-md shadow-purple-900/30"
									>
										<FiCopy className="text-lg" /> Copy from existing
									</button>
								</div>
							)}
							<form onSubmit={handleSubmit} className="space-y-6">
								{submitError && (
									<div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
										{submitError}
									</div>
								)}
								{successMessage && (
									<div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-200 text-sm">
										{successMessage}
									</div>
								)}
								{/* ── Copied-from banner ── */}
								{copiedFromProduct && !editingId && (
									<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-950/50 border border-blue-700/60 text-blue-200 text-sm">
										<FiCopy className="text-lg text-blue-400 shrink-0 mt-0.5" />
										<div className="flex-1">
											<p className="font-semibold text-blue-100">All data copied from <span className="text-purple-300">&ldquo;{copiedFromProduct}&rdquo;</span></p>
											<p className="text-xs text-blue-300 mt-0.5">Images and videos have been fetched and will be <span className="font-bold text-amber-300">re-uploaded as new files</span>.</p>
										</div>
										<button type="button" onClick={() => setCopiedFromProduct("")} className="text-blue-400 hover:text-white transition-colors flex-shrink-0">
											<FiX className="w-5 h-5" />
										</button>
									</div>
								)}

								{/* ── Auto-Import from URL banner ── */}
								<div className="mb-6 p-4 rounded-xl bg-zinc-800/70 border border-zinc-700">
									<h3 className="text-sm font-semibold text-white mb-2">Auto-Import from URL</h3>
									<p className="text-xs text-zinc-400 mb-3">Paste an affiliate link (e.g. from Diffbot-supported sites) to automatically extract the title, description, price, and image.</p>
									<div className="flex gap-2">
										<Input
											placeholder="https://..."
											value={urlToFetch}
											onChange={(e) => setUrlToFetch(e.target.value)}
											className="flex-1"
										/>
										<Button
											type="button"
											onClick={fetchFromUrl}
											disabled={isFetchingUrl || !urlToFetch}
											className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
										>
											{isFetchingUrl ? (
												<span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Fetching...</span>
											) : (
												<span className="flex items-center gap-2"><FiSearch /> Fetch Data</span>
											)}
										</Button>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-bold text-white">
										Basic Information
									</h3>
									<Input
										label="Product Title"
										name="title"
										placeholder="e.g., Attack on Titan Hoodie"
										value={formData.title}
										onChange={handleInputChange}
										error={errors.title}
										maxLength={300}
										required
									/>
									<p className="text-xs text-right -mt-3" style={{ color: formData.title.length > 270 ? '#f87171' : '#71717a' }}>{formData.title.length}/300</p>
									<div>
										<label className="block text-sm font-medium text-zinc-200 mb-2">
											Description
										</label>
										<textarea
											name="description"
											placeholder="Detailed product description"
											value={formData.description}
											onChange={handleInputChange}
											rows="4"
											maxLength={2000}
											className={`w-full px-4 py-2.5 rounded-lg bg-zinc-800 border text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.description ? "border-red-500" : "border-zinc-700"}`}
										/>
										<div className="flex justify-between items-start mt-1">
											{errors.description ? (
												<p className="text-red-500 text-xs">{errors.description}</p>
											) : <span />}
											<p className="text-xs ml-auto" style={{ color: formData.description.length > 1900 ? '#f87171' : '#71717a' }}>{formData.description.length}/2000</p>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Category
											</label>
											<SearchableSelect
												name="category"
												value={formData.category}
												onChange={handleInputChange}
												options={formCategoryOptions}
												placeholder="Select Category"
											/>
											{formData.category === "Other" && (
												<Input
													placeholder="Enter custom category"
													value={customCategory}
													onChange={(e) => setCustomCategory(e.target.value)}
													className="mt-2"
													error={errors.category}
													required
												/>
											)}
										</div>
										{/* SubCategory - shown when the selected category has subcategories or is Other */}
										{(subCategoryMap[formData.category]?.length > 0 || formData.category === "Other") && (
											<div>
												<label className="block text-sm font-medium text-zinc-200 mb-2">
													Sub Category
													<span className="ml-2 text-xs text-zinc-500">(optional)</span>
												</label>
												{formData.category === "Other" ? (
													<Input
														placeholder="Enter custom sub-category"
														value={customSubCategory}
														onChange={(e) => setCustomSubCategory(e.target.value)}
													/>
												) : (
													<>
														<SearchableSelect
															name="subCategory"
															value={formData.subCategory}
															onChange={handleInputChange}
															options={[...(subCategoryMap[formData.category] || []), "Other"]}
															placeholder="— Select sub-category —"
														/>
														{formData.subCategory === "Other" && (
															<Input
																placeholder="Enter custom sub-category"
																value={customSubCategory}
																onChange={(e) => setCustomSubCategory(e.target.value)}
																className="mt-2"
																error={errors.subCategory}
																required
															/>
														)}
													</>
												)}
												{(formData.subCategory || customSubCategory) && (
													<p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
														<span>✓</span> Sub-category set
													</p>
												)}
											</div>
										)}
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Anime
											</label>
											<SearchableSelect
												name="animeTag"
												value={formData.animeTag}
												onChange={handleInputChange}
												options={formAnimeOptions}
												placeholder="Select Anime"
											/>
											{formData.animeTag === "Other" && (
												<Input
													placeholder="Enter custom anime name"
													value={customAnimeTag}
													onChange={(e) =>
														setCustomAnimeTag(
															e.target.value,
														)
													}
													className="mt-2"
													required
												/>
											)}
											{errors.animeTag && (
												<p className="text-red-500 text-xs mt-1">
													{errors.animeTag}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Pricing & Links
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="md:col-span-2">
											<Input
												label="Price"
												name="price"
												type="text"
												inputMode="decimal"
												placeholder="2,999.99"
												value={formData.price}
												onChange={handleInputChange}
												error={errors.price}
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Currency
											</label>
											{/* Show selected symbol preview */}
											{formData.currency && CURRENCY_SYMBOL_MAP[formData.currency] && (
												<div className="flex items-center gap-2 mb-2">
													<span className="inline-flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-300 text-sm font-bold px-3 py-1 rounded-lg">
														<span className="text-base">{CURRENCY_SYMBOL_MAP[formData.currency]}</span>
														<span>{formData.currency}</span>
													</span>
													<span className="text-zinc-500 text-xs">{CURRENCY_LIST.find(c => c.code === formData.currency)?.name}</span>
												</div>
											)}
											<CurrencySearchableSelect
												name="currency"
												value={formData.currency}
												onChange={handleInputChange}
												currencies={CURRENCY_LIST}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Store
											</label>
											<SearchableSelect
												name="store"
												value={formData.store}
												onChange={handleInputChange}
												options={formStoreOptions}
												placeholder="Select Store"
											/>
											{formData.store === "Other" && (
												<Input
													placeholder="Enter custom store name"
													value={customStore}
													onChange={(e) => setCustomStore(e.target.value)}
													className="mt-2"
													error={errors.store}
													required
												/>
											)}
										</div>
										<div className="md:col-span-2">
											{/* Highlight affiliate link after metadata copy */}
											{copiedFromProduct && !editingId && (
												<div className="mb-2 flex items-center gap-2 text-xs text-amber-400 font-semibold animate-pulse">
													<FiArrowDown className="text-sm" /> Ensure you update the country-specific affiliate link below
												</div>
											)}
											<Input
												label="Affiliate Link"
												name="affiliateLink"
												placeholder="https://..."
												value={formData.affiliateLink}
												onChange={handleInputChange}
												error={errors.affiliateLink}
												required
											/>
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Visibility & Scheduling
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="flex items-center gap-2 cursor-pointer mb-2">
												<input
													type="checkbox"
													name="isActive"
													checked={!formData.isActive}
													onChange={(e) => setFormData(p => ({...p, isActive: !e.target.checked}))}
													className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-purple-500"
												/>
												<span className="text-sm font-medium text-white">Private Mode (Hide Product)</span>
											</label>
											<p className="text-xs text-zinc-500 ml-6">If enabled, the product will be inactive and hidden from the main site. Use this for invalid links.</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Schedule Upload Time
											</label>
											<input
												type="datetime-local"
												name="scheduledUploadTime"
												value={formData.scheduledUploadTime}
												onChange={handleInputChange}
												className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
											/>
											<p className="text-xs text-zinc-500 mt-1">Leave empty to publish immediately (or use active/inactive status).</p>
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Target Regions
									</h3>
									<div className="flex flex-wrap gap-3">
										{countryOptions.map((c) => (
											<button
												key={c}
												type="button"
												onClick={() => handleCountryToggle(c)}
												className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.countries.includes(c) ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
											>
												{c}
											</button>
										))}
										<button
											type="button"
											onClick={() => handleCountryToggle("Other")}
											className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.countries.includes("Other") ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
										>
											Other
										</button>
									</div>
									{formData.countries.includes("Other") && (
										<div className="mt-3">
											<label className="block text-sm font-medium text-zinc-200 mb-2">Custom Countries (Press Enter to add)</label>
											<div className="flex flex-wrap gap-2 mb-2">
												{getCustomCountries().map(tag => (
													<span key={tag} className="bg-purple-600/30 border border-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
														{tag}
														<button type="button" onClick={() => handleCountryToggle(tag)} className="text-purple-300 hover:text-white">&times;</button>
													</span>
												))}
											</div>
											<Input
												placeholder="Type a country and press Enter"
												value={customCountryInput}
												onChange={(e) => {
													setCustomCountryInput(e.target.value);
													if (errors.countries) {
														setErrors((prev) => ({ ...prev, countries: "" }));
													}
												}}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const val = toTitleCase(customCountryInput.trim());
														if (val && !formData.countries.includes(val)) {
															setFormData(p => ({ ...p, countries: [...p.countries, val] }));
														}
														setCustomCountryInput("");
														setErrors((prev) => ({ ...prev, countries: "" }));
													}
												}}
											/>
											{getCustomCountries().length > 0 && !customCountryInput.trim() && (
												<p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
													<span>✓</span> {getCustomCountries().length} custom {getCustomCountries().length === 1 ? "country" : "countries"} added
												</p>
											)}
										</div>
									)}
									{errors.countries && (
										<p className="text-red-500 text-xs mt-1">
											{errors.countries}
										</p>
									)}
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<div className="flex justify-between items-center">
										<h3 className="text-lg font-bold text-white">
											Product Images
										</h3>
										<span className="text-xs text-zinc-400">
											{imageItems.length} / 10 added
										</span>
									</div>
									<div
										onDragEnter={onDragEnterBox}
										onDragOver={(e) => e.preventDefault()}
										onDragLeave={onDragLeaveBox}
										onDrop={onDropBox}
										onClick={() =>
											fileInputRef.current?.click()
										}
										className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragOver ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"}`}
									>
										<UploadIcon className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
										<p className="text-white font-medium mb-1">
											Click or drag images here
										</p>
										<p className="text-zinc-500 text-sm mb-4">
											Ctrl+V to paste. Max 10 images,
											under 10MB each.
										</p>
										<input
											ref={fileInputRef}
											type="file"
											multiple
											accept="image/*"
											onChange={onFileChange}
											className="hidden"
										/>
									</div>
									{errors.images && (
										<p className="text-red-500 text-xs text-center">
											{errors.images}
										</p>
									)}
									{imageItems.length > 0 && (
										<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImageDragEndDnd}>
											<SortableContext items={imageItems.map(i => i.id)} strategy={rectSortingStrategy}>
												<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
													{imageItems.map((img, idx) => (
														<SortableImageItem key={img.id} id={img.id} img={img} index={idx} removeImage={removeImage} setMain={setMain} />
													))}
												</div>
											</SortableContext>
										</DndContext>
									)}
								</div>

								{/* ── Product Videos ── */}
								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<div className="flex justify-between items-center">
										<div>
											<h3 className="text-lg font-bold text-white">Product Videos</h3>
											<p className="text-xs text-zinc-500 mt-0.5">Optional · Max 3 videos · Up to 200 MB each</p>
										</div>
										<span className="text-xs text-zinc-400">{videoItems.length} / 3 added</span>
									</div>

									{videoItems.length < 3 && (
										<div
											onDragEnter={onVideoDragEnter}
											onDragOver={(e) => e.preventDefault()}
											onDragLeave={onVideoDragLeave}
											onDrop={onVideoDrop}
											onClick={() => videoFileInputRef.current?.click()}
											className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
												isVideoDragOver
													? "border-blue-500 bg-blue-500/10"
													: "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"
											}`}
										>
											<svg className="mx-auto h-10 w-10 text-zinc-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
											</svg>
											<p className="text-white font-medium mb-1">Click or drag a video here</p>
											<p className="text-zinc-500 text-sm">MP4, WebM, MOV — max 200 MB</p>
											<input
												ref={videoFileInputRef}
												type="file"
												accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
												onChange={onVideoFileChange}
												className="hidden"
											/>
										</div>
									)}

									{errors.videos && (
										<p className="text-red-500 text-xs">{errors.videos}</p>
									)}

									{videoItems.length > 0 && (
										<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleVideoDragEndDnd}>
											<SortableContext items={videoItems.map(v => v.id)} strategy={verticalListSortingStrategy}>
												<div className="space-y-3 mt-2">
													{videoItems.map((vid, idx) => (
														<SortableVideoItem key={vid.id} id={vid.id} vid={vid} index={idx} removeVideo={removeVideo} setPrimaryVideo={setPrimaryVideo} />
													))}
												</div>
											</SortableContext>
										</DndContext>
									)}
								</div>

								<div className="pt-8">
									<Button
										type="submit"
										disabled={isWorking}
										className="w-full h-14 text-lg bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/20"
									>
										{isWorking
											? uploadingVideoCount > 0
												? `Uploading ${uploadingVideoCount} video(s)...`
												: uploadingCount > 0
												? `Uploading ${uploadingCount} image(s)...`
												: "Saving Product..."
											: editingId
												? "Update Product"
												: "Create Product"}
									</Button>
								</div>
							</form>
						</div>

						<div className="lg:col-span-1">
							<div className="sticky top-28 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
								<h3 className="text-lg font-bold text-white mb-4">
									Card Preview
								</h3>
								{!formData.title && !mainPreview ? (
									<div className="aspect-3/4 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
										Fill out form to see preview
									</div>
								) : (
									<div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
										<div className="aspect-square bg-zinc-800 relative">
											{mainPreview ? (
												<img
													src={
														mainPreview.previewUrl ||
														mainPreview.url
													}
													alt=""
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-zinc-600">
													No Image
												</div>
											)}
											<div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
												{formData.animeTag === "Other"
													? customAnimeTag || "Anime"
													: formData.animeTag}
											</div>
											<div className="absolute top-3 right-3 bg-zinc-900 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
												{formData.store}
											</div>
										</div>
										<div className="p-4">
											<h4 className="font-bold text-white line-clamp-2">
												{formData.title ||
													"Product Title"}
											</h4>
											<div className="mt-2 flex flex-wrap items-start justify-between gap-1">
												<div className="flex flex-col gap-1">
													<span className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded">
														{formData.category}
													</span>
													{formData.subCategory && (
														<span className="bg-violet-900/40 text-violet-300 text-xs px-2.5 py-1 rounded border border-violet-800/50">
															{formData.subCategory}
														</span>
													)}
												</div>
												<span className="text-purple-400 font-bold">
													{CURRENCY_SYMBOL_MAP[formData.currency] && (
														<span className="mr-0.5">{CURRENCY_SYMBOL_MAP[formData.currency]}</span>
													)}
													{formData.currency}{" "}
													{formData.price || "0.00"}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
			{/* Copy Product Modal */}
			{showCopyModal && (
				<CopyProductModal
					onSelect={applyProductTemplate}
					onClose={() => setShowCopyModal(false)}
				/>
			)}
			{/* Scheduled Products Modal */}
			{showScheduledModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
					<div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
						<div className="p-6 border-b border-zinc-800 flex justify-between items-center">
							<div>
								<h2 className="text-xl font-bold text-white">Scheduled Products</h2>
								<p className="text-zinc-400 text-sm mt-1">Manage products that are scheduled to be published in the future.</p>
							</div>
							<button onClick={() => setShowScheduledModal(false)} className="text-zinc-400 hover:text-white transition-colors">
								<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="p-6 overflow-y-auto flex-1">
							{products.filter(p => p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date()).length === 0 ? (
								<div className="text-center py-12">
									<BoxIcon className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
									<p className="text-zinc-400 font-medium">No scheduled products.</p>
								</div>
							) : (
								<div className="space-y-4">
									{products.filter(p => p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date()).map(p => (
										<div key={p._id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 hover:border-purple-500/50 transition-colors">
											<div className="flex items-center gap-4">
												<img src={p.images?.[0]?.url || "placeholder.jpg"} className="w-14 h-14 rounded-lg object-cover border border-zinc-700" alt="" />
												<div>
													<p className="text-white font-bold text-sm line-clamp-1">{p.title}</p>
													<p className="text-purple-400 text-xs mt-1 flex items-center gap-1">
														<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														Scheduled: {new Date(p.scheduledUploadTime).toLocaleString()}
													</p>
												</div>
											</div>
											<Button size="sm" variant="secondary" onClick={() => { setShowScheduledModal(false); openEdit(p); }} className="whitespace-nowrap">Edit Product</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProductManagement;
