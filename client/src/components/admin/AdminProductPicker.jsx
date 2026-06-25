import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../services/apiClient";
import {
	ANIME_FILTER_OPTIONS,
	CATEGORY_FILTER_OPTIONS,
	COUNTRY_FILTER_OPTIONS,
	FILTER_ALL,
	PICKER_PAGE_SIZE,
	PICKER_SORT_OPTIONS,
	STORE_FILTER_OPTIONS,
	sortToApiParam,
} from "../../constants/productFilters";
import LoadingAnimation from "../common/LoadingAnimation";
import { getProductImage, isNewlyAdded, mapIsoToCountryValue } from "../../utils/productHelpers";
import { FaCheckCircle, FaSearch, FaTimes } from "react-icons/fa";

const DEBOUNCE_MS = 350;

const selectClass =
	"w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-purple-500";

const resolveInitialCountry = (defaultCountry, countryIso) => {
	if (defaultCountry) return defaultCountry;
	const mapped = mapIsoToCountryValue(countryIso);
	return mapped || FILTER_ALL.country;
};

/**
 * Admin product picker — server-side filters, 20 per page, load more on scroll.
 * Changing search/filters refetches from the API (does not reuse a stale client list).
 */
const AdminProductPicker = ({
	selected = [],
	onConfirm,
	onClose,
	countryIso = "ALL",
	defaultCountry,
	title = "Select Products",
	subtitle,
}) => {
	const initialCountry = resolveInitialCountry(defaultCountry, countryIso);

	const [products, setProducts] = useState([]);
	const [picked, setPicked] = useState(selected);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);

	const [searchInput, setSearchInput] = useState("");
	const [searchDebounced, setSearchDebounced] = useState("");
	const [sortBy, setSortBy] = useState("newest");
	const [animeTag, setAnimeTag] = useState(FILTER_ALL.anime);
	const [store, setStore] = useState(FILTER_ALL.store);
	const [category, setCategory] = useState(FILTER_ALL.category);
	const [filterCountry, setFilterCountry] = useState(initialCountry);

	const scrollRef = useRef(null);
	const sentinelRef = useRef(null);
	const fetchGenRef = useRef(0);
	const pageRef = useRef(1);
	const loadingMoreRef = useRef(false);

	useEffect(() => {
		const t = setTimeout(() => setSearchDebounced(searchInput.trim()), DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [searchInput]);

	useEffect(() => {
		setPicked(selected);
	}, [selected]);

	const queryKey = useMemo(
		() =>
			JSON.stringify({
				search: searchDebounced,
				sortBy,
				animeTag,
				store,
				category,
				filterCountry,
			}),
		[searchDebounced, sortBy, animeTag, store, category, filterCountry],
	);

	const buildParams = useCallback(
		(pageNum) => {
			const params = new URLSearchParams({
				page: String(pageNum),
				limit: String(PICKER_PAGE_SIZE),
				sort: sortToApiParam(sortBy),
			});
			if (filterCountry !== FILTER_ALL.country) {
				params.set("country", filterCountry);
			}
			if (searchDebounced) params.set("search", searchDebounced);
			if (animeTag !== FILTER_ALL.anime) params.set("animeTag", animeTag);
			if (store !== FILTER_ALL.store) params.set("store", store);
			if (category !== FILTER_ALL.category) params.set("category", category);
			return params;
		},
		[sortBy, filterCountry, searchDebounced, animeTag, store, category],
	);

	const fetchPage = useCallback(
		async (pageNum, replace) => {
			const gen = ++fetchGenRef.current;
			if (replace) {
				setLoading(true);
			} else {
				setLoadingMore(true);
				loadingMoreRef.current = true;
			}

			try {
				const res = await apiClient.get(
					`/products/admin/all?${buildParams(pageNum)}`,
				);
				if (gen !== fetchGenRef.current) return;

				const newProducts = res.data?.data?.products || [];
				const pagination = res.data?.data?.pagination || {};
				const totalCount = pagination.total ?? 0;
				const totalPages = pagination.pages ?? 1;

				setProducts((prev) =>
					replace ? newProducts : [...prev, ...newProducts],
				);
				setTotal(totalCount);
				setPage(pageNum);
				pageRef.current = pageNum;
				setHasMore(pageNum < totalPages);
			} catch {
				if (gen === fetchGenRef.current) {
					if (replace) setProducts([]);
					setHasMore(false);
					setTotal(0);
				}
			} finally {
				if (gen === fetchGenRef.current) {
					setLoading(false);
					setLoadingMore(false);
					loadingMoreRef.current = false;
				}
			}
		},
		[buildParams],
	);

	useEffect(() => {
		setPage(1);
		pageRef.current = 1;
		setHasMore(true);
		if (scrollRef.current) scrollRef.current.scrollTop = 0;
		fetchPage(1, true);
	}, [queryKey, fetchPage]);

	const isSearchPending = searchInput.trim() !== searchDebounced;
	const showGridLoader = loading || isSearchPending;

	const loaderMessage = useMemo(() => {
		if (isSearchPending) return "Searching products…";
		if (searchDebounced) return "Searching products…";
		const hasFilters =
			animeTag !== FILTER_ALL.anime ||
			store !== FILTER_ALL.store ||
			category !== FILTER_ALL.category ||
			filterCountry !== initialCountry;
		if (hasFilters) return "Applying filters…";
		if (sortBy !== "newest") return "Sorting products…";
		return "Loading products…";
	}, [
		isSearchPending,
		searchDebounced,
		animeTag,
		store,
		category,
		filterCountry,
		initialCountry,
		sortBy,
	]);

	useEffect(() => {
		const root = scrollRef.current;
		const el = sentinelRef.current;
		if (!root || !el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0]?.isIntersecting &&
					hasMore &&
					!loading &&
					!loadingMoreRef.current
				) {
					fetchPage(pageRef.current + 1, false);
				}
			},
			{ root, rootMargin: "120px", threshold: 0 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, loading, fetchPage, products.length]);

	const toggle = (p) =>
		setPicked((prev) =>
			prev.find((x) => x._id === p._id)
				? prev.filter((x) => x._id !== p._id)
				: [...prev, p],
		);

	const resetFilters = () => {
		setSearchInput("");
		setAnimeTag(FILTER_ALL.anime);
		setStore(FILTER_ALL.store);
		setCategory(FILTER_ALL.category);
		setFilterCountry(initialCountry);
		setSortBy("newest");
	};

	return (
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 sm:p-6"
			role="dialog"
			aria-modal="true"
		>
			<div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
				<div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5">
					<div>
						<h3 className="m-0 text-lg font-bold text-white sm:text-xl">
							{title}
						</h3>
						<p className="mt-1 text-sm text-zinc-500">
							{subtitle ||
								`${picked.length} selected · ${PICKER_PAGE_SIZE} per load · filters query the server`}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
						aria-label="Close"
					>
						<FaTimes size={18} />
					</button>
				</div>

				<div className="shrink-0 space-y-3 border-b border-zinc-800 px-6 py-4">
					<div className="relative">
						<FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
						<input
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Search title, description, anime…"
							className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
						<div>
							<label className="mb-1 block text-xs font-medium text-zinc-500">
								Country
							</label>
							<select
								value={filterCountry}
								onChange={(e) => setFilterCountry(e.target.value)}
								className={selectClass}
							>
								{COUNTRY_FILTER_OPTIONS.map((o) => (
									<option key={o} value={o}>
										{o}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-zinc-500">
								Sort
							</label>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className={selectClass}
							>
								{PICKER_SORT_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-zinc-500">
								Anime
							</label>
							<select
								value={animeTag}
								onChange={(e) => setAnimeTag(e.target.value)}
								className={selectClass}
							>
								{ANIME_FILTER_OPTIONS.map((o) => (
									<option key={o} value={o}>
										{o}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-zinc-500">
								Store
							</label>
							<select
								value={store}
								onChange={(e) => setStore(e.target.value)}
								className={selectClass}
							>
								{STORE_FILTER_OPTIONS.map((o) => (
									<option key={o} value={o}>
										{o}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-zinc-500">
								Category
							</label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className={selectClass}
							>
								{CATEGORY_FILTER_OPTIONS.map((o) => (
									<option key={o} value={o}>
										{o}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-end">
							<button
								type="button"
								onClick={resetFilters}
								className="w-full rounded-lg border border-zinc-700 py-2.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-white"
							>
								Reset filters
							</button>
						</div>
					</div>

					<p className="text-xs text-zinc-600">
						{showGridLoader
							? loaderMessage
							: `${products.length} of ${total} shown`}
						{loadingMore && !showGridLoader && " · loading more…"}
						{searchDebounced &&
							!showGridLoader &&
							` · search: “${searchDebounced}”`}
					</p>
				</div>

				<div
					ref={scrollRef}
					className="relative min-h-[320px] flex-1 overflow-y-auto px-6 py-4"
				>
					{showGridLoader && (
						<LoadingAnimation
							variant="overlay"
							size="md"
							message={loaderMessage}
							submessage=""
						/>
					)}

					{!showGridLoader && products.length === 0 ? (
						<div className="py-16 text-center text-zinc-500">
							No products match these filters. Try another country or
							clear search.
						</div>
					) : (
						<>
							<div
								className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
									showGridLoader ? "pointer-events-none opacity-40" : ""
								}`}
							>
								{products.map((p) => {
									const sel = picked.some((x) => x._id === p._id);
									const isNew = isNewlyAdded(p);
									return (
										<button
											key={p._id}
											type="button"
											onClick={() => toggle(p)}
											className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${
												sel
													? "border-purple-500 bg-purple-950/30"
													: "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
											}`}
										>
											{sel && (
												<div className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500">
													<FaCheckCircle size={10} color="#fff" />
												</div>
											)}
											{isNew && (
												<span className="absolute left-2 top-2 z-10 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
													New
												</span>
											)}
											<img
												src={getProductImage(p)}
												alt=""
												className="h-28 w-full object-cover sm:h-32"
												onError={(e) => {
													e.target.style.display = "none";
												}}
											/>
											<div className="p-2.5">
												<p className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-200">
													{p.title}
												</p>
												<p className="mt-0.5 text-[0.65rem] text-zinc-500">
													{p.currency} {p.price.toLocaleString(p.currency === 'INR' ? 'en-IN' : 'en-US')}
													{p.countries?.length
														? ` · ${p.countries.join(", ")}`
														: ""}
												</p>
											</div>
										</button>
									);
								})}
							</div>
							<div ref={sentinelRef} className="h-4 w-full" aria-hidden />
							{loadingMore && (
								<LoadingAnimation
									variant="inline"
									size="sm"
									message="Loading more products…"
									submessage=""
								/>
							)}
							{!hasMore && products.length > 0 && (
								<p className="py-4 text-center text-xs text-zinc-600">
									All matching products loaded
								</p>
							)}
						</>
					)}
				</div>

				<div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => onConfirm(picked)}
						className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-purple-500"
					>
						Confirm {picked.length} product{picked.length !== 1 ? "s" : ""}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminProductPicker;
