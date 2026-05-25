import { useState, useEffect } from "react";

/**
 * Carousel Component
 * Auto-sliding carousel with manual controls for featured products
 */
const Carousel = ({
	items,
	autoSlideInterval = 2000,
	renderItem,
	className = "",
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isAutoplay, setIsAutoplay] = useState(true);

	useEffect(() => {
		if (!isAutoplay || items.length === 0) return;

		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
		}, autoSlideInterval);

		return () => clearInterval(interval);
	}, [isAutoplay, autoSlideInterval, items.length]);

	const goToSlide = (index) => {
		setCurrentIndex(index);
		setIsAutoplay(false);
	};

	const nextSlide = () => {
		setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
		setIsAutoplay(false);
	};

	const prevSlide = () => {
		setCurrentIndex(
			(prevIndex) => (prevIndex - 1 + items.length) % items.length,
		);
		setIsAutoplay(false);
	};

	if (items.length === 0) {
		return (
			<div className="text-center text-zinc-400">No items to display</div>
		);
	}

	return (
		<div
			className={`relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 ${className}`}
			onMouseEnter={() => setIsAutoplay(false)}
			onMouseLeave={() => setIsAutoplay(true)}
		>
			{/* Slides Container */}
			<div className="relative h-full">
				{items.map((item, index) => (
					<div
						key={index}
						className={`
              absolute inset-0 transition-opacity duration-500
              ${index === currentIndex ? "opacity-100" : "opacity-0"}
            `}
					>
						{renderItem(item)}
					</div>
				))}
			</div>

			{/* Left Arrow */}
			<button
				onClick={prevSlide}
				className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all"
			>
				❮
			</button>

			{/* Right Arrow */}
			<button
				onClick={nextSlide}
				className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all"
			>
				❯
			</button>

			{/* Indicators */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
				{items.map((_, index) => (
					<button
						key={index}
						onClick={() => goToSlide(index)}
						className={`
              h-2 rounded-full transition-all
              ${index === currentIndex ? "bg-purple-500 w-8" : "bg-zinc-600 w-2"}
            `}
					/>
				))}
			</div>
		</div>
	);
};

export default Carousel;
