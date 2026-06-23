import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import apiClient from "../../services/apiClient";
import ProductCard from "../../components/common/ProductCard";
import FilterPanel from "../../components/common/FilterPanel";
import MainHeader from "../../components/common/MainHeader";
import CountryFlag from "../../components/common/CountryFlag";
import NotFoundPage from "../NotFound/NotFoundPage";
import ProductCarousel from "../../components/ui/ProductCarousel";
import SuggestProductModal from "../../components/common/SuggestProductModal";
import { flattenCarouselItems } from "../../utils/carouselHelpers";
import mainLogo from "../../assets/main_logo.jpeg";
import {
	getCountryBySlug,
	getCountryByValue,
	getCountrySlug,
	getCountryISOCode,
	countries,
} from "../../utils/countries";
import { sortToApiParam } from "../../constants/productFilters";
import {
	FaStar,
	FaFire,
	FaBox,
	FaArrowRight,
	FaUserShield,
} from "react-icons/fa";
import { FiRefreshCw, FiMap } from "react-icons/fi";

const PAGE_SIZE = 20;

/* ════════════════════════════════════════════════════
   Homepage
   ════════════════════════════════════════════════════ */
const Homepage = () => {
	const navigate = useNavigate();
	const { countrySlug } = useParams();
	const { selectedCountry, updateCountry } = useAppContext();

	const countryFromRoute = useMemo(() => {
		if (!countrySlug) return null;
		return getCountryBySlug(countrySlug.toLowerCase());
	}, [countrySlug]);

	const activeCountryValue = countryFromRoute?.value || selectedCountry;
	const activeCountry = getCountryByValue(activeCountryValue);

	const [carouselItems, setCarouselItems] = useState([]);
	const [trendingProducts, setTrendingProducts] = useState([]);
	const [trendingLoading, setTrendingLoading] = useState(true);
	const [contentLoading, setContentLoading] = useState(true);

	const [products, setProducts] = useState([]);
	const [filters, setFilters] = useState({});
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [productsLoading, setProductsLoading] = useState(false);
	const [totalProducts, setTotalProducts] = useState(0);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

	const sentinelRef = useRef(null);
	const catalogRef = useRef(null);
	const isFetchingRef = useRef(false);

	const isWorldwide = activeCountryValue === "Worldwide";

	/* Sync URL → context */
	useEffect(() => {
		if (
			countrySlug &&
			countryFromRoute &&
			countryFromRoute.value !== selectedCountry
		) {
			updateCountry(countryFromRoute.value);
		}
	}, [countrySlug, countryFromRoute, selectedCountry, updateCountry]);

	/* Fetch carousels for this region */
	useEffect(() => {
		const fetchContent = async () => {
			try {
				setContentLoading(true);
				const iso = getCountryISOCode(activeCountry.value);
				const carouselsRes = await apiClient.get(
					`/carousels?isActive=true&country=${iso}`,
				);
				setCarouselItems(
					flattenCarouselItems(carouselsRes.data?.data || []),
				);
			} catch (err) {
				console.error("Content fetch error:", err);
			} finally {
				setContentLoading(false);
			}
		};
		if (activeCountry) fetchContent();
	}, [activeCountry]);

	/* Admin-curated trending products for this region */
	useEffect(() => {
		const fetchTrending = async () => {
			setTrendingLoading(true);
			try {
				const res = await apiClient.get(
					`/trending/products?country=${encodeURIComponent(activeCountryValue)}`,
				);
				const products = res.data?.data?.products;
				setTrendingProducts(Array.isArray(products) ? products : []);
			} catch {
				setTrendingProducts([]);
			} finally {
				setTrendingLoading(false);
			}
		};
		if (activeCountryValue) fetchTrending();
	}, [activeCountryValue]);

	/* Fetch products (paginated) */
	const fetchPage = useCallback(
		async (page, reset = false) => {
			if (isFetchingRef.current) return;
			isFetchingRef.current = true;
			setProductsLoading(true);
			try {
				const params = new URLSearchParams({
					country: activeCountryValue,
					page,
					limit: PAGE_SIZE,
					sort: sortToApiParam(filters.sort || "newest"),
					...(filters.search && { search: filters.search }),
					...(filters.animeTag &&
						filters.animeTag !== "All Anime" && {
							animeTag: filters.animeTag,
						}),
					...(filters.category &&
						filters.category !== "All Categories" && {
							category: filters.category,
						}),
					...(filters.store &&
						filters.store !== "All Stores" && {
							store: filters.store,
						}),
					...(filters.subCategory &&
						filters.subCategory !== "All" && {
							subCategory: filters.subCategory,
						}),
					...(isWorldwide &&
						filters.regionCountry &&
						filters.regionCountry !== "All Countries" && {
							regionCountry: filters.regionCountry,
						}),
				});
				const res = await apiClient.get(`/products?${params}`);
				const responseData = res.data?.data;
				const newProducts = Array.isArray(responseData?.products)
					? responseData.products
					: [];
				const pagination = responseData?.pagination || {};
				const total = pagination.total || 0;

				setTotalProducts(total);
				setProducts((prev) =>
					reset ? newProducts : [...prev, ...newProducts],
				);
				setHasMore(
					newProducts.length === PAGE_SIZE &&
						newProducts.length < total,
				);
				setCurrentPage(page);
			} catch (err) {
				console.error("Products fetch error:", err);
			} finally {
				setProductsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[activeCountryValue, filters, isWorldwide],
	);

	/* Reset & initial load on country/filter change */
	useEffect(() => {
		setProducts([]);
		setCurrentPage(1);
		setHasMore(true);
		fetchPage(1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeCountryValue, filters]);

	/* IntersectionObserver — infinite scroll */
	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !productsLoading) {
					fetchPage(currentPage + 1);
				}
			},
			{ rootMargin: "300px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, productsLoading, currentPage, fetchPage]);

	const handleFilterChange = (newFilters) => setFilters(newFilters);

	const handleSearch = (search) => {
		handleFilterChange({ ...filters, search });
		if (catalogRef.current) {
			catalogRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	if (countrySlug && !countryFromRoute) return <NotFoundPage />;

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "linear-gradient(180deg, #09090b 0%, #000 100%)",
				color: "#fff",
				fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
			}}
		>
			{/* spin keyframe for loading icon */}
			<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

			{/* ══════════ HEADER ══════════ */}
			<MainHeader onSearch={handleSearch} />

			{/* ══════════ 1. COUNTRY INTRO ══════════ */}
			<section className="border-b border-zinc-900 bg-gradient-to-br from-violet-950/40 to-black py-8 sm:py-10">
				<div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
					<div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center sm:gap-5">
						{/* Flag — transparent container, no box */}
						<div className="shrink-0 leading-none">
							<CountryFlag
								value={activeCountry.value}
								size="xl"
								mode="image"
								style={{
									width: "72px",
									height: "50px",
									borderRadius: "8px",
									boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
								}}
							/>
						</div>

						{/* Text */}
						<div className="min-w-0 flex-1">
							<p className="mb-1 text-[0.7rem] uppercase tracking-[0.2em] text-zinc-500">
								Region
							</p>
							<h1 className="mb-1 text-xl font-extrabold text-white sm:text-2xl lg:text-[2rem]">
								{activeCountry.label} — Anime Merch
							</h1>
							<p className="m-0 text-sm text-zinc-500 sm:text-[0.9rem]">
								{activeCountry.description}
							</p>
						</div>
					</div>

					{/* Country switcher pills — desktop/tablet only (mobile uses header menu) */}
					<div className="hidden flex-wrap gap-2 md:flex lg:max-w-[50%] lg:justify-end">
						{countries
							.filter((c) => c.value !== activeCountry.value)
							.map((c) => (
								<button
									key={c.value}
									onClick={() => {
										updateCountry(c.value);
										navigate(
											`/country/${getCountrySlug(c.value)}`,
										);
									}}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.45rem",
										padding: "0.35rem 0.75rem",
										borderRadius: "999px",
										border: "1px solid #3f3f46",
										background: "transparent",
										color: "#a1a1aa",
										fontSize: "0.8rem",
										cursor: "pointer",
										fontFamily: "inherit",
										transition: "all 0.2s",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor =
											"#a855f7";
										e.currentTarget.style.color = "#fff";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor =
											"#3f3f46";
										e.currentTarget.style.color = "#a1a1aa";
									}}
								>
									<CountryFlag
										value={c.value}
										size="xs"
										mode="image"
									/>
									<span>{c.label}</span>
								</button>
							))}
						<button
							onClick={() => setIsSuggestionModalOpen(true)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.45rem",
								padding: "0.35rem 0.75rem",
								borderRadius: "999px",
								border: "1px solid #7c3aed",
								background: "rgba(124, 58, 237, 0.1)",
								color: "#c4b5fd",
								fontSize: "0.8rem",
								cursor: "pointer",
								fontFamily: "inherit",
								transition: "all 0.2s",
								fontWeight: 600,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "rgba(124, 58, 237, 0.2)";
								e.currentTarget.style.color = "#fff";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
								e.currentTarget.style.color = "#c4b5fd";
							}}
						>
							<FaStar size={12} color="#facc15" />
							Suggest a Product
						</button>
					</div>
				</div>
			</section>

			<SuggestProductModal 
				isOpen={isSuggestionModalOpen} 
				onClose={() => setIsSuggestionModalOpen(false)} 
				defaultCountry={activeCountryValue}
			/>

			{/* ══════════ 3. PRODUCT CAROUSEL ══════════ */}
			{!contentLoading && carouselItems.length > 0 && (
				<section
					style={{
						borderBottom: "1px solid #1c1c1f",
						background: "rgba(0,0,0,0.25)",
						padding: "2.5rem 0",
					}}
				>
					<div
						style={{
							maxWidth: "1280px",
							margin: "0 auto",
							padding: "0 1.5rem",
						}}
					>
						<SectionPill
							icon={<FaFire size={11} color="#f97316" />}
							text={`Trending in ${activeCountry.label}`}
						/>
						<div style={{ marginTop: "1rem" }}>
							<ProductCarousel
								items={carouselItems}
								height="380px"
								autoPlayMs={4500}
								showProgress={false}
							/>
						</div>
					</div>
				</section>
			)}

			{/* ══════════ 4. TRENDING PRODUCTS (per region) ══════════ */}
			{(trendingLoading || trendingProducts.length > 0) && (
				<section
					style={{
						borderBottom: "1px solid #1c1c1f",
						padding: "2.5rem 0",
					}}
				>
					<div
						style={{
							maxWidth: "1280px",
							margin: "0 auto",
							padding: "0 1.5rem",
						}}
					>
						<SectionPill
							icon={<FaFire size={11} color="#f97316" />}
							text={`Featured in ${activeCountry.label}`}
						/>
						{trendingLoading ? (
							<div
								style={{
									display: "grid",
									gridTemplateColumns:
										"repeat(auto-fill,minmax(200px,1fr))",
									gap: "1rem",
									marginTop: "1.25rem",
								}}
							>
								{[...Array(4)].map((_, i) => (
									<div
										key={i}
										className="animate-shimmer"
										style={{
											height: "280px",
											borderRadius: "14px",
										}}
									/>
								))}
							</div>
						) : (
							<div
								style={{
									display: "grid",
									gridTemplateColumns:
										"repeat(auto-fill,minmax(200px,1fr))",
									gap: "1rem",
									marginTop: "1.25rem",
								}}
							>
								{trendingProducts.map((p) => (
									<ProductCard key={p._id} product={p} />
								))}
							</div>
						)}
					</div>
				</section>
			)}

			{/* ══════════ 5. FILTER BAR ══════════ */}
			<section
				style={{
					borderBottom: "1px solid #1c1c1f",
					background: "rgba(0,0,0,0.12)",
					padding: "1.25rem 0",
					position: "relative",
					zIndex: 50,
				}}
			>
				<div
					style={{
						maxWidth: "1280px",
						margin: "0 auto",
						padding: "0 1.5rem",
					}}
				>
					<FilterPanel
						onFilterChange={handleFilterChange}
						selectedFilters={filters}
						showCountryFilter={isWorldwide}
					/>
				</div>
			</section>

			{/* ══════════ 5. PRODUCTS GRID + INFINITE SCROLL ══════════ */}
			<section ref={catalogRef} style={{ padding: "2.5rem 0 5rem" }}>
				<div
					style={{
						maxWidth: "1280px",
						margin: "0 auto",
						padding: "0 1.5rem",
					}}
				>
					{/* Title row */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: "1.5rem",
						}}
					>
						<div>
							<p
								style={{
									margin: "0 0 0.25rem",
									fontSize: "0.7rem",
									letterSpacing: "0.2em",
									textTransform: "uppercase",
									color: "#71717a",
								}}
							>
								Catalog
							</p>
							<h2
								style={{
									margin: 0,
									fontSize: "1.5rem",
									fontWeight: 700,
									color: "#fff",
								}}
							>
								{filters.category
									? `${filters.category} Products`
									: "All Products"}
							</h2>
						</div>
						{totalProducts > 0 && (
							<span
								style={{ fontSize: "0.8rem", color: "#71717a" }}
							>
								{products.length} / {totalProducts} items
							</span>
						)}
					</div>

					{/* Empty state — properly centered */}
					{products.length === 0 && !productsLoading ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								textAlign: "center",
								padding: "5rem 2rem",
								border: "1px dashed #3f3f46",
								borderRadius: "16px",
								gap: "1rem",
							}}
						>
							<FaBox size={48} color="#3f3f46" />
							<div>
								<h3
									style={{
										margin: "0 0 0.4rem",
										fontSize: "1.25rem",
										color: "#fff",
									}}
								>
									No products found
								</h3>
								<p
									style={{
										margin: 0,
										color: "#71717a",
										fontSize: "0.9rem",
									}}
								>
									Try adjusting your filters or switch to
									another region.
								</p>
							</div>
							<button
								onClick={() => handleFilterChange({})}
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: "0.4rem",
									padding: "0.5rem 1.25rem",
									background: "#a855f7",
									border: "none",
									borderRadius: "8px",
									color: "#fff",
									fontWeight: 600,
									cursor: "pointer",
									fontFamily: "inherit",
								}}
							>
								<FiRefreshCw size={14} /> Reset Filters
							</button>
						</div>
					) : (
						<>
							<div
								style={{
									display: "grid",
									gridTemplateColumns:
										"repeat(auto-fill,minmax(220px,1fr))",
									gap: "1.25rem",
									marginBottom: "1.5rem",
								}}
							>
								{products.map((product) => (
									<ProductCard
										key={product._id}
										product={product}
									/>
								))}
								{/* Skeleton tiles while fetching next page */}
								{productsLoading &&
									[...Array(4)].map((_, i) => (
										<div
											key={`sk-${i}`}
											className="animate-shimmer"
											style={{
												height: "340px",
												borderRadius: "14px",
											}}
										/>
									))}
							</div>

							{/* Infinite scroll sentinel */}
							{hasMore && (
								<div
									ref={sentinelRef}
									style={{
										height: "40px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{productsLoading && (
										<span
											style={{
												fontSize: "0.82rem",
												color: "#71717a",
												display: "flex",
												alignItems: "center",
												gap: "0.4rem",
											}}
										>
											<FiRefreshCw
												size={13}
												style={{
													animation:
														"spin 1s linear infinite",
												}}
											/>{" "}
											Loading more…
										</span>
									)}
								</div>
							)}

							{!hasMore && products.length > 0 && (
								<p
									style={{
										textAlign: "center",
										color: "#52525b",
										fontSize: "0.82rem",
										marginTop: "1rem",
									}}
								>
									All {totalProducts} products loaded ✓
								</p>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
};

/* ─── Helpers ─── */
const SectionPill = ({ icon, text }) => (
	<span
		style={{
			display: "inline-flex",
			alignItems: "center",
			gap: "0.45rem",
			background: "rgba(168,85,247,0.12)",
			border: "1px solid rgba(168,85,247,0.3)",
			borderRadius: "999px",
			padding: "0.25rem 0.75rem",
			fontSize: "0.7rem",
			fontWeight: 600,
			letterSpacing: "0.15em",
			textTransform: "uppercase",
			color: "#c4b5fd",
		}}
	>
		{icon} {text}
	</span>
);

const hdrBtn = (primary, mobile = false) => ({
	display: "flex",
	alignItems: "center",
	gap: "0.4rem",
	padding: mobile ? "0.6rem 0.85rem" : "0.4rem 0.85rem",
	width: mobile ? "100%" : "auto",
	justifyContent: mobile ? "center" : "flex-start",
	borderRadius: "8px",
	border: primary ? "none" : "1px solid #3f3f46",
	background: primary ? "#7c3aed" : "transparent",
	color: primary ? "#fff" : "#a1a1aa",
	fontSize: "0.8rem",
	fontWeight: primary ? 600 : 400,
	cursor: "pointer",
	whiteSpace: "nowrap",
	transition: "background 0.2s, border-color 0.2s, color 0.2s",
	fontFamily: "inherit",
});

export default Homepage;
