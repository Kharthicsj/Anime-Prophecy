import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../common/Icons";

const BannerCarousel = ({ items = [] }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [autoPlay, setAutoPlay] = useState(true);

	if (!items || items.length === 0) {
		return null;
	}

	const goToPrevious = () => {
		setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
	};

	const goToNext = () => {
		setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
	};

	useEffect(() => {
		if (!autoPlay) return;
		const timer = setInterval(goToNext, 5000);
		return () => clearInterval(timer);
	}, [autoPlay, items.length]);

	const currentItem = items[currentIndex];

	return (
		<div
			className="relative w-full h-96 rounded-xl overflow-hidden group cursor-pointer"
			onMouseEnter={() => setAutoPlay(false)}
			onMouseLeave={() => setAutoPlay(true)}
		>
			{/* Background Image */}
			<img
				src={currentItem.image.url}
				alt={currentItem.title || "Carousel item"}
				className="w-full h-full object-cover"
			/>

			{/* Overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

			{/* Content */}
			<div className="absolute bottom-0 left-0 right-0 p-6">
				{currentItem.title && (
					<h3 className="text-2xl font-bold text-white mb-2">
						{currentItem.title}
					</h3>
				)}
				{currentItem.description && (
					<p className="text-gray-200 text-sm mb-4">
						{currentItem.description}
					</p>
				)}
				{currentItem.link && (
					<a
						href={currentItem.link}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
					>
						Learn More
					</a>
				)}
			</div>

			{/* Navigation Buttons */}
			{items.length > 1 && (
				<>
					<button
						onClick={goToPrevious}
						className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<ChevronLeftIcon size={24} />
					</button>
					<button
						onClick={goToNext}
						className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<ChevronRightIcon size={24} />
					</button>
				</>
			)}

			{/* Dot Indicators */}
			{items.length > 1 && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
					{items.map((_, index) => (
						<button
							key={index}
							onClick={() => setCurrentIndex(index)}
							className={`h-2 rounded-full transition-all ${
								index === currentIndex
									? "bg-purple-500 w-6"
									: "bg-white/50 w-2 hover:bg-white/75"
							}`}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default BannerCarousel;
