import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import CountryFlag from "../../components/common/CountryFlag";
import {
	ArrowRightIcon,
	GlobeIcon,
	GridIcon,
	ShieldIcon,
	SparkIcon,
} from "../../components/common/Icons";
import { countries, getCountrySlug } from "../../utils/countries";

const CountrySelector = () => {
	const navigate = useNavigate();
	const { updateCountry } = useAppContext();

	const handleCountrySelect = (country) => {
		updateCountry(country.value);
		navigate(`/country/${getCountrySlug(country.value)}`);
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#000_100%)] text-white">
			<main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-16 lg:px-6">
				<section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
					<div className="space-y-8">
						<div className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-zinc-300">
							<SparkIcon className="h-4 w-4 text-purple-300" />
							Global anime storefront
						</div>
						<div className="space-y-5">
							<h1 className="max-w-2xl text-5xl font-black leading-tight md:text-6xl">
								Choose your region and step into a sharper anime
								retail experience.
							</h1>
							<p className="max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl">
								Discover region-aware product discovery, local
								currencies, and a dark anime aesthetic built for
								browsing fast.
							</p>
						</div>
						<div className="flex flex-wrap gap-3 text-sm text-zinc-400">
							<span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2">
								Dynamic country routing
							</span>
							<span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2">
								Regional product catalogs
							</span>
							<span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2">
								Affiliate-ready storefront
							</span>
						</div>
					</div>

					<div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
						<div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
									Select a store
								</p>
								<h2 className="mt-2 text-2xl font-semibold text-white">
									Available regions
								</h2>
							</div>
							<GlobeIcon className="h-6 w-6 text-purple-300" />
						</div>
						<div className="mt-6 space-y-3">
							{countries.map((country) => (
								<button
									key={country.value}
									onClick={() => handleCountrySelect(country)}
									className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-4 text-left transition-all duration-300 hover:border-purple-500 hover:bg-zinc-900 hover:shadow-lg hover:shadow-purple-500/10"
								>
									<CountryFlag
										country={country}
										className="h-10 w-16 shrink-0 rounded-xl border border-zinc-700"
									/>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-3">
											<h3 className="truncate text-lg font-semibold text-white group-hover:text-purple-300">
												{country.label}
											</h3>
											<span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
												{country.currency}
											</span>
										</div>
										<p className="mt-1 text-sm leading-6 text-zinc-400">
											{country.description}
										</p>
									</div>
									<ArrowRightIcon className="h-5 w-5 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-300" />
								</button>
							))}
						</div>
					</div>
				</section>

				<section className="mt-14 grid gap-6 border-t border-zinc-800 pt-10 md:grid-cols-3">
					<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
							<GridIcon className="h-6 w-6" />
						</div>
						<h3 className="text-xl font-semibold text-white">
							Curated selection
						</h3>
						<p className="mt-3 text-sm leading-6 text-zinc-400">
							Each region opens a focused anime catalogue with
							relevant products, pricing, and a cleaner path to
							purchase.
						</p>
					</div>
					<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
							<ShieldIcon className="h-6 w-6" />
						</div>
						<h3 className="text-xl font-semibold text-white">
							Cleaner trust layer
						</h3>
						<p className="mt-3 text-sm leading-6 text-zinc-400">
							The experience uses fewer distractions, proper
							iconography, and a more mature presentation for
							premium browsing.
						</p>
					</div>
					<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
							<SparkIcon className="h-6 w-6" />
						</div>
						<h3 className="text-xl font-semibold text-white">
							Built for anime fans
						</h3>
						<p className="mt-3 text-sm leading-6 text-zinc-400">
							Dark visuals, regional entry points, and a concise
							flow make the storefront feel more intentional and
							polished.
						</p>
					</div>
				</section>
			</main>
		</div>
	);
};

export default CountrySelector;
