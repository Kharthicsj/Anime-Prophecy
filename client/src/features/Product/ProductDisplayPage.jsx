import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import MainHeader from "../../components/common/MainHeader";
import { StarIcon } from "../../components/common/Icons";
import ProductCard from "../../components/common/ProductCard";
import LoadingAnimation from "../../components/common/LoadingAnimation";

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
	const [relatedSearchType, setRelatedSearchType] = useState(null); // 'category', 'anime', 'all'
	
	// Zoom state
	const [zoomStyle, setZoomStyle] = useState({ display: "none", backgroundImage: "", backgroundPosition: "0% 0%" });
	const imageRef = useRef(null);
	const observerRef = useRef(null);

	const fetchProductData = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			// Fetch the main product
			const res = await apiClient.get(`/products/${id}`);
			if (res.data.success) {
				setProduct(res.data.data.product);
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
			const productCountry = product.countries?.[0] || 'Worldwide';
			const limit = 15;
			let query = '';
			
			// Use the decided fallback type, or determine it on first page
			let currentType = type;

			const executeFetch = async (q) => {
				const res = await apiClient.get(`/products?${q}&sort=-views&country=${encodeURIComponent(productCountry)}&limit=${limit}&page=${page}`);
				return res.data.success ? res.data.data.products : [];
			};

			let fetched = [];

			if (page === 1) {
				// Initial fetch - figure out what gets results
				fetched = await executeFetch(`category=${encodeURIComponent(product.category)}`);
				currentType = 'category';

				if (fetched.length === 0 && product.animeTag) {
					fetched = await executeFetch(`animeTag=${encodeURIComponent(product.animeTag)}`);
					currentType = 'anime';
				}

				if (fetched.length === 0) {
					fetched = await executeFetch('');
					currentType = 'all';
				}
				setRelatedSearchType(currentType);
			} else {
				// Subsequent pages - use the established search type
				if (currentType === 'category') query = `category=${encodeURIComponent(product.category)}`;
				else if (currentType === 'anime') query = `animeTag=${encodeURIComponent(product.animeTag)}`;
				
				fetched = await executeFetch(query);
			}

			// Filter out the current product itself
			const filtered = fetched.filter(p => p._id !== product._id);

			setHasMoreRelated(fetched.length === limit);

			if (page === 1) {
				setRelatedProducts(filtered);
			} else {
				setRelatedProducts(prev => {
					// Deduplicate just in case
					const newProducts = filtered.filter(f => !prev.find(p => p._id === f._id));
					return [...prev, ...newProducts];
				});
			}
		} catch (err) {
			console.error("Failed to load related products", err);
		} finally {
			setLoadingRelated(false);
		}
	}, [product, loadingRelated, hasMoreRelated]);

	// Trigger initial related fetch when product loads
	useEffect(() => {
		if (product && relatedProducts.length === 0) {
			setRelatedPage(1);
			setHasMoreRelated(true);
			fetchRelated(1, null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [product]); // Only trigger when product loads first time

	// Intersection Observer for Infinite Loading
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


	const handleMouseMove = (e) => {
		if (!imageRef.current) return;
		const { left, top, width, height } = imageRef.current.getBoundingClientRect();
		const x = ((e.clientX - left) / width) * 100;
		const y = ((e.clientY - top) / height) * 100;
		
		const mainImage = product?.images?.find(img => img.isMain)?.url || product?.images?.[0]?.url || "placeholder.jpg";
		
		setZoomStyle({
			display: "block",
			backgroundImage: `url(${mainImage})`,
			backgroundPosition: `${x}% ${y}%`,
			backgroundSize: "200%",
		});
	};

	const handleMouseLeave = () => {
		setZoomStyle({ display: "none" });
	};

	const handleBuyNow = async () => {
		if (product.affiliateLink) {
			window.open(product.affiliateLink, "_blank", "noopener,noreferrer");
		}
		
		// Track affiliate link click (Purchase Button)
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

	const mainImage = product.images?.find((img) => img.isMain)?.url || product.images?.[0]?.url || "placeholder.jpg";

	return (
		<div className="min-h-screen bg-[#050505] pb-16 relative overflow-hidden font-sans">
			
			{/* spin keyframe for loading icon */}
			<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
			
			{/* Dynamic Ambient Background */}
			<div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden z-0">
				<div 
					className="absolute top-[-20%] left-[-10%] w-[70%] h-[120%] opacity-20 blur-[120px] rounded-full mix-blend-screen"
					style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
				/>
				<div 
					className="absolute top-[10%] right-[-10%] w-[50%] h-[100%] opacity-10 blur-[100px] rounded-full mix-blend-screen"
					style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
				/>
			</div>

			<div className="relative z-10">
				<MainHeader hideSearch />
			</div>

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
				
				{/* Back Button */}
				<button 
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-10 font-medium group"
				>
					<svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back
				</button>

				{/* Premium Product Display Section */}
				<div className="mb-24">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
						
						{/* Left: Image Gallery & Zoom (Takes 5 columns) */}
						<div className="lg:col-span-5 relative group">
							
							<div 
								className="relative w-full h-auto bg-white/5 rounded-2xl overflow-hidden cursor-crosshair shadow-2xl border border-zinc-800/50 flex items-center justify-center"
								onMouseMove={handleMouseMove}
								onMouseLeave={handleMouseLeave}
								ref={imageRef}
							>
								<img 
									src={mainImage} 
									alt={product.title}
									className="w-full h-auto max-h-[700px] object-contain transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
								/>
								
								{/* Floating Badges */}
								<div className="absolute top-4 left-4 flex flex-col gap-2">
									<span className="bg-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded shadow-lg border border-white/20">
										{product.animeTag}
									</span>
									{!product.inStock && (
										<span className="bg-red-500/80 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded shadow-lg">
											Out of Stock
										</span>
									)}
								</div>
							</div>
							
							{/* Zoom Lens Result Container */}
							<div 
								className="hidden lg:block absolute top-0 -right-[calc(140%+2rem)] w-[140%] h-full bg-zinc-950 border border-zinc-800 rounded-xl shadow-3xl pointer-events-none z-50 transition-opacity duration-300 overflow-hidden"
								style={{ 
									...zoomStyle, 
									opacity: zoomStyle.display === "none" ? 0 : 1,
									display: "block",
									boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)"
								}}
							/>
						</div>

						{/* Right: Product Details (Takes 7 columns) */}
						<div className="lg:col-span-7 flex flex-col h-full py-2 relative z-10">
							
							<div className="flex items-center gap-3 mb-4">
								<span className="text-purple-400 text-sm font-bold tracking-widest uppercase">
									{product.store}
								</span>
								<span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
								<span className="text-zinc-400 text-sm font-medium">
									{product.category} {product.subCategory ? `› ${product.subCategory}` : ''}
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
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
									<span>{product.views || 0} Views</span>
								</div>
							</div>

							<div className="mb-10 p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
								<div className="flex items-baseline gap-3">
									<span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
										{product.currency} {product.price}
									</span>
								</div>
								<p className="text-zinc-500 text-sm mt-3 font-medium">
									Prices are dynamically updated from <span className="text-zinc-300">{product.store}</span>. Final price may vary at checkout.
								</p>
							</div>
							
							<div className="mt-auto pb-8 border-b border-zinc-800 mb-8">
								<button 
									onClick={handleBuyNow}
									className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-12 py-5 bg-white text-black font-black text-lg rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
								>
									<div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
									<span className="relative z-10 group-hover:text-white transition-colors duration-300">Purchase on {product.store}</span>
									<svg className="w-5 h-5 relative z-10 group-hover:text-white transition-colors duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
									</svg>
								</button>
								<div className="flex items-center gap-2 mt-4 justify-center sm:justify-start text-zinc-500 text-xs font-medium">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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

				{/* Related Products Section */}
				{relatedProducts.length > 0 && (
					<div className="mt-32 pt-16 border-t border-zinc-800/50 relative">
						<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
						
						<div className="flex items-center justify-between mb-10">
							<h2 className="text-3xl font-black text-white tracking-tight">More related products</h2>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{relatedProducts.map((prod) => (
								<ProductCard key={prod._id} product={prod} />
							))}
						</div>
						
						{/* Infinite Loading Indicator */}
						<div 
							ref={observerRef} 
							className="mt-8 flex w-full items-center justify-center p-4"
						>
							{loadingRelated && (
								<div className="flex flex-col items-center gap-3">
									<div
										style={{
											width: "28px",
											height: "28px",
											border: "3px solid rgba(168, 85, 247, 0.2)",
											borderTop: "3px solid #a855f7",
											borderRadius: "50%",
											animation: "spin 1s linear infinite",
										}}
									/>
									<span className="text-sm text-zinc-500 font-medium">Loading more products...</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProductDisplayPage;
