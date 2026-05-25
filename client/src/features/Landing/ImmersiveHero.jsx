import { useEffect, useRef } from "react";
import { FaArrowRight, FaChevronDown } from "react-icons/fa";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => value * value * (3 - 2 * value);

/**
 * ImmersiveHero — sticky scroll-scene with multi-layer parallax.
 * Background drifts slowly while content floats forward, creating depth.
 */
const ImmersiveHero = ({
	bgUrl,
	mainLogo,
	onShopByRegion,
	onFeaturedDeals,
}) => {
	const sceneRef = useRef(null);
	const layersRef = useRef({
		bg: null,
		wash: null,
		particles: null,
		content: null,
		edge: null,
	});

	useEffect(() => {
		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const scene = sceneRef.current;
		if (!scene) return undefined;

		const tick = () => {
			const layers = layersRef.current;
			const rect = scene.getBoundingClientRect();
			const vh = window.innerHeight;
			const scrollable = Math.max(scene.offsetHeight - vh, 1);
			const rawProgress = clamp(-rect.top / scrollable, 0, 1);
			const eased = smoothstep(rawProgress);

			if (layers.bg) {
				const drift = eased * vh * 0.16;
				const scale = 1.12 + eased * 0.07;
				layers.bg.style.transform = `translate3d(-50%, calc(-50% + ${drift}px), 0) scale(${scale})`;
			}

			if (layers.wash) {
				const drift = eased * vh * 0.05;
				layers.wash.style.transform = `translate3d(0, ${drift}px, 0)`;
				layers.wash.style.opacity = String(0.34 + eased * 0.2);
			}

			if (layers.particles) {
				layers.particles.style.transform = `translate3d(${eased * -28}px, ${eased * -72}px, 0)`;
				layers.particles.style.opacity = String(0.42 + eased * 0.28);
			}

			if (layers.content) {
				const lift = eased * -56;
				const fade = 1 - eased * 0.22;
				layers.content.style.transform = `translate3d(0, ${lift}px, 0)`;
				layers.content.style.opacity = String(fade);
			}

			if (layers.edge) {
				layers.edge.style.opacity = String(0.78 + eased * 0.16);
			}
		};

		let rafId = 0;
		const requestTick = () => {
			if (prefersReduced || rafId) return;
			rafId = window.requestAnimationFrame(() => {
				rafId = 0;
				tick();
			});
		};

		if (!prefersReduced) {
			requestTick();
			window.addEventListener("scroll", requestTick, { passive: true });
			window.addEventListener("resize", requestTick);
			window.addEventListener("orientationchange", requestTick);
		}

		return () => {
			if (rafId) {
				window.cancelAnimationFrame(rafId);
			}
			window.removeEventListener("scroll", requestTick);
			window.removeEventListener("resize", requestTick);
			window.removeEventListener("orientationchange", requestTick);
		};
	}, [bgUrl]);

	return (
		<section
			ref={sceneRef}
			className="hero-scene relative h-[135vh] min-h-150 bg-zinc-950"
			aria-label="Prophecy Hub hero"
		>
			{/* Sticky viewport — user scrolls through scene while this stays pinned */}
			<div className="sticky top-0 h-dvh w-full overflow-hidden">
				{/* Deep background image */}
				<div className="absolute inset-0 z-0 overflow-hidden">
					<div
						ref={(el) => {
							layersRef.current.bg = el;
						}}
						className="absolute left-1/2 top-1/2 h-[132%] w-[132%] will-change-transform"
						style={{
							transform: "translate3d(-50%, -50%, 0) scale(1.12)",
						}}
					>
						<img
							src={bgUrl}
							alt=""
							aria-hidden
							decoding="async"
							className="h-full w-full object-cover"
						/>
					</div>
				</div>

				{/* Color wash and atmospheric depth */}
				<div className="pointer-events-none absolute inset-0 z-1 overflow-hidden">
					<div
						ref={(el) => {
							layersRef.current.wash = el;
						}}
						className="absolute inset-0 will-change-transform"
						style={{
							background:
								"radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.22) 0%, rgba(9, 9, 11, 0) 44%), radial-gradient(circle at 75% 30%, rgba(217, 70, 239, 0.14) 0%, rgba(9, 9, 11, 0) 38%), linear-gradient(180deg, rgba(9, 9, 11, 0.18) 0%, rgba(9, 9, 11, 0.45) 55%, rgba(9, 9, 11, 0.82) 100%)",
						}}
						aria-hidden
					></div>
				</div>

				{/* Ambient particles */}
				<div
					ref={(el) => {
						layersRef.current.particles = el;
					}}
					className="pointer-events-none absolute inset-0 z-2 will-change-transform"
					aria-hidden
				>
					<div className="absolute -left-20 top-[16%] h-72 w-72 rounded-full bg-violet-600/25 blur-[100px]" />
					<div className="absolute right-[-6%] top-[32%] h-96 w-96 rounded-full bg-fuchsia-600/18 blur-[120px]" />
					<div className="absolute bottom-[18%] left-[32%] h-64 w-64 rounded-full bg-indigo-500/20 blur-[90px]" />
					<div className="absolute right-[22%] top-[58%] h-44 w-44 rounded-full bg-cyan-400/10 blur-[80px]" />
				</div>

				{/* Cinematic overlays */}
				<div
					className="pointer-events-none absolute inset-0 z-3"
					style={{
						background: `
              linear-gradient(110deg, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.46) 44%, rgba(9,9,11,0.7) 100%),
              linear-gradient(180deg, rgba(9,9,11,0.38) 0%, rgba(9,9,11,0.08) 34%, rgba(9,9,11,0.78) 88%, #09090b 100%)
            `,
					}}
				/>
				<div
					className="pointer-events-none absolute inset-0 z-3 opacity-40 mix-blend-overlay"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
					}}
				/>

				{/* Foreground content */}
				<div
					ref={(el) => {
						layersRef.current.content = el;
					}}
					className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-4 pb-28 pt-24 will-change-transform sm:px-6 sm:pb-32 sm:pt-28 lg:px-8"
				>
					<div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/40 bg-purple-950/40 px-4 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-violet-300 backdrop-blur-md">
						<span>🔮</span>
						<span>
							Curated Anime Merchandise · Verified Stores Only
						</span>
					</div>

					<div className="mb-6 flex items-center gap-4 sm:gap-5">
						<img
							src={mainLogo}
							alt="Prophecy Hub"
							className="h-16 w-16 shrink-0 rounded-2xl border border-purple-500/50 object-cover shadow-2xl shadow-purple-950/60 ring-2 ring-purple-500/20 sm:h-20 sm:w-20 md:h-24 md:w-24"
						/>
						<div className="min-w-0">
							<h1 className="hero-title-glow mb-1 text-[clamp(2rem,6vw,4rem)] font-black leading-[1.05] tracking-tight text-white">
								Prophecy Hub
							</h1>
							<p className="text-[clamp(0.85rem,2vw,1.1rem)] font-semibold uppercase tracking-[0.2em] text-violet-400/90">
								Anime Merchandise Hub
							</p>
						</div>
					</div>

					<p className="mb-8 max-w-xl text-base leading-relaxed text-zinc-300/95 sm:text-lg">
						Discover the world's best anime merch from{" "}
						<strong className="font-semibold text-violet-300">
							verified stores
						</strong>{" "}
						— curated by region, powered by fans.
					</p>

					<div className="flex flex-wrap items-center gap-3 sm:gap-4">
						<button
							type="button"
							onClick={onShopByRegion}
							className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-purple-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/50 transition hover:-translate-y-0.5 hover:shadow-purple-700/50 sm:px-7 sm:text-base"
						>
							Shop by Region <FaArrowRight size={14} />
						</button>
						<button
							type="button"
							onClick={onFeaturedDeals}
							className="inline-flex items-center gap-2 rounded-full border border-zinc-500/60 bg-zinc-950/50 px-6 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-md transition hover:border-zinc-400 hover:bg-zinc-900/70 sm:px-7 sm:text-base"
						>
							Featured Deals
						</button>
					</div>
				</div>

				<div
					ref={(el) => {
						layersRef.current.edge = el;
					}}
					className="pointer-events-none absolute bottom-0 left-0 right-0 z-4 h-32 bg-linear-to-t from-zinc-950 to-transparent"
				/>

				{/* Scroll hint */}
				<div className="hero-scroll-hint absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-xs tracking-widest text-zinc-500">
					<span>SCROLL</span>
					<FaChevronDown size={14} />
				</div>
			</div>

			<style>{`
        .hero-title-glow {
          text-shadow:
            0 0 40px rgba(168, 85, 247, 0.45),
            0 2px 12px rgba(0, 0, 0, 0.9);
        }
        @keyframes heroScrollHint {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
          50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
        }
        .hero-scroll-hint {
          animation: heroScrollHint 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
					.hero-scene { height: 100dvh !important; min-height: auto !important; }
          .hero-scene .sticky { position: relative !important; }
					.hero-scene [style*="will-change-transform"] { transform: none !important; }
          .hero-scroll-hint { animation: none; opacity: 0.6; }
        }
      `}</style>
		</section>
	);
};

export default ImmersiveHero;
