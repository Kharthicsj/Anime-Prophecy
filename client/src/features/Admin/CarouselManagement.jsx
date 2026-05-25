import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import AdminProductPicker from "../../components/admin/AdminProductPicker";
import { countries } from "../../utils/countries";
import { getProductImage } from "../../utils/productHelpers";
import {
	FaFire,
	FaCheckCircle,
	FaTimesCircle,
	FaArrowLeft,
} from "react-icons/fa";

const inputClass =
	"w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500";

const CarouselManagement = () => {
	const navigate = useNavigate();
	const [carousels, setCarousels] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [msg, setMsg] = useState({ text: "", type: "" });
	const [showPicker, setShowPicker] = useState(false);

	const [form, setForm] = useState({
		title: "",
		country: "ALL",
		autoPlayInterval: 5000,
		selectedProducts: [],
	});

	const flash = (text, type = "success") => {
		setMsg({ text, type });
		setTimeout(() => setMsg({ text: "", type: "" }), 4000);
	};

	const fetchCarousels = useCallback(async () => {
		setLoading(true);
		try {
			const r = await apiClient.get("/carousels");
			setCarousels(r.data?.data || []);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCarousels();
	}, [fetchCarousels]);

	const handlePickerConfirm = (products) => {
		setForm((p) => ({ ...p, selectedProducts: products }));
		setShowPicker(false);
	};

	const removeProduct = (id) =>
		setForm((p) => ({
			...p,
			selectedProducts: p.selectedProducts.filter((x) => x._id !== id),
		}));

	const moveProduct = (idx, dir) => {
		const arr = [...form.selectedProducts];
		const swap = idx + dir;
		if (swap < 0 || swap >= arr.length) return;
		[arr[idx], arr[swap]] = [arr[swap], arr[idx]];
		setForm((p) => ({ ...p, selectedProducts: arr }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.selectedProducts.length) {
			flash("Select at least one product.", "error");
			return;
		}
		setSaving(true);
		try {
			const payload = {
				title: form.title,
				country: form.country,
				autoPlayInterval: Number(form.autoPlayInterval),
				productIds: form.selectedProducts.map((p) => p._id),
				items: [],
			};
			if (editingId) {
				await apiClient.put(`/carousels/${editingId}`, payload);
				flash("Carousel updated.");
			} else {
				await apiClient.post("/carousels", payload);
				flash("Carousel created.");
			}
			resetForm();
			fetchCarousels();
		} catch (err) {
			flash(err.response?.data?.message || "Save failed.", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleEdit = (c) => {
		setEditingId(c._id);
		const prods = (c.items || []).map((it, i) => ({
			_id: c.productIds?.[i] || `legacy-${i}`,
			title: it.title,
			images: [{ url: it.image?.url, isMain: true }],
			price: "",
			currency: "",
		}));
		setForm({
			title: c.title,
			country: c.country,
			autoPlayInterval: c.autoPlayInterval || 5000,
			selectedProducts: prods,
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleDelete = async (id) => {
		if (!confirm("Delete this carousel?")) return;
		try {
			await apiClient.delete(`/carousels/${id}`);
			flash("Deleted.");
			fetchCarousels();
		} catch {
			flash("Delete failed.", "error");
		}
	};

	const resetForm = () => {
		setEditingId(null);
		setForm({
			title: "",
			country: "ALL",
			autoPlayInterval: 5000,
			selectedProducts: [],
		});
	};

	const countryLabel = (iso) =>
		countries.find((c) => c.isoCode === iso)?.label || iso;

	return (
		<div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-sans)] text-white">
			{showPicker && (
				<AdminProductPicker
					selected={form.selectedProducts}
					onConfirm={handlePickerConfirm}
					onClose={() => setShowPicker(false)}
					countryIso={form.country}
					title="Select Products for Carousel"
					subtitle="Search, filter, and sort — newest products show a New badge for 2 days"
				/>
			)}

			<header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-6 backdrop-blur-xl">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 text-sm">
						✦
					</div>
					<span className="font-bold">Carousel Management</span>
					<span className="rounded-md border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 text-[0.65rem] font-semibold text-violet-300">
						Product-Picker
					</span>
				</div>
				<button
					type="button"
					onClick={() => navigate("/admin/dashboard")}
					className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white"
				>
					<FaArrowLeft size={12} /> Dashboard
				</button>
			</header>

			<main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
				{msg.text && (
					<div
						className={`mb-8 rounded-lg px-4 py-3 text-sm ${
							msg.type === "error"
								? "border border-red-500/30 bg-red-950/30 text-red-300"
								: "border border-green-500/30 bg-green-950/30 text-green-300"
						}`}
					>
						{msg.text}
					</div>
				)}

				<section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
					<h2 className="mb-1 text-xl font-bold">
						{editingId ? "Edit Carousel" : "Create Carousel"}
					</h2>
					<p className="mb-8 text-sm text-zinc-500">
						Pick products — their images, titles, and links build the
						carousel. One carousel per country or global.
					</p>

					<form onSubmit={handleSubmit} className="space-y-8">
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							<div className="sm:col-span-2 lg:col-span-1">
								<label className="mb-2 block text-sm font-medium text-zinc-400">
									Carousel Title *
								</label>
								<input
									required
									value={form.title}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											title: e.target.value,
										}))
									}
									placeholder="e.g. Trending in India"
									className={inputClass}
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-zinc-400">
									Country
								</label>
								<select
									value={form.country}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											country: e.target.value,
										}))
									}
									className={inputClass}
								>
									<option value="ALL">Global (All Countries)</option>
									{countries
										.filter((c) => c.isoCode !== "ALL")
										.map((c) => (
											<option key={c.isoCode} value={c.isoCode}>
												{c.label}
											</option>
										))}
								</select>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-zinc-400">
									Autoplay (ms)
								</label>
								<input
									type="number"
									value={form.autoPlayInterval}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											autoPlayInterval:
												parseInt(e.target.value, 10) || 5000,
										}))
									}
									className={inputClass}
								/>
							</div>
						</div>

						<div>
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<label className="flex items-center gap-2 text-sm font-semibold text-white">
									<FaFire className="text-orange-500" size={14} />
									Trending Products ({form.selectedProducts.length})
								</label>
								<button
									type="button"
									onClick={() => setShowPicker(true)}
									className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-purple-900/40"
								>
									+ Pick Products
								</button>
							</div>

							{form.selectedProducts.length === 0 ? (
								<button
									type="button"
									onClick={() => setShowPicker(true)}
									className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-700 py-12 text-zinc-500 transition hover:border-purple-500/50 hover:text-violet-300"
								>
									<FaFire size={28} className="opacity-40" />
									<span className="text-sm">
										Click to pick products for this carousel
									</span>
								</button>
							) : (
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
									{form.selectedProducts.map((p, idx) => (
										<div
											key={p._id}
											className="group relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950"
										>
											<span className="absolute left-2 top-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[0.65rem] font-bold text-zinc-400">
												#{idx + 1}
											</span>
											<button
												type="button"
												onClick={() => removeProduct(p._id)}
												className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-xs text-white opacity-0 transition group-hover:opacity-100"
												aria-label="Remove"
											>
												×
											</button>
											<img
												src={getProductImage(p)}
												alt=""
												className="h-24 w-full object-cover"
											/>
											<div className="p-2.5">
												<p className="line-clamp-2 text-xs font-medium text-zinc-300">
													{p.title}
												</p>
												<div className="mt-2 flex gap-1">
													<button
														type="button"
														onClick={() => moveProduct(idx, -1)}
														disabled={idx === 0}
														className="flex-1 rounded bg-zinc-800 py-0.5 text-[0.65rem] text-zinc-500 disabled:opacity-30"
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
														className="flex-1 rounded bg-zinc-800 py-0.5 text-[0.65rem] text-zinc-500 disabled:opacity-30"
													>
														↓
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="flex flex-wrap gap-3 pt-2">
							<button
								type="submit"
								disabled={saving}
								className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
							>
								{saving
									? "Saving…"
									: editingId
										? "Update Carousel"
										: "Create Carousel"}
							</button>
							{editingId && (
								<button
									type="button"
									onClick={resetForm}
									className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white"
								>
									Cancel
								</button>
							)}
						</div>
					</form>
				</section>

				<section>
					<h3 className="mb-6 text-lg font-bold">
						All Carousels ({carousels.length})
					</h3>
					{loading ? (
						<div className="space-y-4">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="h-28 animate-pulse rounded-xl bg-zinc-900"
								/>
							))}
						</div>
					) : carousels.length === 0 ? (
						<div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-500">
							No carousels yet. Create one above.
						</div>
					) : (
						<div className="space-y-4">
							{carousels.map((c) => (
								<div
									key={c._id}
									className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
								>
									<div className="mb-4 flex flex-wrap items-start justify-between gap-4">
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<FaFire
													size={13}
													className="text-orange-500"
												/>
												<p className="font-bold">{c.title}</p>
												<span className="rounded-md bg-purple-950/50 px-2 py-0.5 text-xs text-violet-300">
													{c.country === "ALL"
														? "Global"
														: countryLabel(c.country)}
												</span>
												{c.isActive ? (
													<FaCheckCircle
														size={12}
														className="text-green-500"
													/>
												) : (
													<FaTimesCircle
														size={12}
														className="text-red-500"
													/>
												)}
											</div>
											<p className="mt-1 text-sm text-zinc-500">
												{c.items?.length || 0} slides · autoplay{" "}
												{c.autoPlayInterval}ms
											</p>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => handleEdit(c)}
												className="rounded-lg border border-blue-500/30 bg-blue-950/30 px-3 py-1.5 text-sm text-blue-300 hover:bg-blue-900/40"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => handleDelete(c._id)}
												className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/40"
											>
												Delete
											</button>
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										{c.items?.slice(0, 8).map((item, i) => (
											<img
												key={i}
												src={item.image?.url}
												alt=""
												className="h-12 w-16 rounded-md border border-zinc-700 object-cover"
											/>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
};

export default CarouselManagement;
