import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * AnimeBannerSlider — zoom-burst + RGB glitch + grey progress bar (banners only).
 */
const AnimeBannerSlider = ({
	items = [],
	height = "420px",
	autoPlayMs = 5000,
}) => {
	const [idx, setIdx] = useState(0);
	const idxRef = useRef(0);
	const progressBarRef = useRef(null);
	const slideStartRef = useRef(performance.now());
	const rafRef = useRef(null);

	idxRef.current = idx;

	useEffect(() => {
		if (items.length <= 1) return;

		slideStartRef.current = performance.now();

		const tick = (now) => {
			const elapsed = now - slideStartRef.current;
			const pct = Math.min(elapsed / autoPlayMs, 1);
			if (progressBarRef.current) {
				progressBarRef.current.style.transform = `scaleX(${pct})`;
			}
			if (elapsed >= autoPlayMs) {
				const next = (idxRef.current + 1) % items.length;
				idxRef.current = next;
				setIdx(next);
				slideStartRef.current = performance.now();
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [items.length, autoPlayMs]);

	if (!items.length) return null;

	const goTo = (i) => {
		idxRef.current = i;
		setIdx(i);
		slideStartRef.current = performance.now();
		if (progressBarRef.current) {
			progressBarRef.current.style.transform = "scaleX(0)";
		}
	};

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height,
				overflow: "hidden",
				background: "#000",
			}}
		>
			<style>{`
        @keyframes zoomBurst {
          0%   { transform: scale(1.18); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glitchH {
          0%,100% { clip-path: inset(0 0 100% 0); transform: translateX(0); }
          20%     { clip-path: inset(15% 0 50% 0); transform: translateX(-4px); }
          40%     { clip-path: inset(40% 0 20% 0); transform: translateX(4px); }
          60%     { clip-path: inset(70% 0 5% 0);  transform: translateX(-2px); }
          80%     { clip-path: inset(90% 0 0% 0);  transform: translateX(2px); }
        }
        @keyframes floatSpark {
          0%   { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-80px) scale(0.2); opacity: 0; }
        }
        @keyframes slideCaption {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

			{items.map((item, i) => {
				const isActive = i === idx;
				return (
					<div
						key={item._id || i}
						style={{
							position: "absolute",
							inset: 0,
							zIndex: isActive ? 2 : 1,
							pointerEvents: isActive ? "auto" : "none",
						}}
					>
						<img
							src={item.image?.url || item.url}
							alt={item.title || `Slide ${i + 1}`}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								display: "block",
								animation: isActive
									? "zoomBurst 0.85s cubic-bezier(0.22,1,0.36,1) forwards"
									: "none",
								opacity: isActive ? 1 : 0,
								transition: isActive
									? "none"
									: "opacity 0.4s ease",
							}}
						/>

						{isActive && (
							<div
								style={{
									position: "absolute",
									inset: 0,
									zIndex: 3,
									pointerEvents: "none",
									animation:
										"glitchH 0.55s steps(1) forwards",
									background:
										"linear-gradient(90deg, rgba(255,0,80,0.12) 0%, rgba(0,200,255,0.12) 100%)",
								}}
							/>
						)}

						{isActive &&
							[12, 30, 55, 72, 88].map((left, si) => (
								<div
									key={si}
									style={{
										position: "absolute",
										bottom: "15%",
										left: `${left}%`,
										width: "5px",
										height: "5px",
										borderRadius: "50%",
										background: [
											"#a855f7",
											"#38bdf8",
											"#fb7185",
											"#facc15",
											"#4ade80",
										][si],
										animation: `floatSpark ${0.9 + si * 0.18}s ease-out forwards`,
										animationDelay: `${si * 0.08}s`,
										zIndex: 4,
										pointerEvents: "none",
									}}
								/>
							))}

						<div
							style={{
								position: "absolute",
								inset: 0,
								zIndex: 2,
								background:
									"linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 50%, transparent 75%)",
							}}
						/>

						{isActive && (
							<div
								style={{
									position: "absolute",
									bottom: 0,
									left: 0,
									right: 0,
									zIndex: 5,
									padding:
										"2rem max(2rem, calc((100% - 1200px)/2 + 1.5rem))",
									animation:
										"slideCaption 0.5s 0.3s ease both",
								}}
							>
								{item.title && (
									<h3
										style={{
											margin: "0 0 0.5rem",
											fontSize:
												"clamp(1.3rem,3.5vw,1.9rem)",
											fontWeight: 800,
											color: "#fff",
											textShadow:
												"0 2px 12px rgba(0,0,0,0.7)",
											maxWidth: "560px",
										}}
									>
										{item.title}
									</h3>
								)}
								{item.description && (
									<p
										style={{
											margin: 0,
											fontSize: "0.92rem",
											color: "rgba(255,255,255,0.82)",
											maxWidth: "480px",
										}}
									>
										{item.description}
									</p>
								)}
								{item.link && (
									<a
										href={item.link}
										target="_blank"
										rel="noopener noreferrer"
										style={{
											display: "inline-flex",
											alignItems: "center",
											gap: "0.45rem",
											marginTop: "1rem",
											padding: "0.55rem 1.35rem",
											background:
												"linear-gradient(135deg,#7c3aed,#a855f7)",
											color: "#fff",
											borderRadius: "999px",
											fontSize: "0.83rem",
											fontWeight: 600,
											textDecoration: "none",
											boxShadow:
												"0 4px 20px rgba(168,85,247,0.45)",
										}}
									>
										Shop Now <FaArrowRight size={12} />
									</a>
								)}
							</div>
						)}
					</div>
				);
			})}

			{items.length > 1 && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						height: "3px",
						zIndex: 10,
						background: "rgba(255,255,255,0.08)",
					}}
				>
					<div
						ref={progressBarRef}
						style={{
							height: "100%",
							width: "100%",
							transform: "scaleX(0)",
							transformOrigin: "left center",
							background: "#9ca3af",
							willChange: "transform",
						}}
					/>
				</div>
			)}

			{items.length > 1 && (
				<>
					<button
						type="button"
						onClick={() =>
							goTo(idx === 0 ? items.length - 1 : idx - 1)
						}
						style={navBtn("left")}
					>
						<FaChevronLeft size={14} />
					</button>
					<button
						type="button"
						onClick={() => goTo((idx + 1) % items.length)}
						style={navBtn("right")}
					>
						<FaChevronRight size={14} />
					</button>
					<div
						style={{
							position: "absolute",
							bottom: "1.25rem",
							left: "50%",
							transform: "translateX(-50%)",
							display: "flex",
							gap: "7px",
							zIndex: 20,
						}}
					>
						{items.map((_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => goTo(i)}
								style={{
									width: i === idx ? "28px" : "8px",
									height: "8px",
									borderRadius: "999px",
									background:
										i === idx
											? "#a855f7"
											: "rgba(255,255,255,0.4)",
									border: "none",
									cursor: "pointer",
									transition: "all 0.35s",
									padding: 0,
								}}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

const navBtn = (side) => ({
	position: "absolute",
	top: "50%",
	[side]: "16px",
	transform: "translateY(-50%)",
	zIndex: 10,
	width: "40px",
	height: "40px",
	borderRadius: "50%",
	background: "rgba(0,0,0,0.55)",
	border: "1px solid rgba(255,255,255,0.18)",
	color: "#fff",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	cursor: "pointer",
	backdropFilter: "blur(6px)",
});

export default AnimeBannerSlider;
