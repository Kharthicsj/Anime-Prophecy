import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import MainHeader from "../../components/common/MainHeader";
import { StarIcon } from "../../components/common/Icons";
import ProductCard from "../../components/common/ProductCard";
import LoadingAnimation from "../../components/common/LoadingAnimation";

// Currency symbol lookup map
const CURRENCY_SYMBOLS = {
	USD: "$", EUR: "€", GBP: "£", JPY: "¥", INR: "₹", KRW: "₩",
	CNY: "¥", AUD: "A$", CAD: "C$", CHF: "Fr", SEK: "kr", NOK: "kr",
	DKK: "kr", NZD: "NZ$", SGD: "S$", HKD: "HK$", MXN: "$", BRL: "R$",
	RUB: "₽", ZAR: "R", TRY: "₺", AED: "د.إ", SAR: "﷼", QAR: "﷼",
	KWD: "د.ك", BHD: ".د.ب", OMR: "﷼", JOD: "JD", EGP: "£", PKR: "₨",
	BDT: "৳", LKR: "₨", NPR: "₨", MMK: "K", THB: "฿", VND: "₫",
	IDR: "Rp", MYR: "RM", PHP: "₱", TWD: "NT$", HUF: "Ft", PLN: "zł",
	CZK: "Kč", RON: "lei", BGN: "лв", HRK: "kn", ISK: "kr", UAH: "₴",
	ILS: "₪", NGN: "₦", KES: "KSh", GHS: "₵", TZS: "TSh", UGX: "USh",
	MAD: "MAD", TND: "DT", KZT: "₸", AZN: "₼", GEL: "₾", AMD: "֏",
	MNT: "₮", KHR: "៛", LAK: "₭", PEN: "S/.", COP: "$", ARS: "$",
	CLP: "$", UYU: "$U", BOB: "Bs.", GTQ: "Q", CRC: "₡", PYG: "Gs",
	TTD: "TT$", JMD: "J$", DOP: "RD$", HNL: "L", NIO: "C$",
};

const ProductDisplayPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Related Products State
	const [relatedProducts, setRelatedProducts] = useState([]);
	const [relatedPage, setRelatedPage] = useState(1);
	const [hasMoreRelated, setHasMoreRelated] = useState(true);
	const [loadingRelated, setLoadingRelated] = useState(false);
	const [relatedSearchType, setRelatedSearchType] = useState(null);

	// Unified media carousel index
	const [mediaIndex, setMediaIndex] = useState(0);

	// Lightbox (enlarged image view)
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	// Zoom state (for images only)
	const [zoomStyle, setZoomStyle] = useState({ display: "none", backgroundImage: "", backgroundPosition: "0% 0%" });
	const imageRef = useRef(null);
	const thumbsRef = useRef(null);
	const observerRef = useRef(null);

	const fetchProductData = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await apiClient.get(`/products/${id}`);
			if (res.data.success) {
				const p = res.data.data.product;
				setProduct(p);
				// Start on the main image index
				const mainIdx = (p.images || []).findIndex(img => img.isMain);
				setMediaIndex(mainIdx > 0 ? mainIdx : 0);
			}
		} catch (err) {
			console.error(err);
			setError("Failed to load product details.");
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchProductData();
		window.scrollTo(0, 0);
	}, [fetchProductData]);

	// Fetch Related Products Logic
	const fetchRelated = useCallback(async (page, type) => {
		if (!product || loadingRelated || !hasMoreRelated) return;
		setLoadingRelated(true);
		try {
			const productCountry = product.countries?.includes('Worldwide')
				? 'Worldwide'
				: (product.countries?.[0] || 'Worldwide');
			const limit = 15;
			let query = '';
			let currentType = type;
			const executeFetch = async (q) => {
				// fetch limit + 1 so filtering out the current product still yields limit results
				const res = await apiClient.get(`/products?${q}&sort=-views&country=${encodeURIComponent(productCountry)}&limit=${limit + 1}&page=${page}`);
				return res.data.success ? res.data.data.products : [];
			};

			let fetched = [];
			let filtered = [];

			const tryFetch = async (queryName, q) => {
				const res = await executeFetch(q);
				const validProducts = res.filter(p => p._id !== product._id);
				if (validProducts.length > 0) {
					fetched = res;
					filtered = validProducts;
					currentType = queryName;
					return true;
				}
				return false;
			};

			if (page === 1) {
				let success = false;
				
				// Level 1: exact match
				let queryParts = [];
				if (product.animeTag) queryParts.push(`animeTag=${encodeURIComponent(product.animeTag)}`);
				if (product.category) queryParts.push(`category=${encodeURIComponent(product.category)}`);
				if (product.subCategory) queryParts.push(`subCategory=${encodeURIComponent(product.subCategory)}`);
				
				if (queryParts.length > 0) {
					success = await tryFetch('exact', queryParts.join('&'));
				}

				// Level 2: anime + category
				if (!success && product.animeTag && product.category) {
					success = await tryFetch('anime_category', `animeTag=${encodeURIComponent(product.animeTag)}&category=${encodeURIComponent(product.category)}`);
				}

				// Level 3: anime
				if (!success && product.animeTag) {
					success = await tryFetch('anime', `animeTag=${encodeURIComponent(product.animeTag)}`);
				}

				// Level 4: category
				if (!success && product.category) {
					success = await tryFetch('category', `category=${encodeURIComponent(product.category)}`);
				}

				// Level 5: all
				if (!success) {
					await tryFetch('all', '');
				}

				setRelatedSearchType(currentType);
			} else {
				if (currentType === 'exact') {
					let queryParts = [];
					if (product.animeTag) queryParts.push(`animeTag=${encodeURIComponent(product.animeTag)}`);
					if (product.category) queryParts.push(`category=${encodeURIComponent(product.category)}`);
					if (product.subCategory) queryParts.push(`subCategory=${encodeURIComponent(product.subCategory)}`);
					query = queryParts.join('&');
				}
				else if (currentType === 'anime_category') query = `animeTag=${encodeURIComponent(product.animeTag)}&category=${encodeURIComponent(product.category)}`;
				else if (currentType === 'anime') query = `animeTag=${encodeURIComponent(product.animeTag)}`;
				else if (currentType === 'category') query = `category=${encodeURIComponent(product.category)}`;
				
				fetched = await executeFetch(query);
				filtered = fetched.filter(p => p._id !== product._id);
			}

			// We fetched (limit + 1) to account for filtering, so if fetched.length === limit + 1, we likely have more.
			// Or if filtered.length >= limit
			setHasMoreRelated(fetched.length > limit || filtered.length >= limit);
			
			if (page === 1) {
				setRelatedProducts(filtered.slice(0, limit));
			} else {
				setRelatedProducts(prev => {
					const newProducts = filtered.filter(f => !prev.find(p => p._id === f._id));
					return [...prev, ...newProducts].slice(0, prev.length + limit);
				});
			}
		} catch (err) {
			console.error("Failed to load related products", err);
		} finally {
			setLoadingRelated(false);
		}
	}, [product, loadingRelated, hasMoreRelated]);

	useEffect(() => {
		if (product && relatedProducts.length === 0) {
			setRelatedPage(1);
			setHasMoreRelated(true);
			fetchRelated(1, null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [product]);

	useEffect(() => {
		const el = observerRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMoreRelated && !loadingRelated && product) {
					const nextPage = relatedPage + 1;
					setRelatedPage(nextPage);
					fetchRelated(nextPage, relatedSearchType);
				}
			},
			{ rootMargin: "200px" }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMoreRelated, loadingRelated, product, relatedPage, relatedSearchType, fetchRelated]);

	// Scroll active thumbnail into view
	useEffect(() => {
		if (!thumbsRef.current) return;
		const activeThumb = thumbsRef.current.querySelector(`[data-thumb="${mediaIndex}"]`);
		if (activeThumb) {
			activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		}
	}, [mediaIndex]);

	// Support mouse wheel scrolling for the thumbnail strip on PC
	useEffect(() => {
		const el = thumbsRef.current;
		if (!el) return;
		const handleWheel = (e) => {
			if (e.deltaY !== 0) {
				e.preventDefault();
				el.scrollLeft += e.deltaY;
			}
		};
		el.addEventListener('wheel', handleWheel, { passive: false });
		return () => el.removeEventListener('wheel', handleWheel);
	}, [product]);

	const handleMouseMove = (e) => {
		if (!imageRef.current) return;
		const { left, top, width, height } = imageRef.current.getBoundingClientRect();
		const x = ((e.clientX - left) / width) * 100;
		const y = ((e.clientY - top) / height) * 100;
		const currentItem = mediaItems[mediaIndex];
		if (!currentItem || currentItem.type !== 'image') return;
		setZoomStyle({
			display: "block",
			backgroundImage: `url(${currentItem.url})`,
			backgroundPosition: `${x}% ${y}%`,
			backgroundSize: "200%",
		});
	};

	const handleMouseLeave = () => setZoomStyle({ display: "none" });

	// Keyboard navigation for lightbox
	useEffect(() => {
		if (!lightboxOpen) return;
		const numImages = product?.images?.length || 0;
		const handler = (e) => {
			if (e.key === 'ArrowLeft') setLightboxIndex(i => Math.max(0, i - 1));
			else if (e.key === 'ArrowRight') setLightboxIndex(i => Math.min(numImages - 1, i + 1));
			else if (e.key === 'Escape') setLightboxOpen(false);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [lightboxOpen, product]);

	const handleBuyNow = async () => {
		if (product.affiliateLink) {
			window.open(product.affiliateLink, "_blank", "noopener,noreferrer");
		}
		try {
			await apiClient.post(`/products/${product._id}/buy-now-click`);
		} catch (err) {
			console.error("Failed to track click:", err);
		}
	};

	if (loading) return <LoadingAnimation />;

	if (error || !product) {
		return (
			<div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">{error || "Product not found"}</h2>
					<button onClick={() => navigate(-1)} className="text-purple-400 hover:underline">Go Back</button>
				</div>
			</div>
		);
	}

	// ── Build unified media array: images first, then videos ──────────────────
	const images = product.images || [];
	const videos = product.videos || [];
	const mediaItems = [
		...images.map(img => ({ type: 'image', url: img.url, publicId: img.publicId })),
		...videos.map(vid => ({ type: 'video', url: vid.url, publicId: vid.publicId })),
	];

	const totalMedia = mediaItems.length;
	const currentItem = mediaItems[mediaIndex] || mediaItems[0];
	const coverImage = images[0]?.url || "placeholder.jpg";

	const goPrev = () => setMediaIndex(i => (i - 1 + totalMedia) % totalMedia);
	const goNext = () => setMediaIndex(i => (i + 1) % totalMedia);

	// ── Lightbox helpers (placed here so mediaItems is available) ─────────────────
	const lightboxImages = mediaItems.filter(m => m.type === 'image');
	const openLightbox = (idx) => {
		const imgItems = mediaItems.filter(m => m.type === 'image');
		const remapped = imgItems.findIndex((_, i) => mediaItems.indexOf(imgItems[i]) === idx);
		setLightboxIndex(remapped >= 0 ? remapped : 0);
		setLightboxOpen(true);
	};
	const closeLightbox = () => setLightboxOpen(false);
	const lightboxPrev = () => setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length);
	const lightboxNext = () => setLightboxIndex(i => (i + 1) % lightboxImages.length);

	return (
		<div className="min-h-screen bg-[#050505] pb-16 relative overflow-hidden font-sans">
			<style>{`
				@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
				.scrollbar-none::-webkit-scrollbar { display: none; }
				.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
			`}</style>

			{/* Ambient Background */}
			<div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden z-0">
				<div className="absolute top-[-20%] left-[-10%] w-[70%] h-[120%] opacity-20 blur-[120px] rounded-full mix-blend-screen" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }} />
				<div className="absolute top-[10%] right-[-10%] w-[50%] h-[100%] opacity-10 blur-[100px] rounded-full mix-blend-screen" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
			</div>

			<div className="relative z-10"><MainHeader hideSearch /></div>

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

				{/* Back */}
				<button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-10 font-medium group">
					<svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back
				</button>

				{/* ── Main Product Section ── */}
				<div className="mb-24">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

						{/* Left: Unified Media Carousel */}
						<div className="lg:col-span-5 relative">

							{/* ── Main Display Area ── */}
							<div className="relative">
								{/* Main media container */}
								<div
									className="relative w-full bg-white/5 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/50 flex items-center justify-center"
									style={{ minHeight: '340px' }}
									onMouseMove={currentItem?.type === 'image' ? handleMouseMove : undefined}
									onMouseLeave={currentItem?.type === 'image' ? handleMouseLeave : undefined}
									ref={imageRef}
								>
									{/* ── Image ── */}
									{currentItem?.type === 'image' && (
										<img
											key={currentItem.url}
											src={currentItem.url}
											alt={product.title}
											className="w-full h-auto max-h-[580px] min-h-[200px] object-contain object-center transition-opacity duration-300"
											style={{ cursor: 'zoom-in' }}
											onClick={() => openLightbox(mediaIndex)}
										/>
									)}

									{/* ── Video ── */}
									{currentItem?.type === 'video' && (
										<video
											key={currentItem.url}
											controls
											preload="metadata"
											poster={coverImage}
											className="w-full max-h-[580px] object-contain bg-black"
										>
											<source src={currentItem.url} type="video/mp4" />
											Your browser does not support the video tag.
										</video>
									)}

									{/* Left Arrow */}
									{totalMedia > 1 && (
										<button
											onClick={goPrev}
											className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 hover:scale-110 transition-all shadow-xl"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
										</button>
									)}

									{/* Right Arrow */}
									{totalMedia > 1 && (
										<button
											onClick={goNext}
											className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 hover:scale-110 transition-all shadow-xl"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
										</button>
									)}

									{/* Floating Badges */}
									<div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
										<span className="bg-white/90 backdrop-blur-md text-zinc-950 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded shadow-xl border border-black/10">
											{product.animeTag}
										</span>
										{!product.inStock && (
											<span className="bg-red-500/80 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded shadow-lg">
												Out of Stock
											</span>
										)}
									</div>

									{/* Video badge */}
									{currentItem?.type === 'video' && (
										<div className="absolute top-4 right-4 pointer-events-none">
											<span className="flex items-center gap-1 bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-lg">
												<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
												VIDEO
											</span>
										</div>
									)}

									{/* Counter */}
									{totalMedia > 1 && (
										<div className="absolute bottom-3 right-3 pointer-events-none">
											<span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
												{mediaIndex + 1} / {totalMedia}
											</span>
										</div>
									)}
								</div>

								{/* ── Thumbnail Strip (Amazon/Flipkart style) ── */}
								{totalMedia > 1 && (
									<div
										ref={thumbsRef}
										className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none"
									>
										{mediaItems.map((item, i) => (
											<button
												key={i}
												data-thumb={i}
												onClick={() => setMediaIndex(i)}
												className={`relative flex-shrink-0 w-[68px] h-[68px] rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === mediaIndex
														? 'border-purple-500 shadow-md shadow-purple-500/30 scale-105'
														: 'border-zinc-700 opacity-60 hover:opacity-100 hover:border-zinc-400'
													}`}
											>
												{item.type === 'image' ? (
													<img src={item.url} alt="" className="w-full h-full object-cover" />
												) : (
													/* Video thumbnail — dark with a play icon */
													<div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center gap-1">
														<div className="w-7 h-7 rounded-full bg-purple-600/90 flex items-center justify-center">
															<svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
														</div>
														<span className="text-zinc-400 text-[9px] font-semibold uppercase tracking-wider">Video</span>
													</div>
												)}

												{/* Active indicator line at bottom */}
												{i === mediaIndex && (
													<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
												)}
											</button>
										))}
									</div>
								)}
							</div>

							{/* ── Zoom Lens (image only) ── */}
							{currentItem?.type === 'image' && (
								<div
									className="hidden lg:block absolute top-0 -right-[calc(140%+2rem)] w-[140%] bg-zinc-950 border border-zinc-800 rounded-xl pointer-events-none z-50 transition-opacity duration-300 overflow-hidden"
									style={{
										...zoomStyle,
										height: imageRef.current?.offsetHeight || '100%',
										opacity: zoomStyle.display === "none" ? 0 : 1,
										display: "block",
										boxShadow: "0 25px 50px -12px rgba(0,0,0,0.75)",
									}}
								/>
							)}

							{/* ── Affiliate Disclaimer ── */}
							<div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-950/20 backdrop-blur-sm overflow-hidden">
								<div className="flex gap-3 p-4">
									<div className="flex-shrink-0 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 self-stretch" />
									<div className="flex flex-col gap-1.5 min-w-0">
										<div className="flex items-center gap-2">
											<svg className="w-4 h-4 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Affiliate Disclosure</span>
										</div>
										<p className="text-zinc-400 text-[11.5px] leading-relaxed capitalize">
											⚠️ We may earn a commission from affiliate links at no extra cost to you. Product availability, prices, discounts, and promotions can change without notice. Broken links, sold-out items, or region restrictions may occur. Please explore other products on the retailer&apos;s website if the featured item is unavailable.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Right: Product Details */}
						<div className="lg:col-span-7 flex flex-col h-full py-2 relative z-10">

							<div className="flex items-center gap-3 mb-4">
								<span className="text-purple-400 text-sm font-bold tracking-widest uppercase">{product.store}</span>
								<span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
								<span className="text-zinc-400 text-sm font-medium">
									{product.category}{product.subCategory ? ` › ${product.subCategory}` : ''}
								</span>
							</div>

							<h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
								{product.title}
							</h1>

							<div className="flex items-center gap-4 mb-8">
								{product.rating > 0 && (
									<div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
										<StarIcon className="h-5 w-5 text-yellow-400" />
										<span className="font-bold text-white text-lg">{product.rating.toFixed(1)}</span>
									</div>
								)}
								<div className="text-zinc-500 text-sm flex items-center gap-2">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
									<span>{product.views || 0} Views</span>
								</div>
							</div>

							<div className="mb-10 p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
								<span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
									{product.currency}{" "}
									{CURRENCY_SYMBOLS[product.currency] && (
										<span className="mr-1.5">{CURRENCY_SYMBOLS[product.currency]}</span>
									)}{product.price.toLocaleString(product.currency === 'INR' ? 'en-IN' : 'en-US')}
								</span>
								<p className="text-zinc-500 text-sm mt-3 font-medium">
									Prices are dynamically updated from <span className="text-zinc-300">{product.store}</span>. Final price may vary at checkout.
								</p>
							</div>

							<div className="mt-auto pb-8 border-b border-zinc-800 mb-8">
								<button
									onClick={handleBuyNow}
									className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-5 bg-white text-black font-black text-lg rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
									<span className="relative z-10 group-hover:text-white transition-colors duration-300">Purchase on {product.store}</span>
									<svg className="w-5 h-5 relative z-10 group-hover:text-white transition-colors duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
									</svg>
								</button>
								<div className="flex items-center gap-2 mt-4 justify-center sm:justify-start text-zinc-500 text-xs font-medium">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									Affiliate link. You will be securely redirected.
								</div>
							</div>

							<div className="prose prose-invert max-w-none">
								<h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wider text-sm">Product Description</h3>
								<p className="text-zinc-400 leading-relaxed whitespace-pre-line text-[15px]">
									{product.description || "Explore this premium anime merchandise. High quality materials and accurate designs make this a perfect addition to your collection."}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Related Products */}
				{relatedProducts.length > 0 && (
					<div className="mt-32 pt-16 border-t border-zinc-800/50 relative">
						<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
						<div className="flex items-center justify-between mb-10">
							<h2 className="text-3xl font-black text-white tracking-tight">More related products</h2>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{relatedProducts.map((prod) => (
								<ProductCard key={prod._id} product={prod} />
							))}
						</div>
						<div ref={observerRef} className="mt-8 flex w-full items-center justify-center p-4">
							{loadingRelated && (
								<div className="flex flex-col items-center gap-3">
									<div style={{ width: "28px", height: "28px", border: "3px solid rgba(168,85,247,0.2)", borderTop: "3px solid #a855f7", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
									<span className="text-sm text-zinc-500 font-medium">Loading more products...</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* ══════════ LIGHTBOX OVERLAY ══════════ */}
			{lightboxOpen && lightboxImages.length > 0 && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 9999,
						background: 'rgba(0,0,0,0.94)',
						backdropFilter: 'blur(8px)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						animation: 'fadeInLightbox 0.2s ease',
					}}
					onClick={closeLightbox}
				>
					<style>{`
					@keyframes fadeInLightbox { from { opacity: 0; } to { opacity: 1; } }
					@keyframes slideInImg { from { transform: scale(0.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
				`}</style>

					{/* Close button */}
					<button
						onClick={closeLightbox}
						style={{
							position: 'absolute',
							top: '1.25rem',
							right: '1.25rem',
							width: '2.5rem',
							height: '2.5rem',
							borderRadius: '50%',
							border: '1px solid rgba(255,255,255,0.15)',
							background: 'rgba(0,0,0,0.6)',
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							fontSize: '1.2rem',
							zIndex: 10001,
							backdropFilter: 'blur(4px)',
							transition: 'background 0.2s',
						}}
						onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.7)'}
						onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
					>
						✕
					</button>

					{/* Image counter */}
					<div
						style={{
							position: 'absolute',
							top: '1.25rem',
							left: '50%',
							transform: 'translateX(-50%)',
							background: 'rgba(0,0,0,0.55)',
							border: '1px solid rgba(255,255,255,0.1)',
							borderRadius: '999px',
							padding: '0.3rem 1rem',
							color: '#e4e4e7',
							fontSize: '0.8rem',
							fontWeight: 600,
							backdropFilter: 'blur(4px)',
							zIndex: 10001,
							letterSpacing: '0.05em',
						}}
					>
						{lightboxIndex + 1} / {lightboxImages.length}
					</div>

					{/* Left arrow */}
					{lightboxImages.length > 1 && (
						<button
							onClick={e => { e.stopPropagation(); lightboxPrev(); }}
							style={{
								position: 'absolute',
								left: '1.25rem',
								top: '50%',
								transform: 'translateY(-50%)',
								width: '3.5rem',
								height: '3.5rem',
								borderRadius: '50%',
								border: 'none',
								background: '#fff',
								color: '#000',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								zIndex: 10001,
								transition: 'all 0.2s',
								boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
							}}
							onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
							onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
						>
							<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
					)}

					{/* Right arrow */}
					{lightboxImages.length > 1 && (
						<button
							onClick={e => { e.stopPropagation(); lightboxNext(); }}
							style={{
								position: 'absolute',
								right: '1.25rem',
								top: '50%',
								transform: 'translateY(-50%)',
								width: '3.5rem',
								height: '3.5rem',
								borderRadius: '50%',
								border: 'none',
								background: '#fff',
								color: '#000',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								zIndex: 10001,
								transition: 'all 0.2s',
								boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
							}}
							onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
							onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
						>
							<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
							</svg>
						</button>
					)}

					{/* Main enlarged image */}
					<div
						onClick={e => e.stopPropagation()}
						style={{
							maxWidth: 'min(90vw, 960px)',
							maxHeight: '85vh',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '1rem',
						}}
					>
						<img
							key={lightboxIndex}
							src={lightboxImages[lightboxIndex]?.url}
							alt={`${product.title} — image ${lightboxIndex + 1}`}
							style={{
								maxWidth: '100%',
								maxHeight: '78vh',
								objectFit: 'contain',
								borderRadius: '12px',
								boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
								animation: 'slideInImg 0.22s ease',
								userSelect: 'none',
							}}
						/>

						{/* Thumbnail strip inside lightbox */}
						{lightboxImages.length > 1 && (
							<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
								{lightboxImages.map((img, i) => (
									<button
										key={i}
										onClick={() => setLightboxIndex(i)}
										style={{
											width: '52px',
											height: '52px',
											borderRadius: '8px',
											overflow: 'hidden',
											border: i === lightboxIndex ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.1)',
											opacity: i === lightboxIndex ? 1 : 0.55,
											cursor: 'pointer',
											padding: 0,
											background: 'none',
											transition: 'all 0.18s',
											flexShrink: 0,
										}}
										onMouseEnter={e => { if (i !== lightboxIndex) e.currentTarget.style.opacity = '0.85'; }}
										onMouseLeave={e => { if (i !== lightboxIndex) e.currentTarget.style.opacity = '0.55'; }}
									>
										<img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									</button>
								))}
							</div>
						)}

						{/* Keyboard hint */}
						<p style={{ color: '#52525b', fontSize: '0.72rem', margin: 0, textAlign: 'center' }}>
							← → to navigate &nbsp;·&nbsp; Esc to close &nbsp;·&nbsp; Click outside to dismiss
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProductDisplayPage;
