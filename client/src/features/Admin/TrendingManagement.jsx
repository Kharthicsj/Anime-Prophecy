import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import AdminProductPicker from "../../components/admin/AdminProductPicker";
import CountryFlag from "../../components/common/CountryFlag";
import { countries } from "../../utils/countries";
import { getProductImage } from "../../utils/productHelpers";
import {
	FaFire,
	FaArrowLeft,
	FaCheckCircle,
	FaTimesCircle,
} from "react-icons/fa";

const inputClass =
	"w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500";

const countryToIso = (value) =>
	countries.find((c) => c.value === value)?.isoCode || "ALL";

const TrendingManagement = () => {
	const navigate = useNavigate();
	const [lists, setLists] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState({ text: "", type: "" });
	const [showPicker, setShowPicker] = useState(false);
	const [activeRegion, setActiveRegion] = useState("Worldwide");
	const [form, setForm] = useState({
		country: "Worldwide",
		selectedProducts: [],
		isActive: true,
	});

	const listsByCountry = useMemo(
		() =>
			Object.fromEntries(
				lists.map((l) => [l.country, l]),
			),
		[lists],
	);

	const activeCountryMeta = countries.find((c) => c.value === activeRegion);

	const flash = (text, type = "success") => {
		setMsg({ text, type });
		setTimeout(() => setMsg({ text: "", type: "" }), 4000);
	};

	const loadCountry = useCallback((country, data = lists) => {
		const existing = data.find((l) => l.country === country);
		if (existing?.products?.length) {
			setForm({
				country,
				isActive: existing.isActive !== false,
				selectedProducts: existing.products.map((p) => ({
					_id: p._id,
					title: p.title,
					images: p.images,
					price: p.price,
					currency: p.currency,
				})),
			});
		} else {
			setForm({
				country,
				isActive: true,
				selectedProducts: [],
			});
		}
	}, [lists]);

	const fetchLists = useCallback(async () => {
		setLoading(true);
		try {
			const r = await apiClient.get("/trending");
			return r.data?.data || [];
		} catch {
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		(async () => {
			const data = await fetchLists();
			setLists(data);
			loadCountry("Worldwide", data);
			setActiveRegion("Worldwide");
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selectRegion = (country) => {
		setActiveRegion(country);
		loadCountry(country, lists);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.selectedProducts.length) {
			flash("Select at least one product for this region.", "error");
			return;
		}
		setSaving(true);
		try {
			await apiClient.put("/trending", {
				country: form.country,
				productIds: form.selectedProducts.map((p) => p._id),
				isActive: form.isActive,
			});
			flash(`Trending list saved for ${activeCountryMeta?.label || form.country}.`);
			const data = await fetchLists();
			setLists(data);
			loadCountry(form.country, data);
		} catch (err) {
			flash(err.response?.data?.message || "Save failed.", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		const existing = listsByCountry[activeRegion];
		if (!existing?._id) {
			setForm((p) => ({ ...p, selectedProducts: [] }));
			return;
		}
		if (!confirm(`Remove trending list for ${activeCountryMeta?.label}?`)) return;
		try {
			await apiClient.delete(`/trending/${existing._id}`);
			flash("Trending list removed.");
			const data = await fetchLists();
			setLists(data);
			loadCountry(activeRegion, data);
		} catch {
			flash("Delete failed.", "error");
		}
	};

	const moveProduct = (idx, dir) => {
		const arr = [...form.selectedProducts];
		const swap = idx + dir;
		if (swap < 0 || swap >= arr.length) return;
		[arr[idx], arr[swap]] = [arr[swap], arr[idx]];
		setForm((p) => ({ ...p, selectedProducts: arr }));
	};

	const removeProduct = (id) =>
		setForm((p) => ({
			...p,
			selectedProducts: p.selectedProducts.filter((x) => x._id !== id),
		}));

	return (
		<div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-sans)] text-white">
			{showPicker && (
				<AdminProductPicker
					selected={form.selectedProducts}
					onConfirm={(products) => {
						setForm((p) => ({ ...p, selectedProducts: products }));
						setShowPicker(false);
					}}
					onClose={() => setShowPicker(false)}
					defaultCountry={form.country}
					countryIso={countryToIso(form.country)}
					title={`Trending — ${activeCountryMeta?.label || form.country}`}
					subtitle="Products you pick here only appear in this region's Trending section"
				/>
			)}

			<header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-6 backdrop-blur-xl sm:px-8">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-sm">
						<FaFire size={14} />
					</div>
					<div>
						<span className="font-bold">Trending Products</span>
						<p className="text-[0.65rem] text-zinc-500">
							Per-region curated lists
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={() => navigate("/admin/dashboard")}
					className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white"
				>
					<FaArrowLeft size={12} /> Dashboard
				</button>
			</header>

			<main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
				{msg.text && (
					<div
						className={`mb-8 rounded-xl px-5 py-3.5 text-sm ${
							msg.type === "error"
								? "border border-red-500/30 bg-red-950/30 text-red-300"
								: "border border-green-500/30 bg-green-950/30 text-green-300"
						}`}
					>
						{msg.text}
					</div>
				)}

				<div className="mb-8 space-y-2">
					<h1 className="text-2xl font-bold tracking-tight">
						Regional trending lists
					</h1>
					<p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
						Each region has its own trending products. US visitors see the US
						list, India sees the India list, and Global (Worldwide) sees the
						global list — they are independent.
					</p>
				</div>

				<div className="grid gap-8 lg:grid-cols-[minmax(240px,280px)_1fr]">
					{/* Region sidebar */}
					<aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
						<p className="mb-4 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
							Select region
						</p>
						<nav className="flex flex-col gap-2">
							{countries.map((c) => {
								const saved = listsByCountry[c.value];
								const count = saved?.products?.length || 0;
								const isActive = activeRegion === c.value;
								const live = saved?.isActive !== false && count > 0;

								return (
									<button
										key={c.value}
										type="button"
										onClick={() => selectRegion(c.value)}
										className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
											isActive
												? "border-purple-500/50 bg-purple-950/40"
												: "border-transparent bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-800/50"
										}`}
									>
										<CountryFlag
											value={c.value}
											size="sm"
											mode="image"
											style={{
												width: 28,
												height: 20,
												borderRadius: 4,
												flexShrink: 0,
											}}
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-semibold text-white">
												{c.label}
											</span>
											<span className="block text-[0.7rem] text-zinc-500">
												{count > 0
													? `${count} product${count === 1 ? "" : "s"}`
													: "Not configured"}
											</span>
										</span>
										{count > 0 &&
											(live ? (
												<FaCheckCircle
													className="shrink-0 text-green-500"
													size={14}
													title="Active"
												/>
											) : (
												<FaTimesCircle
													className="shrink-0 text-zinc-600"
													size={14}
													title="Inactive"
												/>
											))}
									</button>
								);
							})}
						</nav>
					</aside>

					{/* Editor panel */}
					<div className="min-w-0">
						<form
							onSubmit={handleSubmit}
							className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8"
						>
							<div className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-4">
									{activeCountryMeta && (
										<CountryFlag
											value={activeCountryMeta.value}
											size="lg"
											mode="image"
											style={{
												width: 48,
												height: 34,
												borderRadius: 6,
											}}
										/>
									)}
									<div>
										<h2 className="text-lg font-bold">
											{activeCountryMeta?.label || activeRegion}
										</h2>
										<p className="mt-0.5 text-sm text-zinc-500">
											Trending on landing &amp;{" "}
											{activeCountryMeta?.label} storefront
										</p>
									</div>
								</div>
								<label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-300">
									<input
										type="checkbox"
										checked={form.isActive}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												isActive: e.target.checked,
											}))
										}
										className="rounded border-zinc-600"
									/>
									Show on site
								</label>
							</div>

							<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
								<div>
									<h3 className="text-sm font-semibold text-white">
										Products ({form.selectedProducts.length})
									</h3>
									<p className="mt-1 text-xs text-zinc-500">
										Drag order with ↑↓ — first items appear first
									</p>
								</div>
								<button
									type="button"
									onClick={() => setShowPicker(true)}
									className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-5 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-purple-900/50"
								>
									+ Pick Products
								</button>
							</div>

							{loading ? (
								<div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center text-sm text-zinc-500">
									Loading regions…
								</div>
							) : form.selectedProducts.length === 0 ? (
								<button
									type="button"
									onClick={() => setShowPicker(true)}
									className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-700 py-14 text-zinc-500 transition hover:border-purple-500/40 hover:text-violet-300"
								>
									<FaFire size={32} className="opacity-30" />
									<span className="text-sm">
										No products for {activeCountryMeta?.label} yet —
										click to add
									</span>
								</button>
							) : (
								<div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
									{form.selectedProducts.map((p, idx) => (
										<div
											key={p._id}
											className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950"
										>
											<div className="relative aspect-square">
												<span className="absolute left-2 top-2 z-10 rounded-md bg-black/75 px-2 py-0.5 text-[0.65rem] font-bold text-zinc-200">
													#{idx + 1}
												</span>
												<img
													src={getProductImage(p)}
													alt={p.title}
													className="h-full w-full object-cover"
												/>
											</div>
											<p className="truncate px-3 py-2 text-xs text-zinc-300">
												{p.title}
											</p>
											<div className="flex gap-1 border-t border-zinc-800 p-2">
												<button
													type="button"
													onClick={() => moveProduct(idx, -1)}
													disabled={idx === 0}
													className="flex-1 rounded-md py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
												>
													↑
												</button>
												<button
													type="button"
													onClick={() => moveProduct(idx, 1)}
													disabled={
														idx ===
														form.selectedProducts.length - 1
													}
													className="flex-1 rounded-md py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
												>
													↓
												</button>
												<button
													type="button"
													onClick={() => removeProduct(p._id)}
													className="flex-1 rounded-md py-1.5 text-xs text-red-400 hover:bg-red-950/40"
												>
													Remove
												</button>
											</div>
										</div>
									))}
								</div>
							)}

							<div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-6">
								<button
									type="submit"
									disabled={saving}
									className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-2.5 text-sm font-bold shadow-lg shadow-purple-900/25 transition hover:opacity-90 disabled:opacity-50"
								>
									{saving
										? "Saving…"
										: `Save ${activeCountryMeta?.label} list`}
								</button>
								{listsByCountry[activeRegion] && (
									<button
										type="button"
										onClick={handleDelete}
										className="rounded-lg border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/30"
									>
										Clear region list
									</button>
								)}
							</div>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
};

export default TrendingManagement;
