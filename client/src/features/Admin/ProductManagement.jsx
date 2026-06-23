import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useSmartImageDrop from "../../hooks/useSmartImageDrop";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import SearchableSelect from "../../components/ui/SearchableSelect";
import apiClient from "../../services/apiClient";
import { BoxIcon, UploadIcon } from "../../components/common/Icons";
import { countries } from "../../utils/countries";
import LoadingAnimation from "../../components/common/LoadingAnimation";
import { SearchableDropdown } from "../../components/common/FilterPanel";

// ─── Utility to convert to Camel Case (Title Case for UI) ───────────
const toTitleCase = (str) => {
	return str.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

// ─── Static option lists (module-level so useMemo deps are stable) ───────────
const ANIME_OPTIONS = [
	"Naruto", "Bleach", "One Piece", "Dragon Ball Z", "Fairy Tail",
	"Fullmetal Alchemist: Brotherhood", "Death Note", "Neon Genesis Evangelion",
	"Cowboy Bebop", "Steins;Gate", "Code Geass", "JoJo's Bizarre Adventure",
	"Hunter x Hunter", "AOT", "JJK", "Demon Slayer", "MHA", "Haikyuu",
	"Tokyo Revengers", "Chainsaw Man", "Vinland Saga", "Spy x Family",
	"Blue Lock", "Mob Psycho 100", "One Punch Man", "Black Clover",
	"Dr. Stone", "Sword Art Online", "Re:Zero", "Overlord", "Shield Hero",
	"That Time I Got Reincarnated as a Slime", "Bocchi the Rock", "Oshi no Ko",
	"Frieren: Beyond Journey's End", "Dungeon Meshi", "Solo Leveling",
	"Kaiju No. 8", "Violet Evergarden", "Your Lie in April", "Other",
];
const STORE_OPTIONS = ["Amazon", "Flipkart", "Etsy", "eBay", "AliExpress", "Other"];
const CATEGORY_OPTIONS = [
	"Clothing", "Electronics", "Posters", "Gadgets", "Figures", "Accessories", "Cosplay", "Other"
];


const ProductManagement = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const fileInputRef = useRef(null);
	const videoFileInputRef = useRef(null);

	const [viewMode, setViewMode] = useState("list"); // 'list' or 'form'
	const [products, setProducts] = useState([]);
	const [loadingList, setLoadingList] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Search / Sort / Filter state for list view
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("-createdAt");
	const [filterCategory, setFilterCategory] = useState("All");
	const [filterAnime, setFilterAnime] = useState("All");
	const [filterStore, setFilterStore] = useState("All");
	const [filterCountry, setFilterCountry] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	const [showScheduledModal, setShowScheduledModal] = useState(false);

	const initialForm = {
		title: "",
		description: "",
		animeTag: "AOT",
		store: "Amazon",
		affiliateLink: "",
		price: "",
		currency: "USD",
		category: "Clothing",
		subCategory: "",
		countries: ["US"],
		colors: [],
		sizes: [],
		isActive: true,
		scheduledUploadTime: "",
	};
	const [formData, setFormData] = useState(initialForm);
	const [imageItems, setImageItems] = useState([]);
	const [videoItems, setVideoItems] = useState([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isVideoDragOver, setIsVideoDragOver] = useState(false);
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [uploadingCount, setUploadingCount] = useState(0);
	const [uploadingVideoCount, setUploadingVideoCount] = useState(0);
	const [customAnimeTag, setCustomAnimeTag] = useState("");
	const [customCategory, setCustomCategory] = useState("");
	const [customSubCategory, setCustomSubCategory] = useState("");
	const [customStore, setCustomStore] = useState("");
	const [customCountryInput, setCustomCountryInput] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	const [dynamicOptions, setDynamicOptions] = useState({
		animeTags: [],
		categories: [],
		stores: [],
		countries: [],
	});

	useEffect(() => {
		const fetchMeta = async () => {
			try {
				const res = await apiClient.get("/products/meta/filters");
				const d = res.data?.data || {};
				setDynamicOptions({
					animeTags: d.animeTags || [],
					categories: d.categories || [],
					stores: d.stores || [],
					countries: d.countries || [],
				});
			} catch {
				// silently fallback
			}
		};
		fetchMeta();
	}, []);

	// Subcategory map: which categories have subcategories and what they are
	const subCategoryMap = {
		"Clothing": ["T-Shirts", "Hoodies", "Pants", "Jackets"],
		"Electronics": ["Mouse Pads", "Phone Cases", "Keyboards", "Headphones"],
		"Posters": ["Canvas Print", "Paper Poster", "Metal Print", "Framed Poster"],
		"Gadgets": ["Keychains", "Mugs", "Lamps"],
		"Figures": ["Action Figure", "Statue", "Funko Pop", "Nendoroid"],
		"Accessories": ["Necklace", "Bracelet", "Ring", "Earrings", "Bag"],
		"Cosplay": ["Costume", "Props", "Wigs"],
	};

	// Use module-level constants (stable references)
	const animeOptions = ANIME_OPTIONS;
	const storeOptions = STORE_OPTIONS;
	const categoryOptions = CATEGORY_OPTIONS;
	const countryOptions = countries.map((c) => c.value);
	const currencyOptions = ["USD", "JPY", "GBP", "KRW", "INR", "EUR"];


	const fetchProducts = useCallback(async () => {
		setLoadingList(true);
		try {
			const res = await apiClient.get("/products/admin/all?limit=500");
			if (res.data.success) {
				setProducts(res.data.data.products);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingList(false);
		}
	}, []);

	const mergeUnique = (staticArr, dynamicArr) => {
		const set = new Set([...staticArr, ...dynamicArr]);
		return [...set];
	};

	const finalAnimeOptions = [
		{ value: "All", label: "All Anime" },
		...mergeUnique(animeOptions, dynamicOptions.animeTags).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	const finalCategoryOptions = [
		{ value: "All", label: "All Categories" },
		...mergeUnique(categoryOptions, dynamicOptions.categories).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	const finalStoreOptions = [
		{ value: "All", label: "All Stores" },
		...mergeUnique(storeOptions, dynamicOptions.stores).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	const finalCountryOptions = [
		{ value: "All", label: "All Countries" },
		...mergeUnique(countryOptions, dynamicOptions.countries).filter(v => v !== "Other").map(o => ({ value: o, label: o }))
	];

	useEffect(() => {
		if (user && viewMode === "list") {
			fetchProducts();
		}
	}, [user, viewMode, fetchProducts]);

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this product?"))
			return;
		setIsDeleting(true);
		try {
			await apiClient.delete(`/products/${id}`);
			fetchProducts();
		} catch (err) {
			alert("Failed to delete");
		} finally {
			setIsDeleting(false);
		}
	};

	const openEdit = (prod) => {
		setEditingId(prod._id);
		setFormData({
			title: prod.title || "",
			description: prod.description || "",
			animeTag: prod.animeTag || "AOT",
			store: prod.store || "Amazon",
			affiliateLink: prod.affiliateLink || "",
			price: prod.price || "",
			currency: prod.currency || "USD",
			category: prod.category || "T-Shirts",
			subCategory: prod.subCategory || "",
			countries: prod.countries || [],
			colors: prod.colors || [],
			sizes: prod.sizes || [],
			isActive: prod.isActive !== undefined ? prod.isActive : true,
			scheduledUploadTime: prod.scheduledUploadTime ? new Date(prod.scheduledUploadTime).toISOString().slice(0, 16) : "",
		});
		if (!animeOptions.includes(prod.animeTag)) {
			setFormData((p) => ({ ...p, animeTag: "Other" }));
			setCustomAnimeTag(prod.animeTag || "");
		} else {
			setCustomAnimeTag("");
		}
		if (!categoryOptions.includes(prod.category)) {
			setFormData((p) => ({ ...p, category: "Other" }));
			setCustomCategory(prod.category || "");
		} else {
			setCustomCategory("");
		}
		if (prod.subCategory && subCategoryMap[prod.category] && !subCategoryMap[prod.category].includes(prod.subCategory)) {
			setFormData((p) => ({ ...p, subCategory: "Other" }));
			setCustomSubCategory(prod.subCategory || "");
		} else {
			setCustomSubCategory("");
		}
		if (!storeOptions.includes(prod.store)) {
			setFormData((p) => ({ ...p, store: "Other" }));
			setCustomStore(prod.store || "");
		} else {
			setCustomStore("");
		}
		setImageItems(
			prod.images
				? prod.images.map((img) => ({
						file: null,
						previewUrl: null,
						url: img.url,
						publicId: img.publicId,
						isMain: img.isMain,
					}))
				: [],
		);
		setVideoItems(
			prod.videos
				? prod.videos.map((vid) => ({
						file: null,
						previewUrl: null,
						url: vid.url,
						publicId: vid.publicId,
						isPrimary: vid.isPrimary,
					}))
				: [],
		);
		setViewMode("form");
	};

	const openCreate = () => {
		setEditingId(null);
		setFormData(initialForm);
		setCustomAnimeTag("");
		setCustomCategory("");
		setCustomSubCategory("");
		setCustomStore("");
		setCustomCountryInput("");
		setImageItems([]);
		setVideoItems([]);
		setViewMode("form");
	};

	const addImageFile = useCallback((file) => {
		if (!file || !file.type.startsWith("image/")) {
			setErrors((p) => ({ ...p, images: "Please provide an image file." }));
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setErrors((p) => ({ ...p, images: "File size must be under 10 MB." }));
			return;
		}
		setErrors((p) => ({ ...p, images: "" }));
		const previewUrl = URL.createObjectURL(file);
		setImageItems((prev) => {
			const isFirst = prev.length === 0;
			return [...prev, { file, previewUrl, url: null, publicId: null, isMain: isFirst }];
		});
	}, []);

	const addVideoFile = useCallback((file) => {
		if (!file || !file.type.startsWith("video/")) {
			setErrors((p) => ({ ...p, videos: "Please provide a video file." }));
			return;
		}
		if (file.size > 200 * 1024 * 1024) {
			setErrors((p) => ({ ...p, videos: "Video must be under 200 MB." }));
			return;
		}
		if (videoItems.length >= 3) {
			setErrors((p) => ({ ...p, videos: "Max 3 videos allowed." }));
			return;
		}
		setErrors((p) => ({ ...p, videos: "" }));
		const previewUrl = URL.createObjectURL(file);
		setVideoItems((prev) => {
			const isFirst = prev.length === 0;
			return [...prev, { file, previewUrl, url: null, publicId: null, isPrimary: isFirst }];
		});
	}, [videoItems.length]);

	useSmartImageDrop(addImageFile, submitting);
	const onDragEnterBox = (e) => { e.preventDefault(); setIsDragOver(true); };
	const onDragLeaveBox = () => setIsDragOver(false);
	const onDropBox = (e) => {
		e.preventDefault(); setIsDragOver(false);
		addImageFile(e.dataTransfer.files?.[0]);
	};
	const onFileChange = (e) => {
		addImageFile(e.target.files?.[0]);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const onVideoDragEnter = (e) => { e.preventDefault(); setIsVideoDragOver(true); };
	const onVideoDragLeave = () => setIsVideoDragOver(false);
	const onVideoDrop = (e) => {
		e.preventDefault(); setIsVideoDragOver(false);
		addVideoFile(e.dataTransfer.files?.[0]);
	};
	const onVideoFileChange = (e) => {
		addVideoFile(e.target.files?.[0]);
		if (videoFileInputRef.current) videoFileInputRef.current.value = "";
	};

	const removeImage = (idx) => {
		setImageItems((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			if (next.length > 0 && !next.some((i) => i.isMain)) next[0].isMain = true;
			return next;
		});
	};
	const setMain = (idx) =>
		setImageItems((prev) => prev.map((img, i) => ({ ...img, isMain: i === idx })));

	const removeVideo = (idx) => {
		setVideoItems((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			if (next.length > 0 && !next.some((v) => v.isPrimary)) next[0].isPrimary = true;
			return next;
		});
	};
	const setPrimaryVideo = (idx) =>
		setVideoItems((prev) => prev.map((vid, i) => ({ ...vid, isPrimary: i === idx })));

	const uploadPendingImages = async () => {
		const pending = imageItems.filter((i) => i.file && !i.url);
		if (!pending.length) return imageItems;
		setUploadingCount(pending.length);
		const token = localStorage.getItem("token");
		const uploaded = await Promise.all(
			imageItems.map(async (item) => {
				if (!item.file || item.url) return item;
				const fd = new FormData();
				fd.append("image", item.file);
				try {
					const res = await apiClient.post("/upload", fd, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (res.data.success)
						return { ...item, url: res.data.data.url, publicId: res.data.data.publicId };
					return item;
				} catch (err) {
					return item;
				}
			}),
		);
		setUploadingCount(0);
		return uploaded;
	};

	const uploadPendingVideos = async () => {
		const pending = videoItems.filter((v) => v.file && !v.url);
		if (!pending.length) return videoItems;
		setUploadingVideoCount(pending.length);
		const token = localStorage.getItem("token");
		const uploaded = await Promise.all(
			videoItems.map(async (item) => {
				if (!item.file || item.url) return item;
				const fd = new FormData();
				fd.append("video", item.file);
				try {
					const res = await apiClient.post("/upload/video", fd, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (res.data.success)
						return { ...item, url: res.data.data.url, publicId: res.data.data.publicId };
					return item;
				} catch (err) {
					return item;
				}
			}),
		);
		setUploadingVideoCount(0);
		return uploaded;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((p) => {
			const updated = { ...p, [name]: value };
			// Reset subCategory when category changes
			if (name === "category") updated.subCategory = "";
			return updated;
		});
		setErrors((p) => ({ ...p, [name]: "" }));
	};
	const handleCountryToggle = (country) => {
		setFormData((p) => ({
			...p,
			countries: p.countries.includes(country)
				? p.countries.filter((c) => c !== country)
				: [...p.countries, country],
		}));
		setErrors((prev) => ({ ...prev, countries: "" }));
	};

	const getCustomCountries = () =>
		formData.countries.filter((c) => c !== "Other" && !countryOptions.includes(c));

	const validateForm = () => {
		const e = {};
		if (!formData.title.trim()) e.title = "Title is required";
		if (!formData.description.trim())
			e.description = "Description is required";
		if (!formData.affiliateLink.trim())
			e.affiliateLink = "Affiliate link is required";
		if (!formData.price || parseFloat(formData.price) <= 0)
			e.price = "Valid price is required";
		if (imageItems.length === 0)
			e.images = "At least one image is required";
		if (formData.countries.length === 0)
			e.countries = "Select at least one country";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitError("");
		setSuccessMessage("");
		if (!validateForm()) return;

		const eValid = {};
		let hasErr = false;
		if (formData.animeTag === "Other" && !customAnimeTag.trim()) {
			eValid.animeTag = "Please specify the anime name";
			hasErr = true;
		}
		if (formData.category === "Other" && !customCategory.trim()) {
			eValid.category = "Please specify the category";
			hasErr = true;
		}
		if (formData.subCategory === "Other" && !customSubCategory.trim()) {
			eValid.subCategory = "Please specify the subcategory";
			hasErr = true;
		}
		if (formData.store === "Other" && !customStore.trim()) {
			eValid.store = "Please specify the store";
			hasErr = true;
		}
		const customCountries = getCustomCountries();
		if (
			formData.countries.includes("Other") &&
			customCountries.length === 0 &&
			!customCountryInput.trim()
		) {
			eValid.countries = "Please specify the custom country";
			hasErr = true;
		}

		if (hasErr) {
			setErrors(eValid);
			return;
		}

		setSubmitting(true);
		try {
			const finalImages = await uploadPendingImages();
			if (finalImages.filter((i) => !i.url).length > 0) {
				setSubmitError("Some images failed to upload.");
				setSubmitting(false);
				return;
			}
			const finalVideos = await uploadPendingVideos();
			if (finalVideos.filter((v) => !v.url).length > 0) {
				setSubmitError("Some videos failed to upload.");
				setSubmitting(false);
				return;
			}
			const payload = {
				...formData,
				animeTag:
					formData.animeTag === "Other"
						? toTitleCase(customAnimeTag.trim())
						: formData.animeTag,
				category:
					formData.category === "Other"
						? toTitleCase(customCategory.trim())
						: formData.category,
				subCategory:
					formData.subCategory === "Other"
						? toTitleCase(customSubCategory.trim())
						: formData.subCategory,
				store:
					formData.store === "Other"
						? toTitleCase(customStore.trim())
						: formData.store,
				countries: formData.countries.filter((c) => c !== "Other"),
				price: parseFloat(formData.price),
				images: finalImages.map(({ url, publicId, isMain }) => ({ url, publicId, isMain })),
				videos: finalVideos.map(({ url, publicId, isPrimary }) => ({ url, publicId, isPrimary })),
				isActive: formData.isActive,
				scheduledUploadTime: formData.scheduledUploadTime || null,
			};

			if (editingId) {
				const res = await apiClient.put(
					`/products/${editingId}`,
					payload,
				);
				if (res.data.success) {
					setSuccessMessage("Product updated successfully!");
					setTimeout(() => setViewMode("list"), 1500);
				}
			} else {
				const res = await apiClient.post("/products", payload);
				if (res.data.success) {
					setSuccessMessage("Product created successfully!");
					setTimeout(() => setViewMode("list"), 1500);
				}
			}
		} catch (err) {
			setSubmitError(
				err.response?.data?.message || "Failed to save product",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (!user)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-white">Please log in</p>
			</div>
		);

	const mainPreview = imageItems.find((i) => i.isMain) || imageItems[0];
	const isWorking = submitting || uploadingCount > 0;

	return (
		<div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-black pb-16">
			{(submitting || isDeleting) && (
				<LoadingAnimation
					variant="overlay"
					message={
						submitting
							? uploadingVideoCount > 0
								? `Uploading ${uploadingVideoCount} video(s)...`
								: uploadingCount > 0
									? `Uploading ${uploadingCount} image(s)...`
									: "Saving Product..."
							: "Deleting Product..."
					}
					submessage="Please wait"
				/>
			)}
			<header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-purple-300">
							<BoxIcon className="h-6 w-6" />
						</div>
						<h1 className="hidden sm:block text-xl font-bold text-white">
							{viewMode === "list"
								? "Product Management"
								: editingId
									? "Edit Product"
									: "Add New Product"}
						</h1>
						<h1 className="sm:hidden text-lg font-bold text-white">
							{viewMode === "list" ? "Products" : "Edit"}
						</h1>
					</div>

					{/* Desktop Menu */}
					<div className="hidden sm:flex gap-3">
						{viewMode === "form" && (
							<Button
								onClick={() => setViewMode("list")}
								variant="secondary"
								size="sm"
							>
								Cancel
							</Button>
						)}
						<Button
							onClick={() => navigate("/admin/dashboard")}
							variant="secondary"
							size="sm"
						>
							Dashboard
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-purple-400 transition-colors"
					>
						<svg
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{mobileMenuOpen ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							)}
						</svg>
					</button>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className="sm:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 space-y-2">
						{viewMode === "form" && (
							<Button
								onClick={() => {
									setViewMode("list");
									setMobileMenuOpen(false);
								}}
								variant="secondary"
								size="sm"
								className="w-full text-left"
							>
								Cancel
							</Button>
						)}
						<Button
							onClick={() => {
								navigate("/admin/dashboard");
								setMobileMenuOpen(false);
							}}
							variant="secondary"
							size="sm"
							className="w-full text-left"
						>
							Dashboard
						</Button>
					</div>
				)}
			</header>

			<div className="max-w-6xl mx-auto px-4 py-8">
				{viewMode === "list" ? (
					<div>
						{/* ── Catalog Header ── */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
							<div className="flex flex-wrap justify-between items-start gap-4 mb-5">
								<div>
									<h2 className="text-2xl font-bold text-white mb-1">
										Product Catalog
									</h2>
									<p className="text-zinc-400 text-sm">
										Manage {products.length} products
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										onClick={() => setShowScheduledModal(true)}
										variant="secondary"
										className="border border-purple-500/30 hover:border-purple-500"
									>
										Manage Scheduled
									</Button>
									<Button
										onClick={openCreate}
										className="bg-purple-600 hover:bg-purple-700"
									>
										+ Add Product
									</Button>
								</div>
							</div>

							{/* ── Search Bar ── */}
							<div className="relative mb-4">
								<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search by title, anime, category, store…"
									className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
								/>
								{searchQuery && (
									<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
									</button>
								)}
							</div>

							{/* ── Filters Row ── */}
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
								<SearchableDropdown
									label="Sort By"
									value={sortBy}
									onChange={(v) => setSortBy(v)}
									options={[
										{ value: "-createdAt", label: "Newest First" },
										{ value: "createdAt", label: "Oldest First" },
										{ value: "-views", label: "Most Views" },
										{ value: "-clicks", label: "Most Card Clicks" },
										{ value: "-buyNowClicks", label: "Most Buy Now Clicks" },
										{ value: "price", label: "Price ↑" },
										{ value: "-price", label: "Price ↓" },
										{ value: "title", label: "Title A–Z" }
									]}
								/>

								<SearchableDropdown
									label="Category"
									value={filterCategory}
									onChange={(v) => setFilterCategory(v)}
									options={finalCategoryOptions}
								/>

								<SearchableDropdown
									label="Anime"
									value={filterAnime}
									onChange={(v) => setFilterAnime(v)}
									options={finalAnimeOptions}
								/>

								<SearchableDropdown
									label="Store"
									value={filterStore}
									onChange={(v) => setFilterStore(v)}
									options={finalStoreOptions}
								/>

								<SearchableDropdown
									label="Country"
									value={filterCountry}
									onChange={(v) => setFilterCountry(v)}
									options={finalCountryOptions}
								/>

								<SearchableDropdown
									label="Status"
									value={filterStatus}
									onChange={(v) => setFilterStatus(v)}
									options={[
										{ value: "All", label: "All Statuses" },
										{ value: "Active", label: "Active" },
										{ value: "Inactive", label: "Inactive (Private)" },
										{ value: "Scheduled", label: "Scheduled" }
									]}
								/>
							</div>

							{/* Active filter chips */}
							{(searchQuery || filterCategory !== "All" || filterAnime !== "All" || filterStore !== "All" || filterCountry !== "All" || filterStatus !== "All") && (
								<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800">
									<span className="text-xs text-zinc-500">Active filters:</span>
									{searchQuery && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">Search: "{searchQuery}"</span>}
									{filterCategory !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterCategory}</span>}
									{filterAnime !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterAnime}</span>}
									{filterStore !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterStore}</span>}
									{filterCountry !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterCountry}</span>}
									{filterStatus !== "All" && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-800/50">{filterStatus}</span>}
									<button onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterAnime("All"); setFilterStore("All"); setFilterCountry("All"); setFilterStatus("All"); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors underline">Clear all</button>
								</div>
							)}
						</div>

						{loadingList ? (
						<div className="flex justify-center items-center py-12">
							<p className="text-zinc-400">
								Loading products...
							</p>
						</div>
					) : (() => {
						// Client-side filter + sort
						const q = searchQuery.toLowerCase();
						let filtered = products.filter((p) => {
							if (q && !p.title?.toLowerCase().includes(q) && !p.animeTag?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q) && !p.store?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
							if (filterCategory !== "All" && p.category !== filterCategory) return false;
							if (filterAnime !== "All" && p.animeTag !== filterAnime) return false;
							if (filterStore !== "All" && p.store !== filterStore) return false;
							if (filterCountry !== "All" && !(p.countries || []).includes(filterCountry)) return false;
							
							if (filterStatus === "Active") {
								if (!p.isActive || (p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date())) return false;
							}
							if (filterStatus === "Inactive") {
								if (p.isActive) return false;
							}
							if (filterStatus === "Scheduled") {
								if (!p.scheduledUploadTime || new Date(p.scheduledUploadTime) <= new Date()) return false;
							}

							return true;
						});
						// Sort
						filtered = [...filtered].sort((a, b) => {
							switch (sortBy) {
								case "-createdAt": return new Date(b.createdAt) - new Date(a.createdAt);
								case "createdAt":  return new Date(a.createdAt) - new Date(b.createdAt);
								case "-views":    return (b.views || 0) - (a.views || 0);
								case "-clicks":   return (b.clicks || 0) - (a.clicks || 0);
								case "-buyNowClicks": return (b.buyNowClicks || 0) - (a.buyNowClicks || 0);
								case "price":     return (a.price || 0) - (b.price || 0);
								case "-price":    return (b.price || 0) - (a.price || 0);
								case "title":     return (a.title || "").localeCompare(b.title || "");
								default: return 0;
							}
						});

						if (products.length === 0) return (
							<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
								<BoxIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold text-white mb-2">No Products Yet</h3>
								<p className="text-zinc-400 mb-6">Start by adding your first product to the catalog</p>
								<Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">Create First Product</Button>
							</div>
						);

						if (filtered.length === 0) return (
							<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
								<BoxIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
								<p className="text-zinc-400 mb-4">Try adjusting your search or filters.</p>
								<button onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterAnime("All"); setFilterStore("All"); setFilterCountry("All"); }} className="text-purple-400 hover:underline text-sm">Clear filters</button>
							</div>
						);

						return (
						<>
						<p className="text-zinc-500 text-xs mb-3">Showing {filtered.length} of {products.length} products</p>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filtered.map((p) => (
									<div
										key={p._id}
										className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500 transition-colors group"
									>
										{/* Product Image */}
										<div className="relative overflow-hidden bg-zinc-800 aspect-square">
											<img
												src={
													p.images?.[0]?.url ||
													"placeholder.jpg"
												}
												alt={p.title}
												className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
											/>
											<div className="absolute top-3 left-3">
												<span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
													{p.animeTag}
												</span>
											</div>
											<div className="absolute top-3 right-3">
												<span className="bg-zinc-900 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
													{p.store}
												</span>
											</div>
										</div>

										{/* Product Info */}
										<div className="p-4 space-y-3">
											<div>
												<h3 className="font-bold text-white line-clamp-2 text-sm">
													{p.title}
												</h3>
												<p className="text-zinc-500 text-xs mt-1">
													{p.category}{p.subCategory ? ` \u00b7 ${p.subCategory}` : ""}
												</p>
											</div>

											{/* Stats */}
											<div className="grid grid-cols-3 gap-2 text-xs">
												<div className="bg-zinc-800/50 rounded p-2 text-center">
													<p className="text-zinc-500">
														Views
													</p>
													<p className="text-purple-400 font-bold">
														{p.views || 0}
													</p>
												</div>
												<div className="bg-zinc-800/50 rounded p-2 text-center">
													<p className="text-zinc-500">
														Card Clicks
													</p>
													<p className="text-purple-400 font-bold">
														{p.clicks || 0}
													</p>
												</div>
												<div className="bg-zinc-800/50 rounded p-2 text-center">
													<p className="text-zinc-500">
														Buy Now Clicks
													</p>
													<p className="text-purple-400 font-bold">
														{p.buyNowClicks || 0}
													</p>
												</div>
											</div>

											{/* Price */}
											<div className="flex items-center justify-between pt-2 border-t border-zinc-800">
												<span className="text-purple-400 font-bold">
													{p.currency} {p.price}
												</span>
												<div className="flex gap-2 items-center">
													{(!p.isActive) && (
														<span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700" title="Private Mode">
															Private
														</span>
													)}
													{(p.isActive && p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date()) && (
														<span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-800/50" title={`Scheduled for ${new Date(p.scheduledUploadTime).toLocaleString()}`}>
															Scheduled
														</span>
													)}
													<span
														className={`text-xs px-2 py-1 rounded ${p.inStock ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
													>
														{p.inStock
															? "In Stock"
															: "Out of Stock"}
													</span>
												</div>
											</div>

											{/* Actions */}
											<div className="flex gap-2 pt-3 border-t border-zinc-800">
												<button
													onClick={() => openEdit(p)}
													className="flex-1 px-3 py-2 rounded bg-zinc-800 hover:bg-purple-600/30 text-purple-400 text-sm font-medium transition-colors border border-zinc-700 hover:border-purple-500"
												>
													Edit
												</button>
												<button
													onClick={() =>
														handleDelete(p._id)
													}
													className="flex-1 px-3 py-2 rounded bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm font-medium transition-colors border border-red-900/30"
												>
													Delete
												</button>
											</div>
										</div>
									</div>
									))}
								</div>
							</>
							);
						})()
						}
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
							<form onSubmit={handleSubmit} className="space-y-6">
								{submitError && (
									<div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
										{submitError}
									</div>
								)}
								{successMessage && (
									<div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-200 text-sm">
										{successMessage}
									</div>
								)}

								<div className="space-y-4">
									<h3 className="text-lg font-bold text-white">
										Basic Information
									</h3>
									<Input
										label="Product Title"
										name="title"
										placeholder="e.g., Attack on Titan Hoodie"
										value={formData.title}
										onChange={handleInputChange}
										error={errors.title}
										maxLength={300}
										required
									/>
									<p className="text-xs text-right -mt-3" style={{ color: formData.title.length > 270 ? '#f87171' : '#71717a' }}>{formData.title.length}/300</p>
									<div>
										<label className="block text-sm font-medium text-zinc-200 mb-2">
											Description
										</label>
										<textarea
											name="description"
											placeholder="Detailed product description"
											value={formData.description}
											onChange={handleInputChange}
											rows="4"
											maxLength={2000}
											className={`w-full px-4 py-2.5 rounded-lg bg-zinc-800 border text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.description ? "border-red-500" : "border-zinc-700"}`}
										/>
										<div className="flex justify-between items-start mt-1">
											{errors.description ? (
												<p className="text-red-500 text-xs">{errors.description}</p>
											) : <span />}
											<p className="text-xs ml-auto" style={{ color: formData.description.length > 1900 ? '#f87171' : '#71717a' }}>{formData.description.length}/2000</p>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Category
											</label>
											<SearchableSelect
												name="category"
												value={formData.category}
												onChange={handleInputChange}
												options={categoryOptions}
												placeholder="Select Category"
											/>
											{formData.category === "Other" && (
												<Input
													placeholder="Enter custom category"
													value={customCategory}
													onChange={(e) => setCustomCategory(e.target.value)}
													className="mt-2"
													error={errors.category}
													required
												/>
											)}
										</div>
										{/* SubCategory - shown when the selected category has subcategories or is Other */}
										{(subCategoryMap[formData.category]?.length > 0 || formData.category === "Other") && (
											<div>
												<label className="block text-sm font-medium text-zinc-200 mb-2">
													Sub Category
													<span className="ml-2 text-xs text-zinc-500">(optional)</span>
												</label>
												{formData.category === "Other" ? (
													<Input
														placeholder="Enter custom sub-category"
														value={customSubCategory}
														onChange={(e) => setCustomSubCategory(e.target.value)}
													/>
												) : (
													<>
														<SearchableSelect
															name="subCategory"
															value={formData.subCategory}
															onChange={handleInputChange}
															options={[...(subCategoryMap[formData.category] || []), "Other"]}
															placeholder="— Select sub-category —"
														/>
														{formData.subCategory === "Other" && (
															<Input
																placeholder="Enter custom sub-category"
																value={customSubCategory}
																onChange={(e) => setCustomSubCategory(e.target.value)}
																className="mt-2"
																error={errors.subCategory}
																required
															/>
														)}
													</>
												)}
												{(formData.subCategory || customSubCategory) && (
													<p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
														<span>✓</span> Sub-category set
													</p>
												)}
											</div>
										)}
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Anime
											</label>
											<SearchableSelect
												name="animeTag"
												value={formData.animeTag}
												onChange={handleInputChange}
												options={animeOptions}
												placeholder="Select Anime"
											/>
											{formData.animeTag === "Other" && (
												<Input
													placeholder="Enter custom anime name"
													value={customAnimeTag}
													onChange={(e) =>
														setCustomAnimeTag(
															e.target.value,
														)
													}
													className="mt-2"
													required
												/>
											)}
											{errors.animeTag && (
												<p className="text-red-500 text-xs mt-1">
													{errors.animeTag}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Pricing & Links
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="md:col-span-2">
											<Input
												label="Price"
												name="price"
												type="number"
												step="0.01"
												placeholder="29.99"
												value={formData.price}
												onChange={handleInputChange}
												error={errors.price}
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Currency
											</label>
											<select
												name="currency"
												value={formData.currency}
												onChange={handleInputChange}
												className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
											>
												{currencyOptions.map((o) => (
													<option key={o} value={o}>
														{o}
													</option>
												))}
											</select>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Store
											</label>
											<SearchableSelect
												name="store"
												value={formData.store}
												onChange={handleInputChange}
												options={storeOptions}
												placeholder="Select Store"
											/>
											{formData.store === "Other" && (
												<Input
													placeholder="Enter custom store name"
													value={customStore}
													onChange={(e) => setCustomStore(e.target.value)}
													className="mt-2"
													error={errors.store}
													required
												/>
											)}
										</div>
										<div className="md:col-span-2">
											<Input
												label="Affiliate Link"
												name="affiliateLink"
												placeholder="https://..."
												value={formData.affiliateLink}
												onChange={handleInputChange}
												error={errors.affiliateLink}
												required
											/>
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Visibility & Scheduling
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="flex items-center gap-2 cursor-pointer mb-2">
												<input
													type="checkbox"
													name="isActive"
													checked={!formData.isActive}
													onChange={(e) => setFormData(p => ({...p, isActive: !e.target.checked}))}
													className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-purple-500"
												/>
												<span className="text-sm font-medium text-white">Private Mode (Hide Product)</span>
											</label>
											<p className="text-xs text-zinc-500 ml-6">If enabled, the product will be inactive and hidden from the main site. Use this for invalid links.</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Schedule Upload Time
											</label>
											<input
												type="datetime-local"
												name="scheduledUploadTime"
												value={formData.scheduledUploadTime}
												onChange={handleInputChange}
												className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
											/>
											<p className="text-xs text-zinc-500 mt-1">Leave empty to publish immediately (or use active/inactive status).</p>
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Target Regions
									</h3>
									<div className="flex flex-wrap gap-3">
										{countryOptions.map((c) => (
											<button
												key={c}
												type="button"
												onClick={() => handleCountryToggle(c)}
												className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.countries.includes(c) ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
											>
												{c}
											</button>
										))}
										<button
											type="button"
											onClick={() => handleCountryToggle("Other")}
											className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.countries.includes("Other") ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
										>
											Other
										</button>
									</div>
									{formData.countries.includes("Other") && (
										<div className="mt-3">
											<label className="block text-sm font-medium text-zinc-200 mb-2">Custom Countries (Press Enter to add)</label>
											<div className="flex flex-wrap gap-2 mb-2">
												{getCustomCountries().map(tag => (
													<span key={tag} className="bg-purple-600/30 border border-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
														{tag}
														<button type="button" onClick={() => handleCountryToggle(tag)} className="text-purple-300 hover:text-white">&times;</button>
													</span>
												))}
											</div>
											<Input
												placeholder="Type a country and press Enter"
												value={customCountryInput}
												onChange={(e) => {
													setCustomCountryInput(e.target.value);
													if (errors.countries) {
														setErrors((prev) => ({ ...prev, countries: "" }));
													}
												}}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const val = toTitleCase(customCountryInput.trim());
														if (val && !formData.countries.includes(val)) {
															setFormData(p => ({ ...p, countries: [...p.countries, val] }));
														}
														setCustomCountryInput("");
														setErrors((prev) => ({ ...prev, countries: "" }));
													}
												}}
											/>
											{getCustomCountries().length > 0 && !customCountryInput.trim() && (
												<p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
													<span>✓</span> {getCustomCountries().length} custom {getCustomCountries().length === 1 ? "country" : "countries"} added
												</p>
											)}
										</div>
									)}
									{errors.countries && (
										<p className="text-red-500 text-xs mt-1">
											{errors.countries}
										</p>
									)}
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<div className="flex justify-between items-center">
										<h3 className="text-lg font-bold text-white">
											Product Images
										</h3>
										<span className="text-xs text-zinc-400">
											{imageItems.length} / 10 added
										</span>
									</div>
									<div
										onDragEnter={onDragEnterBox}
										onDragOver={(e) => e.preventDefault()}
										onDragLeave={onDragLeaveBox}
										onDrop={onDropBox}
										onClick={() =>
											fileInputRef.current?.click()
										}
										className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragOver ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"}`}
									>
										<UploadIcon className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
										<p className="text-white font-medium mb-1">
											Click or drag images here
										</p>
										<p className="text-zinc-500 text-sm mb-4">
											Ctrl+V to paste. Max 10 images,
											under 10MB each.
										</p>
										<input
											ref={fileInputRef}
											type="file"
											multiple
											accept="image/*"
											onChange={onFileChange}
											className="hidden"
										/>
									</div>
									{errors.images && (
										<p className="text-red-500 text-xs text-center">
											{errors.images}
										</p>
									)}
									{imageItems.length > 0 && (
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
											{imageItems.map((img, idx) => (
												<div
													key={idx}
													className={`relative group aspect-square rounded-xl overflow-hidden bg-zinc-800 border-2 ${img.isMain ? "border-purple-500" : "border-transparent hover:border-zinc-600"}`}
												>
													<img
														src={
															img.previewUrl ||
															img.url
														}
														alt=""
														className="w-full h-full object-cover transition-transform group-hover:scale-105"
													/>
													<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
														<div className="flex justify-end">
															<button
																type="button"
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	removeImage(
																		idx,
																	);
																}}
																className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
															>
																×
															</button>
														</div>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																setMain(idx);
															}}
															className={`py-1.5 text-xs font-semibold rounded-lg w-full ${img.isMain ? "bg-purple-600 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}
														>
															{img.isMain
																? "Main Image"
																: "Set as Main"}
														</button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* ── Product Videos ── */}
								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<div className="flex justify-between items-center">
										<div>
											<h3 className="text-lg font-bold text-white">Product Videos</h3>
											<p className="text-xs text-zinc-500 mt-0.5">Optional · Max 3 videos · Up to 200 MB each</p>
										</div>
										<span className="text-xs text-zinc-400">{videoItems.length} / 3 added</span>
									</div>

									{videoItems.length < 3 && (
										<div
											onDragEnter={onVideoDragEnter}
											onDragOver={(e) => e.preventDefault()}
											onDragLeave={onVideoDragLeave}
											onDrop={onVideoDrop}
											onClick={() => videoFileInputRef.current?.click()}
											className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
												isVideoDragOver
													? "border-blue-500 bg-blue-500/10"
													: "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"
											}`}
										>
											<svg className="mx-auto h-10 w-10 text-zinc-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
											</svg>
											<p className="text-white font-medium mb-1">Click or drag a video here</p>
											<p className="text-zinc-500 text-sm">MP4, WebM, MOV — max 200 MB</p>
											<input
												ref={videoFileInputRef}
												type="file"
												accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
												onChange={onVideoFileChange}
												className="hidden"
											/>
										</div>
									)}

									{errors.videos && (
										<p className="text-red-500 text-xs">{errors.videos}</p>
									)}

									{videoItems.length > 0 && (
										<div className="space-y-3 mt-2">
											{videoItems.map((vid, idx) => (
												<div
													key={idx}
													className={`rounded-xl overflow-hidden border-2 ${
														vid.isPrimary ? "border-blue-500" : "border-zinc-700"
													}`}
												>
													<video
														src={vid.previewUrl || vid.url}
														controls
														preload="metadata"
														className="w-full max-h-48 object-contain bg-black"
													/>
													<div className="flex items-center justify-between px-3 py-2 bg-zinc-900">
														<div className="flex items-center gap-2">
															{vid.isPrimary ? (
																<span className="text-xs text-blue-400 font-semibold">&#9679; Primary Video</span>
															) : (
																<button type="button" onClick={() => setPrimaryVideo(idx)} className="text-xs text-zinc-400 hover:text-blue-400 transition-colors">
																	Set as Primary
																</button>
															)}
															{!vid.url && <span className="text-xs text-yellow-500">⏳ Pending</span>}
															{vid.url && <span className="text-xs text-green-500">✓ Saved</span>}
														</div>
														<button type="button" onClick={() => removeVideo(idx)} className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors">&times;</button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="pt-8">
									<Button
										type="submit"
										disabled={isWorking}
										className="w-full h-14 text-lg bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/20"
									>
										{isWorking
											? uploadingVideoCount > 0
												? `Uploading ${uploadingVideoCount} video(s)...`
												: uploadingCount > 0
												? `Uploading ${uploadingCount} image(s)...`
												: "Saving Product..."
											: editingId
												? "Update Product"
												: "Create Product"}
									</Button>
								</div>
							</form>
						</div>

						<div className="lg:col-span-1">
							<div className="sticky top-28 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
								<h3 className="text-lg font-bold text-white mb-4">
									Card Preview
								</h3>
								{!formData.title && !mainPreview ? (
									<div className="aspect-3/4 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
										Fill out form to see preview
									</div>
								) : (
									<div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
										<div className="aspect-square bg-zinc-800 relative">
											{mainPreview ? (
												<img
													src={
														mainPreview.previewUrl ||
														mainPreview.url
													}
													alt=""
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-zinc-600">
													No Image
												</div>
											)}
											<div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
												{formData.animeTag === "Other"
													? customAnimeTag || "Anime"
													: formData.animeTag}
											</div>
											<div className="absolute top-3 right-3 bg-zinc-900 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
												{formData.store}
											</div>
										</div>
										<div className="p-4">
											<h4 className="font-bold text-white line-clamp-2">
												{formData.title ||
													"Product Title"}
											</h4>
											<div className="mt-2 flex flex-wrap items-start justify-between gap-1">
												<div className="flex flex-col gap-1">
													<span className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded">
														{formData.category}
													</span>
													{formData.subCategory && (
														<span className="bg-violet-900/40 text-violet-300 text-xs px-2.5 py-1 rounded border border-violet-800/50">
															{formData.subCategory}
														</span>
													)}
												</div>
												<span className="text-purple-400 font-bold">
													{formData.currency}{" "}
													{formData.price || "0.00"}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
			{/* Scheduled Products Modal */}
			{showScheduledModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
					<div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
						<div className="p-6 border-b border-zinc-800 flex justify-between items-center">
							<div>
								<h2 className="text-xl font-bold text-white">Scheduled Products</h2>
								<p className="text-zinc-400 text-sm mt-1">Manage products that are scheduled to be published in the future.</p>
							</div>
							<button onClick={() => setShowScheduledModal(false)} className="text-zinc-400 hover:text-white transition-colors">
								<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="p-6 overflow-y-auto flex-1">
							{products.filter(p => p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date()).length === 0 ? (
								<div className="text-center py-12">
									<BoxIcon className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
									<p className="text-zinc-400 font-medium">No scheduled products.</p>
								</div>
							) : (
								<div className="space-y-4">
									{products.filter(p => p.scheduledUploadTime && new Date(p.scheduledUploadTime) > new Date()).map(p => (
										<div key={p._id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 hover:border-purple-500/50 transition-colors">
											<div className="flex items-center gap-4">
												<img src={p.images?.[0]?.url || "placeholder.jpg"} className="w-14 h-14 rounded-lg object-cover border border-zinc-700" alt="" />
												<div>
													<p className="text-white font-bold text-sm line-clamp-1">{p.title}</p>
													<p className="text-purple-400 text-xs mt-1 flex items-center gap-1">
														<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														Scheduled: {new Date(p.scheduledUploadTime).toLocaleString()}
													</p>
												</div>
											</div>
											<Button size="sm" variant="secondary" onClick={() => { setShowScheduledModal(false); openEdit(p); }} className="whitespace-nowrap">Edit Product</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProductManagement;
