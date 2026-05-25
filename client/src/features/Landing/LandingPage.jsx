import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import apiClient from "../../services/apiClient";
import CountryFlag from "../../components/common/CountryFlag";
import ProductCard from "../../components/common/ProductCard";
import LoadingAnimation from "../../components/common/LoadingAnimation";
import { countries, getCountrySlug } from "../../utils/countries";
import landingGif from "../../assets/landing.gif";
import mainLogo from "../../assets/main_logo.jpeg";
import footerLogo from "../../assets/footer_logo.jpeg";
import ImmersiveHero from "./ImmersiveHero";
import AnimeBannerSlider from "../../components/ui/AnimeBannerSlider";
import ProductCarousel from "../../components/ui/ProductCarousel";
import { flattenCarouselItems } from "../../utils/carouselHelpers";
import {
	FaStar,
	FaFire,
	FaBox,
	FaArrowRight,
} from "react-icons/fa";

/* ════════════════════════════════════════
   Landing Page
   ════════════════════════════════════════ */
const LandingPage = () => {
	const navigate = useNavigate();
	const { updateCountry } = useAppContext();

	const [banners, setBanners] = useState([]);
	const [carouselItems, setCarouselItems] = useState([]);
	const [trendingProducts, setTrendingProducts] = useState([]);
	const [loadingContent, setLoadingContent] = useState(true);
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Hero image from backend
	const [heroImageUrl, setHeroImageUrl] = useState("");
	const [heroLoading, setHeroLoading] = useState(true);

	// Fetch hero image from settings
	useEffect(() => {
		const fetchHero = async () => {
			try {
				const res = await apiClient.get("/settings/landing-image");
				setHeroImageUrl(res.data?.data?.url || "");
			} catch {
				/* use fallback gif */
			} finally {
				setHeroLoading(false);
			}
		};
		fetchHero();
	}, []);

	// Fetch banners + carousels (renamed /slides)
	useEffect(() => {
		const fetchAll = async () => {
			try {
				const [slidesRes, carouselsRes] = await Promise.all([
					apiClient.get("/slides?isActive=true&country=ALL"),
					apiClient.get("/carousels?isActive=true&country=ALL"),
				]);
				setBanners(slidesRes.data?.data || []);
				setCarouselItems(
					flattenCarouselItems(carouselsRes.data?.data || []),
				);
			} catch {
				/* silent */
			} finally {
				setLoadingContent(false);
			}
		};

		const fetchProducts = async () => {
			try {
				const res = await apiClient.get(
					"/trending/products?country=Worldwide",
				);
				const products = res.data?.data?.products;
				setTrendingProducts(Array.isArray(products) ? products : []);
			} catch {
				/* silent */
			} finally {
				setLoadingProducts(false);
			}
		};

		fetchAll();
		fetchProducts();
	}, []);

	const handleCountrySelect = (country) => {
		updateCountry(country.value);
		navigate(`/country/${getCountrySlug(country.value)}`);
	};

	const bannerSlides = banners.map((b) => ({
		image: b.image,
		title: b.title,
		description: b.description,
		link: b.link,
	}));

	const bgUrl = heroImageUrl || landingGif;

	// Show full-screen loader until hero image resolved
	if (heroLoading) return <LoadingAnimation />;

	return (
		<div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white font-[family-name:var(--font-sans)]">
			{/* ── Sticky Header ── */}
			<header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
						}}
					>
						<img
							src={mainLogo}
							alt="Prophecy Hub"
							style={{
								width: "42px",
								height: "42px",
								borderRadius: "10px",
								objectFit: "cover",
								border: "1px solid rgba(168,85,247,0.4)",
								flexShrink: 0,
							}}
						/>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "1px",
							}}
						>
							<span
								style={{
									fontWeight: 800,
									fontSize: "1.05rem",
									color: "#fff",
									lineHeight: 1.2,
								}}
							>
								Prophecy Hub
							</span>
							<span
								style={{
									fontSize: "0.58rem",
									color: "#a855f7",
									letterSpacing: "0.15em",
									textTransform: "uppercase",
									lineHeight: 1.2,
									fontWeight: 600,
								}}
							>
								Anime Merchandise Hub
							</span>
						</div>
					</div>
					{/* Desktop Countries (Hidden on mobile) */}
					<div className="hidden md:flex items-center gap-5">
						{countries.map((country) => (
							<button
								key={country.value}
								onClick={() => handleCountrySelect(country)}
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: "0.25rem",
									background: "transparent",
									border: "none",
									cursor: "pointer",
									padding: "0.25rem",
								}}
								className="group"
							>
								<div className="transition-transform duration-200 group-hover:scale-110">
									<CountryFlag
										value={country.value}
										size="sm"
										mode="image"
										style={{
											borderRadius: "4px",
											boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
										}}
									/>
								</div>
								<span className="text-[0.65rem] font-bold text-zinc-400 group-hover:text-purple-400 transition-colors uppercase tracking-wider text-center">
									{country.label}
								</span>
							</button>
						))}
					</div>

					{/* Mobile Menu Toggle */}
					<div className="md:hidden">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "36px",
								height: "36px",
								borderRadius: "6px",
								border: "1px solid #3f3f46",
								background: "transparent",
								color: "#a1a1aa",
								cursor: "pointer",
								padding: 0,
							}}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								{mobileMenuOpen ? (
									<path d="M6 18L18 6M6 6l12 12" />
								) : (
									<path d="M4 6h16M4 12h16M4 18h16" />
								)}
							</svg>
						</button>
					</div>
				</div>

				{/* Mobile Expanded Menu */}
				{mobileMenuOpen && (
					<div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-2">
						{countries.map((country) => (
							<button
								key={country.value}
								onClick={() => {
									handleCountrySelect(country);
									setMobileMenuOpen(false);
								}}
								className="flex items-center gap-3 w-full p-2 bg-transparent border-none text-left cursor-pointer rounded-lg transition-colors group hover:bg-zinc-900/50"
							>
								<CountryFlag
									value={country.value}
									size="sm"
									mode="image"
									style={{ borderRadius: "4px" }}
								/>
								<span className="text-sm font-semibold text-zinc-300 group-hover:text-purple-400 transition-colors">
									{country.label}
								</span>
							</button>
						))}
					</div>
				)}
			</header>

			<ImmersiveHero
				bgUrl={bgUrl}
				mainLogo={mainLogo}
				onShopByRegion={() =>
					document
						.getElementById("country-section")
						?.scrollIntoView({ behavior: "smooth" })
				}
				onFeaturedDeals={() =>
					document
						.getElementById("banners-section")
						?.scrollIntoView({ behavior: "smooth" })
				}
			/>

			{/* ── 2. BANNERS ── */}
			<section id="banners-section" className="bg-zinc-950">
				{loadingContent ? (
					<div
						className="animate-shimmer"
						style={{ width: "100%", height: "420px" }}
					/>
				) : bannerSlides.length > 0 ? (
					<AnimeBannerSlider items={bannerSlides} height="420px" />
				) : null}
			</section>

			{/* 2b. TRENDING CAROUSEL (product-picker) */}
			{!loadingContent && carouselItems.length > 0 && (
				<section className="border-b border-zinc-900 bg-zinc-950 py-10 sm:py-12">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: "0.45rem",
								background: "rgba(249,115,22,0.1)",
								border: "1px solid rgba(249,115,22,0.3)",
								borderRadius: "999px",
								padding: "0.3rem 0.85rem",
								fontSize: "0.7rem",
								fontWeight: 700,
								letterSpacing: "0.15em",
								textTransform: "uppercase",
								color: "#fb923c",
								marginBottom: "1rem",
							}}
						>
							<FaFire size={11} color="#f97316" /> Trending
							Worldwide
						</div>
						<ProductCarousel
							items={carouselItems}
							height="380px"
							autoPlayMs={4500}
							showProgress={false}
						/>
					</div>
				</section>
			)}

			{/* ── 3. TRENDING PRODUCTS ── */}
			<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: "1.5rem",
					}}
				>
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "0.45rem",
							background: "rgba(168,85,247,0.12)",
							border: "1px solid rgba(168,85,247,0.3)",
							borderRadius: "999px",
							padding: "0.3rem 0.85rem",
							fontSize: "0.7rem",
							fontWeight: 600,
							letterSpacing: "0.15em",
							textTransform: "uppercase",
							color: "#c4b5fd",
						}}
					>
						<FaFire size={11} color="#f97316" /> Featured Worldwide
					</span>
					<button
						onClick={() =>
							handleCountrySelect(
								countries.find(
									(c) => c.value === "Worldwide",
								) || countries[0],
							)
						}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.35rem",
							background: "transparent",
							border: "none",
							color: "#a855f7",
							fontSize: "0.82rem",
							cursor: "pointer",
							fontFamily: "inherit",
						}}
					>
						View All <FaArrowRight size={11} />
					</button>
				</div>

				{loadingProducts ? (
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								"repeat(auto-fill,minmax(200px,1fr))",
							gap: "1rem",
						}}
					>
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className="animate-shimmer"
								style={{
									height: "300px",
									borderRadius: "14px",
								}}
							/>
						))}
					</div>
				) : trendingProducts.length > 0 ? (
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								"repeat(auto-fill,minmax(200px,1fr))",
							gap: "1rem",
						}}
					>
						{trendingProducts.map((p) => (
							<ProductCard key={p._id} product={p} />
						))}
					</div>
				) : (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							padding: "3rem 2rem",
							border: "1px dashed #27272a",
							borderRadius: "16px",
							gap: "0.75rem",
							color: "#52525b",
						}}
					>
						<FaBox size={36} color="#3f3f46" />
						<p style={{ margin: 0, fontSize: "0.9rem" }}>
							No trending products yet — curate them in Admin →
							Trending Products.
						</p>
					</div>
				)}
			</section>

			{/* ── ABOUT SECTION ── */}
			<section className="border-y border-zinc-900 bg-gradient-to-b from-violet-950/20 to-zinc-950 py-16 sm:py-20">
				<div className="about-grid mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.6fr] md:gap-14 lg:px-8">
					<style>{`@media(max-width:768px){.about-grid{text-align:center;}.about-logo{align-items:center!important;margin:0 auto!important;}}`}</style>
					{/* Left: Logo */}
					<div
						className="about-logo"
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							gap: "1.25rem",
						}}
					>
						<img
							src={footerLogo}
							alt="Prophecy Hub"
							style={{
								width: "100%",
								maxWidth: "220px",
								borderRadius: "20px",
								objectFit: "cover",
								border: "1px solid rgba(168,85,247,0.3)",
								boxShadow: "0 8px 40px rgba(168,85,247,0.2)",
							}}
						/>
						<div>
							<p
								style={{
									margin: 0,
									fontSize: "1.1rem",
									fontWeight: 800,
									color: "#fff",
								}}
							>
								Prophecy Hub
							</p>
							<p
								style={{
									margin: "2px 0 0",
									fontSize: "0.68rem",
									color: "#a855f7",
									letterSpacing: "0.18em",
									textTransform: "uppercase",
									fontWeight: 600,
								}}
							>
								Anime Merchandise Hub
							</p>
						</div>
					</div>
					{/* Right: Text */}
					<div>
						<p
							style={{
								fontSize: "0.65rem",
								letterSpacing: "0.2em",
								textTransform: "uppercase",
								color: "#a855f7",
								margin: "0 0 0.6rem",
								fontWeight: 600,
							}}
						>
							✦ About Prophecy Hub
						</p>
						<h2
							style={{
								fontSize: "clamp(1.5rem,3.5vw,2.1rem)",
								fontWeight: 800,
								color: "#fff",
								margin: "0 0 1.25rem",
								lineHeight: 1.25,
							}}
						>
							Enter The World Of
							<br />
							Anime Merchandise
						</h2>
						<p
							style={{
								color: "rgba(255,255,255,0.68)",
								lineHeight: 1.85,
								fontSize: "0.92rem",
								marginBottom: "1rem",
							}}
						>
							Prophecy Hub is a{" "}
							<strong style={{ color: "#c4b5fd" }}>
								curated marketplace directory
							</strong>{" "}
							for anime fans worldwide — bringing together the
							best merch from verified stores across the globe.
							From legendary classics to the newest trending
							series, explore figures, clothing, accessories,
							posters, and collectibles from Attack on Titan, JJK,
							Demon Slayer, Solo Leveling, One Piece, Naruto, and
							more.
						</p>
						<p
							style={{
								color: "rgba(255,255,255,0.45)",
								lineHeight: 1.85,
								fontSize: "0.88rem",
								marginBottom: "1.75rem",
							}}
						>
							Every product is selected from{" "}
							<strong style={{ color: "#c4b5fd" }}>
								verified stores only
							</strong>{" "}
							— ensuring trust, quality, and authenticity. Browse
							by anime, category, or store.
						</p>
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: "0.6rem",
							}}
						>
							{[
								"🔮 Dark Prophecy Aesthetic",
								"🛒 Clean Modern Browsing",
								"⚡ Hype Fandom Energy",
								"💎 Premium Vibes",
							].map((tag) => (
								<span
									key={tag}
									style={{
										padding: "0.35rem 0.85rem",
										borderRadius: "999px",
										border: "1px solid rgba(168,85,247,0.3)",
										background: "rgba(168,85,247,0.08)",
										fontSize: "0.75rem",
										color: "#c4b5fd",
										fontWeight: 500,
									}}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── 4. COUNTRY SELECTION ── */}
			<section
				id="country-section"
				className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8"
			>
				<div className="mb-10">
					<p
						style={{
							fontSize: "0.7rem",
							letterSpacing: "0.2em",
							textTransform: "uppercase",
							color: "#71717a",
							margin: "0 0 0.5rem",
						}}
					>
						Step 2
					</p>
					<h2
						style={{
							fontSize: "clamp(1.5rem,4vw,2rem)",
							fontWeight: 800,
							margin: "0 0 0.5rem",
							color: "#fff",
						}}
					>
						Choose Your Country
					</h2>
					<p
						style={{
							margin: 0,
							color: "#71717a",
							fontSize: "0.9rem",
						}}
					>
						Browse products tailored to your region, currency, and
						local stores.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{countries.map((country) => (
						<CountryCard
							key={country.value}
							country={country}
							onClick={() => handleCountrySelect(country)}
						/>
					))}
				</div>
			</section>
		</div>
	);
};

/* ─── Country Card ─── */
const CountryCard = ({ country, onClick }) => {
	const [hovered, setHovered] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "1rem",
				padding: "1.25rem 1.5rem",
				borderRadius: "16px",
				border: `1px solid ${hovered ? "rgba(168,85,247,0.55)" : "#27272a"}`,
				background: hovered
					? "linear-gradient(135deg,rgba(168,85,247,0.1) 0%,rgba(9,9,11,0.9) 100%)"
					: "rgba(24,24,27,0.6)",
				cursor: "pointer",
				textAlign: "left",
				transition:
					"border-color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s",
				transform: hovered ? "translateY(-2px)" : "translateY(0)",
				boxShadow: hovered
					? "0 8px 32px rgba(168,85,247,0.15)"
					: "none",
				fontFamily: "inherit",
				width: "100%",
			}}
		>
			<CountryFlag
				value={country.value}
				size="lg"
				mode="image"
				style={{
					borderRadius: "6px",
					boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
					flexShrink: 0,
				}}
			/>
			<div style={{ flex: 1, minWidth: 0 }}>
				<p
					style={{
						margin: 0,
						fontWeight: 700,
						fontSize: "1rem",
						color: hovered ? "#e9d5ff" : "#fff",
						transition: "color 0.2s",
					}}
				>
					{country.label}
				</p>
				<p
					style={{
						margin: "0.2rem 0 0",
						fontSize: "0.78rem",
						color: "#71717a",
					}}
				>
					{country.description}
				</p>
				<span
					style={{
						display: "inline-block",
						marginTop: "0.4rem",
						padding: "0.15rem 0.5rem",
						background: "rgba(168,85,247,0.12)",
						border: "1px solid rgba(168,85,247,0.2)",
						borderRadius: "6px",
						fontSize: "0.7rem",
						color: "#c4b5fd",
						fontWeight: 600,
					}}
				>
					{country.currency}
				</span>
			</div>
			<span
				style={{
					color: hovered ? "#a855f7" : "#52525b",
					transition: "color 0.2s, transform 0.2s",
					transform: hovered ? "translateX(4px)" : "translateX(0)",
					flexShrink: 0,
				}}
			>
				<FaArrowRight size={14} />
			</span>
		</button>
	);
};

export default LandingPage;
