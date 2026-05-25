import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * ProductCarousel — horizontal slide transition with infinite loop autoplay.
 */
const ProductCarousel = ({
	items = [],
	height = "420px",
	autoPlayMs = 5000,
	showProgress = true,
}) => {
	const [idx, setIdx] = useState(0);
	const [isTransitioning, setIsTransitioning] = useState(true);
	const idxRef = useRef(0);
	const progressBarRef = useRef(null);
	const slideStartRef = useRef(performance.now());
	const rafRef = useRef(null);
	const touchStartX = useRef(null);

	idxRef.current = idx;
	const count = items.length;

	useEffect(() => {
		if (count <= 1) return;

		slideStartRef.current = performance.now();

		const tick = (now) => {
			const elapsed = now - slideStartRef.current;
			const pct = Math.min(elapsed / autoPlayMs, 1);
			if (progressBarRef.current) {
				progressBarRef.current.style.transform = `scaleX(${pct})`;
			}
			if (elapsed >= autoPlayMs) {
				const next = (idxRef.current + 1) % count;
				idxRef.current = next;
				setIdx(next);
				slideStartRef.current = performance.now();
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [count, autoPlayMs]);

	if (!count) return null;

	const goTo = (i) => {
		idxRef.current = i;
		setIdx(i);
		slideStartRef.current = performance.now();
		if (progressBarRef.current) {
			progressBarRef.current.style.transform = "scaleX(0)";
		}
	};

	const goPrev = () => goTo(idx === 0 ? count - 1 : idx - 1);
	const goNext = () => goTo((idx + 1) % count);

	const onTouchStart = (e) => {
		touchStartX.current = e.touches[0].clientX;
	};
	const onTouchEnd = (e) => {
		if (touchStartX.current == null) return;
		const diff = touchStartX.current - e.changedTouches[0].clientX;
		if (Math.abs(diff) > 48) {
			if (diff > 0) goNext();
			else goPrev();
		}
		touchStartX.current = null;
	};

	return (
		<div
			className="relative w-full overflow-hidden bg-black"
			style={{ height }}
			onTouchStart={count > 1 ? onTouchStart : undefined}
			onTouchEnd={count > 1 ? onTouchEnd : undefined}
		>
			{/* Sliding track */}
			<div
				className="flex h-full ease-[cubic-bezier(0.45,0,0.15,1)] will-change-transform"
				style={{
					width: `${count * 100}%`,
					transform: `translateX(-${(idx / count) * 100}%)`,
					transition: isTransitioning
						? "transform 0.7s cubic-bezier(0.45, 0, 0.15, 1)"
						: "none",
				}}
				onTransitionEnd={() => setIsTransitioning(true)}
			>
				{items.map((item, i) => (
					<div
						key={item._id || item.id || i}
						className="relative h-full shrink-0"
						style={{ width: `${100 / count}%` }}
					>
						<img
							src={item.image?.url || item.url}
							alt={item.title || `Slide ${i + 1}`}
							className="block h-full w-full object-cover"
							draggable={false}
						/>
						{/* Foggy scrim — soft white mist, strong where captions sit */}
						<div
							className="pointer-events-none absolute inset-0 backdrop-blur-[2px]"
							style={{
								background:
									"linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.72) 32%, rgba(255,255,255,0.25) 55%, transparent 75%)",
							}}
							aria-hidden
						/>
						<div
							className="pointer-events-none absolute inset-0"
							style={{
								background:
									"linear-gradient(105deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.65) 38%, rgba(255,255,255,0.15) 58%, transparent 78%)",
							}}
							aria-hidden
						/>
						{(item.title || item.description || item.link) && (
							<div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-14 pt-6 sm:px-8 sm:pb-16 md:px-10">
								<div className="max-w-xl">
									{item.title && (
										<h3 className="mb-2 text-lg font-extrabold leading-snug text-zinc-900 drop-shadow-[0_1px_3px_rgba(255,255,255,1)] sm:text-2xl">
											{item.title}
										</h3>
									)}
									{item.description && (
										<p className="mb-0 line-clamp-3 text-sm leading-relaxed text-zinc-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] sm:text-base">
											{item.description}
										</p>
									)}
									{item.link && (
										<a
											href={item.link}
											target="_blank"
											rel="noopener noreferrer"
											className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:opacity-90"
										>
											Shop Now <FaArrowRight size={12} />
										</a>
									)}
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{showProgress && count > 1 && (
				<div className="absolute left-0 right-0 top-0 z-20 h-[3px] bg-white/10">
					<div
						ref={progressBarRef}
						className="h-full w-full origin-left bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-400"
						style={{ transform: "scaleX(0)" }}
					/>
				</div>
			)}

			{count > 1 && (
				<>
					<button
						type="button"
						onClick={goPrev}
						className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70"
						aria-label="Previous slide"
					>
						<FaChevronLeft size={14} />
					</button>
					<button
						type="button"
						onClick={goNext}
						className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70"
						aria-label="Next slide"
					>
						<FaChevronRight size={14} />
					</button>
					<div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
						{items.map((_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => goTo(i)}
								aria-label={`Go to slide ${i + 1}`}
								className="h-2 rounded-full border-0 p-0 transition-all duration-300"
								style={{
									width: i === idx ? 28 : 8,
									background:
										i === idx
											? "#a855f7"
											: "rgba(255,255,255,0.35)",
								}}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

export default ProductCarousel;
