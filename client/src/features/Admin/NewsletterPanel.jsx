import { useCallback, useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import AdminProductPicker from "../../components/admin/AdminProductPicker";
import CountryFlag from "../../components/common/CountryFlag";
import { countries } from "../../utils/countries";
import { getProductImage } from "../../utils/productHelpers";

const countryToIso = (value) =>
	countries.find((c) => c.value === value)?.isoCode || "ALL";

const toTitleCase = (str) =>
	str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const inputClass =
	"w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors";

const normalizeCountryDisplay = (raw) => {
	if (!raw?.trim()) return { value: null, label: "—" };
	const value = raw.trim().toLowerCase();
	const label = value === "worldwide" ? "Global — All Countries" : toTitleCase(value);
	return { value, label };
};

// ─── Recipient Mode ───────────────────────────────────────────────────────────
const RECIPIENT_MODES = [
	{ id: "first300", label: "First 300", desc: "Send to newest 1-300" },
	{ id: "next300", label: "Next 300", desc: "Send to subscribers 301-600" },
	{ id: "custom", label: "Custom", desc: "Enter specific count" },
	{ id: "selected", label: "Selected", desc: "Manual check" },
];

const NewsletterPanel = () => {
	const [subscribers, setSubscribers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [tableCountry, setTableCountry] = useState("Worldwide");
	const [availableCountries, setAvailableCountries] = useState([
		{ value: "Worldwide", label: "Global — All Countries" }
	]);

	// Compose form
	const [newsSubject, setNewsSubject] = useState("");
	const [newsContent, setNewsContent] = useState("");
	const [sendCountry, setSendCountry] = useState("Worldwide");
	const [selectedProducts, setSelectedProducts] = useState([]);
	const [sending, setSending] = useState(false);
	const [msg, setMsg] = useState({ text: "", type: "" });
	const [showProductPicker, setShowProductPicker] = useState(false);
	const [sendResult, setSendResult] = useState(null);

	// Recipient selection state
	const [showRecipientModal, setShowRecipientModal] = useState(false);
	const [recipientMode, setRecipientMode] = useState("first300");
	const [customCount, setCustomCount] = useState(300);
	const [selectedEmails, setSelectedEmails] = useState(new Set());
	const [modalSubscribers, setModalSubscribers] = useState([]);
	const [modalLoading, setModalLoading] = useState(false);
	const [modalPage, setModalPage] = useState(1);
	const [modalTotal, setModalTotal] = useState(0);
	const MODAL_LIMIT = 15;

	// Daily Tracker
	const todayStr = new Date().toISOString().split("T")[0];
	const [dailySent, setDailySent] = useState(() => {
		const stored = localStorage.getItem("brevoDailySent");
		if (stored) {
			const parsed = JSON.parse(stored);
			if (parsed.date === todayStr) return parsed.count;
		}
		return 0;
	});

	const flash = (text, type = "success") => {
		setMsg({ text, type });
		setTimeout(() => setMsg({ text: "", type: "" }), 4500);
	};

	const fetchSubscribers = useCallback(async (p = 1, country = tableCountry) => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ page: String(p), limit: "20" });
			if (country && country.toLowerCase() !== "worldwide") {
				params.set("country", country);
			}
			const res = await apiClient.get(`/newsletter/subscribers?${params}`);
			if (res.data.success) {
				setSubscribers(res.data.data.subscribers);
				setTotal(res.data.data.pagination.total);
				setPage(p);
				if (res.data.data.uniqueCountries) {
					const mapped = [
						{ value: "Worldwide", label: "Global — All Countries" },
						...res.data.data.uniqueCountries
							.filter(c => c && c.toLowerCase() !== "worldwide")
							.map(c => ({
								value: c,
								label: toTitleCase(c)
							}))
					];
					setAvailableCountries(mapped);
				}
			}
		} catch {
			flash("Failed to fetch subscribers", "error");
		} finally {
			setLoading(false);
		}
	}, [tableCountry]);

	useEffect(() => {
		fetchSubscribers(1, tableCountry);
	}, [tableCountry, fetchSubscribers]);

	// Fetch subscribers for the modal
	const fetchModalSubscribers = useCallback(async (p = 1) => {
		setModalLoading(true);
		try {
			const params = new URLSearchParams({
				page: String(p),
				limit: String(MODAL_LIMIT),
			});
			if (sendCountry && sendCountry.toLowerCase() !== "worldwide") {
				params.set("country", sendCountry);
			}
			const res = await apiClient.get(`/newsletter/subscribers?${params}`);
			if (res.data.success) {
				setModalSubscribers(res.data.data.subscribers);
				setModalTotal(res.data.data.pagination.total);
				setModalPage(p);
			}
		} catch {
			flash("Failed to fetch recipients", "error");
		} finally {
			setModalLoading(false);
		}
	}, [sendCountry]);

	// Auto-fetch modal subscribers when sendCountry changes if modal is open
	useEffect(() => {
		if (showRecipientModal) {
			fetchModalSubscribers(1);
		}
	}, [sendCountry, showRecipientModal, fetchModalSubscribers]);

	const removeSelectedProduct = (id) =>
		setSelectedProducts((prev) => prev.filter((p) => p._id !== id));

	// Step 1: open recipient modal on Submit click
	const handleSubmitClick = () => {
		if (!newsSubject.trim() || !newsContent.trim()) {
			flash("Subject and content are required", "error");
			return;
		}
		if (selectedProducts.length === 0) {
			flash("Please select at least one product", "error");
			return;
		}
		setRecipientMode("first300");
		setCustomCount(300);
		setSelectedEmails(new Set());
		fetchModalSubscribers(1);
		setShowRecipientModal(true);
	};

	// Step 2: confirm & send
	const handleConfirmSend = async () => {
		setSending(true);
		setSendResult(null);
		try {
			const payload = {
				subject: newsSubject,
				content: newsContent,
				country: sendCountry,
				siteUrl: window.location.origin,
				products: selectedProducts.map((p) => ({
					id: p._id,
					title: p.title,
					category: p.category,
					subCategory: p.subCategory || "",
					price: p.price,
					currency: p.currency,
					affiliateLink: p.affiliateLink,
					imageUrl: getProductImage(p),
				})),
				recipientMode,
				...(recipientMode === "custom" && { customCount: parseInt(customCount) || 300 }),
				...(recipientMode === "selected" && { selectedEmails: [...selectedEmails] }),
			};

			const res = await apiClient.post("/newsletter/broadcast", payload);
			if (res.data.success) {
				setSendResult(res.data);
				flash(res.data.message, "success");
				
				// Update daily sent counter
				const sentCount = res.data.sent || 0;
				setDailySent((prev) => {
					const newTotal = prev + sentCount;
					localStorage.setItem("brevoDailySent", JSON.stringify({ date: todayStr, count: newTotal }));
					return newTotal;
				});

				setNewsSubject("");
				setNewsContent("");
				setSelectedProducts([]);
				setSendCountry("Worldwide");
				setShowRecipientModal(false);
				setShowProductPicker(false);
			}
		} catch (err) {
			flash(err.response?.data?.message || "Failed to send newsletter", "error");
		} finally {
			setSending(false);
		}
	};

	const tableCountryLabel =
		availableCountries.find((c) => c.value === tableCountry)?.label || tableCountry;

	const toggleEmail = (email) => {
		setSelectedEmails((prev) => {
			const next = new Set(prev);
			if (next.has(email)) next.delete(email);
			else next.add(email);
			return next;
		});
	};

	const toggleAllVisible = () => {
		const allSelected = modalSubscribers.every((s) => selectedEmails.has(s.email));
		setSelectedEmails((prev) => {
			const next = new Set(prev);
			if (allSelected) modalSubscribers.forEach((s) => next.delete(s.email));
			else modalSubscribers.forEach((s) => next.add(s.email));
			return next;
		});
	};

	const recipientCount =
		recipientMode === "first300" ? Math.min(300, modalTotal) :
		recipientMode === "next300" ? Math.min(300, Math.max(0, modalTotal - 300)) :
		recipientMode === "custom" ? Math.min(parseInt(customCount) || 300, modalTotal) :
		selectedEmails.size;

	return (
		<div className="mx-auto max-w-6xl px-2 py-2 sm:px-4">
			{showProductPicker && (
				<AdminProductPicker
					selected={selectedProducts}
					onConfirm={(products) => {
						setSelectedProducts(products);
						setShowProductPicker(false);
					}}
					onClose={() => setShowProductPicker(false)}
					countryIso={countryToIso(sendCountry)}
					title="Select Products for Newsletter"
					subtitle="Search, filter, and sort products — newest show a 2-day New badge"
				/>
			)}

			{/* ── Recipient Selection Modal ── */}
			{showRecipientModal && (
				<div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
					<div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60">
						{/* Header */}
						<div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur px-6 py-5 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-white">Select Recipients</h3>
								<p className="text-xs text-zinc-500 mt-0.5 flex flex-wrap gap-4">
									<span className="inline-flex items-center gap-1.5">
										<span className="font-bold text-violet-300">{modalTotal}</span> matching subscribers
									</span>
									<span className="inline-flex items-center gap-1.5">
										Sent Today: <span className={`font-bold ${dailySent >= 300 ? "text-red-400" : "text-amber-400"}`}>{dailySent} / 300</span> limit
									</span>
								</p>
							</div>
							<div className="flex items-center gap-3">
								<div className="relative">
									<select
										value={sendCountry}
										onChange={(e) => setSendCountry(e.target.value)}
										className="appearance-none rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-zinc-800 hover:text-white transition-all pl-3 pr-8 py-1.5 min-w-[180px] cursor-pointer shadow-sm"
									>
										{availableCountries.map((c) => (
											<option key={c.value} value={c.value}>{c.label}</option>
										))}
									</select>
									<div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
										<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
									</div>
								</div>
								<div className="h-4 w-px bg-zinc-700/50 mx-1"></div>
								<button
									type="button"
									onClick={() => setShowRecipientModal(false)}
									className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
								>
									<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
								</button>
							</div>
						</div>

						<div className="p-6 space-y-6">
							{/* Mode selector */}
							<div className="grid grid-cols-3 gap-3">
								{RECIPIENT_MODES.map((m) => (
									<button
										key={m.id}
										type="button"
										onClick={() => setRecipientMode(m.id)}
										className={`rounded-xl border p-3 text-left transition-all ${
											recipientMode === m.id
												? "border-purple-500 bg-purple-500/10 text-white"
												: "border-zinc-700 text-zinc-400 hover:border-zinc-600"
										}`}
									>
										<p className="text-sm font-semibold">{m.label}</p>
										<p className="text-xs mt-1 opacity-70">{m.desc}</p>
									</button>
								))}
							</div>

							{/* Custom count input */}
							{recipientMode === "custom" && (
								<div>
									<label className="block text-sm font-medium text-zinc-400 mb-2">
										Number of recipients
									</label>
									<input
										type="number"
										min="1"
										max={modalTotal}
										value={customCount}
										onChange={(e) => setCustomCount(e.target.value)}
										className={inputClass}
										placeholder={`Max: ${modalTotal}`}
									/>
									<p className="mt-1 text-xs text-zinc-500">
										Will target the most recent {Math.min(customCount, modalTotal)} subscribers
									</p>
								</div>
							)}

							{/* Select All / Select Page header row for 'selected' mode */}
							{recipientMode === "selected" && (
								<div>
									<div className="flex items-center justify-between mb-3">
										<label className="flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={modalSubscribers.length > 0 && modalSubscribers.every((s) => selectedEmails.has(s.email))}
												onChange={toggleAllVisible}
												className="accent-purple-500 w-4 h-4"
											/>
											<span className="text-sm font-medium text-zinc-400">
												{modalSubscribers.every((s) => selectedEmails.has(s.email)) ? "Deselect Page" : "Select Page"}
											</span>
										</label>
										<div className="flex items-center gap-3">
											<p className="text-sm font-medium text-zinc-400">
												Selected: <span className="text-violet-300 font-bold">{selectedEmails.size}</span>
												{" / "}<span className="text-zinc-500">{modalTotal}</span>
											</p>
											{selectedEmails.size > 0 && (
												<button
													type="button"
													onClick={() => setSelectedEmails(new Set())}
													className="text-xs text-red-400 hover:text-red-300 transition-colors"
												>
													Clear All
												</button>
											)}
										</div>
									</div>

									{modalLoading ? (
										<div className="py-8 text-center text-zinc-500 text-sm">Loading subscribers…</div>
									) : (
										<div className="rounded-xl border border-zinc-800 overflow-hidden max-h-60 overflow-y-auto">
											{modalSubscribers.map((sub) => {
												const c = normalizeCountryDisplay(sub.country);
												return (
													<label
														key={sub._id}
														className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 cursor-pointer hover:bg-purple-950/10 transition-colors"
													>
														<input
															type="checkbox"
															checked={selectedEmails.has(sub.email)}
															onChange={() => toggleEmail(sub.email)}
															className="accent-purple-500 w-4 h-4 shrink-0"
														/>
														<div className="flex-1 min-w-0">
															<p className="text-sm text-violet-200 truncate">{sub.email}</p>
															<p className="text-xs text-zinc-500">{c.label}</p>
														</div>
													</label>
												);
											})}
										</div>
									)}

									{/* Pagination */}
									<div className="flex items-center justify-between mt-3">
										<button
											type="button"
											onClick={() => fetchModalSubscribers(Math.max(1, modalPage - 1))}
											disabled={modalPage === 1}
											className="text-xs text-zinc-400 disabled:opacity-40 hover:text-white transition-colors"
										>
											← Prev
										</button>
										<span className="text-xs text-zinc-500">
											Page {modalPage} of {Math.ceil(modalTotal / MODAL_LIMIT) || 1}
										</span>
										<button
											type="button"
											onClick={() => fetchModalSubscribers(modalPage + 1)}
											disabled={modalPage * MODAL_LIMIT >= modalTotal}
											className="text-xs text-zinc-400 disabled:opacity-40 hover:text-white transition-colors"
										>
											Next →
										</button>
									</div>
								</div>
							)}

							{/* Summary */}
							<div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
								<p className="text-sm text-zinc-400">
									📧 This newsletter will be sent to{" "}
									<span className="font-bold text-white">{recipientCount}</span> subscriber{recipientCount !== 1 ? "s" : ""}.
								</p>
								<p className="text-xs text-zinc-600 mt-1">
									Subject: <span className="text-zinc-400">{newsSubject}</span>
								</p>
							</div>

							{/* Action buttons */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setShowRecipientModal(false)}
									className="flex-1 rounded-lg border border-zinc-700 py-3 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleConfirmSend}
									disabled={sending || (recipientMode === "selected" && selectedEmails.size === 0)}
									className="flex-1 rounded-lg bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{sending ? (
										<span className="flex items-center justify-center gap-2">
											<span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											Sending…
										</span>
									) : (
										`Send to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} →`
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<header className="mb-10">
				<h2 className="mb-2 text-2xl font-extrabold text-white">Newsletter Management</h2>
				<p className="text-sm text-zinc-500">
					Send regional newsletters and manage your subscriber list.
				</p>
			</header>

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

			{sendResult && (
				<div className="mb-8 rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 text-sm">
					<p className="font-semibold text-violet-200 mb-1">✅ Newsletter Sent!</p>
					<div className="flex gap-6 text-zinc-400">
						<span>✉️ Delivered: <span className="text-green-400 font-bold">{sendResult.data?.sent}</span></span>
						<span>❌ Failed: <span className="text-red-400 font-bold">{sendResult.data?.failed}</span></span>
					</div>
					<button onClick={() => setSendResult(null)} className="mt-2 text-xs text-zinc-600 hover:text-zinc-400 underline">
						Dismiss
					</button>
				</div>
			)}

			<div className="mb-10 grid gap-8 lg:grid-cols-5">
				{/* Send form */}
				<section className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
					<h3 className="mb-6 text-lg font-bold text-white">Compose Newsletter</h3>
					<div className="space-y-6">

						<div>
							<label className="mb-2 block text-sm font-medium text-zinc-400">Subject</label>
							<input
								type="text"
								placeholder="Newsletter subject"
								value={newsSubject}
								onChange={(e) => setNewsSubject(e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-zinc-400">Message</label>
							<textarea
								placeholder="Newsletter message about new products"
								value={newsContent}
								onChange={(e) => setNewsContent(e.target.value)}
								rows={5}
								className={`${inputClass} resize-y`}
							/>
						</div>
						<div>
							<div className="mb-3 flex items-center justify-between">
								<label className="text-sm font-medium text-zinc-400">
									Products ({selectedProducts.length})
								</label>
								<button
									type="button"
									onClick={() => setShowProductPicker(true)}
									className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
								>
									+ Select products
								</button>
							</div>
							{selectedProducts.length === 0 ? (
								<button
									type="button"
									onClick={() => setShowProductPicker(true)}
									className="w-full rounded-xl border border-dashed border-zinc-700 py-10 text-sm text-zinc-500 transition hover:border-purple-500/40 hover:text-violet-300"
								>
									Click to select products for this newsletter
								</button>
							) : (
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
									{selectedProducts.map((p) => (
										<div
											key={p._id}
											className="group relative overflow-hidden rounded-xl border border-purple-500/30 bg-zinc-950"
										>
											<button
												type="button"
												onClick={() => removeSelectedProduct(p._id)}
												className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100"
												aria-label={`Remove ${p.title}`}
											>
												×
											</button>
											<img
												src={getProductImage(p)}
												alt=""
												className="h-24 w-full object-cover"
											/>
											<p className="line-clamp-2 p-2 text-xs font-medium text-zinc-300">
												{p.title}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
						{/* Submit → opens recipient modal */}
						<button
							type="button"
							onClick={handleSubmitClick}
							className="w-full rounded-lg bg-purple-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple-500"
						>
							Submit — Choose Recipients & Send →
						</button>
						<p className="text-xs text-zinc-600 text-center">
							You'll select recipient scope after clicking Submit
						</p>
					</div>
				</section>

				{/* Stats sidebar */}
				<aside className="lg:col-span-2 space-y-6">
					<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
						<h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Overview</h3>
						<dl className="space-y-4">
							<div className="flex justify-between border-b border-zinc-800 pb-3">
								<dt className="text-sm text-zinc-500">Total subscribers</dt>
								<dd className="text-xl font-bold text-violet-300">{total}</dd>
							</div>
							<div className="flex justify-between border-b border-zinc-800 pb-3">
								<dt className="text-sm text-zinc-500">Table filter</dt>
								<dd className="text-sm font-semibold text-white">{tableCountryLabel}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-zinc-500">Products in draft</dt>
								<dd className="text-sm font-semibold text-white">{selectedProducts.length}</dd>
							</div>
						</dl>
					</div>

					{/* Brevo info */}
					<div className="rounded-2xl border border-blue-800/40 bg-blue-950/20 p-5">
						<h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">📨 Email Service</h3>
						<p className="text-xs text-zinc-400 leading-relaxed">
							Using <span className="text-blue-300 font-semibold">Brevo SMTP</span> (free tier).
							Emails are sent in batches of 50 with 1s delay.
						</p>
						<p className="text-xs text-zinc-500 mt-2">
							Upgrading to paid? Swap to Brevo's Transactional Email API for higher throughput.
						</p>
					</div>
				</aside>
			</div>

			{/* Subscribers table */}
			<section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-lg font-bold text-white">Active Subscribers</h3>
						<p className="mt-1 text-sm text-zinc-500">
							{total} subscriber{total !== 1 ? "s" : ""}{" "}
							{tableCountry === "Worldwide" ? "worldwide" : `in ${tableCountryLabel}`}
						</p>
					</div>
					<div className="w-full sm:w-56">
						<label className="mb-1.5 block text-xs font-medium text-zinc-500">
							Filter by region
						</label>
						<select
							value={tableCountry}
							onChange={(e) => {
								setTableCountry(e.target.value);
								setPage(1);
							}}
							className={inputClass}
						>
							{availableCountries.map((c) => (
								<option key={c.value} value={c.value}>{c.label}</option>
							))}
						</select>
					</div>
				</div>

				{loading ? (
					<p className="py-12 text-center text-zinc-500">Loading subscribers…</p>
				) : subscribers.length === 0 ? (
					<p className="py-12 text-center text-zinc-500">
						No subscribers{tableCountry !== "Worldwide" ? ` for ${tableCountryLabel}` : ""} yet
					</p>
				) : (
					<>
						<div className="overflow-x-auto rounded-xl border border-zinc-800">
							<table className="w-full min-w-[520px] text-left text-sm">
								<thead>
									<tr className="border-b border-zinc-800 bg-zinc-950/80">
										<th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
										<th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Country</th>
										<th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Source</th>
										<th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Subscribed</th>
									</tr>
								</thead>
								<tbody>
									{subscribers.map((sub) => {
										const c = normalizeCountryDisplay(sub.country);
										return (
											<tr key={sub._id} className="border-b border-zinc-800/80 transition hover:bg-purple-950/10">
												<td className="px-5 py-4 font-medium text-violet-200">{sub.email}</td>
												<td className="px-5 py-4">
													<span className="inline-flex items-center gap-2 text-zinc-300">
														{c.value ? <CountryFlag value={c.value} size="xs" mode="image" /> : null}
														{c.label}
													</span>
												</td>
												<td className="px-5 py-4 capitalize text-zinc-500">{sub.source || "—"}</td>
												<td className="px-5 py-4 text-zinc-500">
													{new Date(sub.createdAt).toLocaleDateString()}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						<div className="mt-6 flex items-center justify-center gap-3">
							<button
								type="button"
								onClick={() => fetchSubscribers(Math.max(1, page - 1))}
								disabled={page === 1}
								className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 disabled:opacity-40 hover:border-zinc-500 transition-colors"
							>
								Previous
							</button>
							<span className="text-sm text-zinc-500">Page {page}</span>
							<button
								type="button"
								onClick={() => fetchSubscribers(page + 1)}
								disabled={page * 20 >= total}
								className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 disabled:opacity-40 hover:border-zinc-500 transition-colors"
							>
								Next
							</button>
						</div>
					</>
				)}
			</section>
		</div>
	);
};

export default NewsletterPanel;
