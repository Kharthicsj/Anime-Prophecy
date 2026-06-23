import { StarIcon } from "./Icons";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";

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

/**
 * Product Card Component
 * Displays anime merchandise product with image, title, and CTA.
 * Clicking anywhere on the card navigates to the Product Display Page.
 */
const ProductCard = ({ product, showCountryTag = false, className = "" }) => {
	const navigate = useNavigate();

	const mainImage =
		product.images?.find((img) => img.isMain) || product.images?.[0];

	const handleCardClick = useCallback((e) => {
		if (e.ctrlKey || e.metaKey || e.button === 1) return;
		e.preventDefault();
		apiClient.post(`/products/${product._id}/click`).catch(() => { });
		navigate(`/product/${product._id}`);
	}, [navigate, product._id]);

	const currencySymbol = CURRENCY_SYMBOLS[product.currency] || "";

	return (
		<a
			href={`/product/${product._id}`}
			onClick={handleCardClick}
			tabIndex={0}
			className={`
        group cursor-pointer rounded-xl overflow-hidden min-w-0
        bg-zinc-900 border border-zinc-800 hover:border-purple-500
        transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20
        transform hover:scale-105 block
        ${className}
      `}
		>
			{/* Image Container */}
			<div className="relative overflow-hidden bg-zinc-800 aspect-square w-full">
				<img
					src={mainImage?.url || "placeholder.jpg"}
					alt={product.title}
					className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
					loading="lazy"
				/>

				{/* Badges Container */}
				<div className="absolute top-3 left-3 flex flex-col items-start gap-2">
					<span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
						{product.animeTag}
					</span>
					{showCountryTag && product.countries && (
						<div className="flex flex-wrap gap-1.5">
							{product.countries
								.filter((c) => c.toLowerCase() !== "other" && c.toLowerCase() !== "worldwide")
								.map((c, idx) => (
									<span
										key={idx}
										className="bg-zinc-900/90 text-zinc-300 text-[0.65rem] font-bold px-2 py-0.5 rounded border border-zinc-700 backdrop-blur-sm shadow-md tracking-wider uppercase"
									>
										{c}
									</span>
								))}
						</div>
					)}
				</div>

				{/* Store Badge */}
				<div className="absolute top-3 right-3">
					<span className="bg-zinc-900 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
						{product.store}
					</span>
				</div>
			</div>

			{/* Content */}
			<div className="p-4 space-y-3">
				<h3 className="font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
					{product.title}
				</h3>

				{/* Category, SubCategory & Rating */}
				<div className="flex items-center justify-between text-xs text-zinc-400">
					<div className="flex items-center gap-1.5 flex-wrap">
						<span className="bg-zinc-800 px-2.5 py-1 rounded">
							{product.category}
						</span>
						{product.subCategory && (
							<span className="bg-violet-900/30 text-violet-300 px-2 py-1 rounded border border-violet-800/40">
								{product.subCategory}
							</span>
						)}
					</div>
					{product.rating > 0 && (
						<span className="inline-flex items-center gap-1 text-yellow-400 font-semibold">
							<StarIcon className="h-4 w-4" />{" "}
							{product.rating.toFixed(1)}
						</span>
					)}
				</div>

				{/* Price */}
				<div className="flex items-center justify-between">
					<span className="text-lg font-bold text-purple-400">
						{product.currency}{" "}
						{currencySymbol && (
							<span className="mr-0.5">{currencySymbol}</span>
						)}{product.price}
					</span>
					{!product.inStock && (
						<span className="text-red-500 text-xs font-bold">
							Out of Stock
						</span>
					)}
				</div>

				{/* CTA Button */}
				<div className="block w-full text-center bg-purple-600 group-hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors mt-3">
					View Details →
				</div>
			</div>
		</a>
	);
};

export default ProductCard;
