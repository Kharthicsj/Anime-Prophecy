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
import FilterBar from "../../components/common/FilterBar";
import { FiCopy, FiX, FiRefreshCw, FiSearch, FiArrowDown, FiLink, FiLock } from "react-icons/fi";
import { SiAliexpress, SiFlipkart } from "react-icons/si";
import { FaAmazon } from "react-icons/fa";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ThemeController from "./ThemeController";

import { ANIME_OPTIONS, STORE_OPTIONS, CATEGORY_OPTIONS, SUB_CATEGORY_MAP, CURRENCY_LIST, CURRENCY_SYMBOL_MAP } from "../../utils/constants";
import { toTitleCase, mergeUnique } from "../../utils/helpers";
import SortableImageItem from "../../components/ui/SortableImageItem";
import SortableVideoItem from "../../components/ui/SortableVideoItem";
import CurrencySearchableSelect from "../../components/ui/CurrencySearchableSelect";
import CopyProductModal from "../../components/admin/CopyProductModal";
import AffiliateSelectionModal from "../../components/admin/AffiliateSelectionModal";
import AffiliateBulkModal from "../../components/admin/AffiliateBulkModal";
import PrivateProductsModal from "../../components/admin/PrivateProductsModal";
import PinterestExportModal from "../../components/admin/PinterestExportModal";

import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

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

	// ─── Copy-from-product feature ───────────────────────────────────────────────
	const [showCopyModal, setShowCopyModal] = useState(false);
	const [copiedFromProduct, setCopiedFromProduct] = useState(""); // name of product metadata was copied from
	const [isCopying, setIsCopying] = useState(false);
	const [urlToFetch, setUrlToFetch] = useState("");
	const [isFetchingUrl, setIsFetchingUrl] = useState(false);

	// Search / Sort / Filter state for list view
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("-createdAt");
	const [filterCategory, setFilterCategory] = useState("All");
	const [filterAnime, setFilterAnime] = useState("All");
	const [filterStore, setFilterStore] = useState("All");
	const [filterCountry, setFilterCountry] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	const [showScheduledModal, setShowScheduledModal] = useState(false);
	const [showPrivateModal, setShowPrivateModal] = useState(false);
	const [showAffiliateModal, setShowAffiliateModal] = useState(false);
	const [showPinterestModal, setShowPinterestModal] = useState(false);
	const [selectedAffiliatePlatform, setSelectedAffiliatePlatform] = useState(null);

	// Pagination & Infinite Scroll states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalProducts, setTotalProducts] = useState(0);
	const sentinelRef = useRef(null);
	const isFetchingRef = useRef(false);
	const PAGE_SIZE = 30;

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
		pinterestExported: false,
		pinterestExports: [],
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

	// Subcategory map is now module-level SUB_CATEGORY_MAP
	const subCategoryMap = SUB_CATEGORY_MAP;

	// Use module-level constants (stable references)
	const animeOptions = ANIME_OPTIONS;
	const storeOptions = STORE_OPTIONS;
	const categoryOptions = CATEGORY_OPTIONS;
	const countryOptions = countries.map((c) => c.value);

	// ─── Form dropdown options (static + dynamic, "Other" always last) ──────────
	const formAnimeOptions = useMemo(() => [
		...mergeUnique(animeOptions, dynamicOptions.animeTags).filter(v => v !== "Other"),
		"Other",
	], [dynamicOptions.animeTags]);

	const formStoreOptions = useMemo(() => [
		...mergeUnique(storeOptions, dynamicOptions.stores).filter(v => v !== "Other"),
		"Other",
	], [dynamicOptions.stores]);

	const formCategoryOptions = useMemo(() => [
		...mergeUnique(categoryOptions, dynamicOptions.categories).filter(v => v !== "Other"),
		"Other",
	], [dynamicOptions.categories]);
	// Build a lookup map: code → symbol
	const currencyOptions = CURRENCY_LIST.map(c => c.code);


	const fetchProducts = useCallback(async (page = 1, reset = false) => {
		if (isFetchingRef.current) return;
		isFetchingRef.current = true;
		if (reset) setLoadingList(true);

		try {
			const params = new URLSearchParams({
				page,
				limit: PAGE_SIZE,
				sort: sortBy || "-createdAt",
				...(searchQuery && { search: searchQuery }),
				...(filterAnime !== "All" && { animeTag: filterAnime }),
				...(filterCategory !== "All" && { category: filterCategory }),
				...(filterStore !== "All" && { store: filterStore }),
				...(filterCountry !== "All" && { country: filterCountry }),
				...(filterStatus !== "All" && { status: filterStatus === "Inactive (Private)" ? "inactive" : filterStatus.toLowerCase() }),
			});
			const res = await apiClient.get(`/products/admin/all?${params}`);
			const data = res.data?.data;
			const newProducts = Array.isArray(data?.products) ? data.products : [];
			const total = data?.pagination?.total || 0;

			setTotalProducts(total);
			setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
			setHasMore(newProducts.length === PAGE_SIZE && newProducts.length < total);
			setCurrentPage(page);
		} catch (err) {
			console.error(err);
		} finally {
			if (reset) setLoadingList(false);
			isFetchingRef.current = false;
		}
	}, [searchQuery, sortBy, filterCategory, filterAnime, filterStore, filterCountry, filterStatus]);

	// mergeUnique is defined at module level

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
			setProducts([]);
			setCurrentPage(1);
			setHasMore(true);
			fetchProducts(1, true);
		}
	}, [user, viewMode, fetchProducts]);

	// Intersection Observer for list view
	useEffect(() => {
		if (viewMode !== "list") return;
		const el = sentinelRef.current;
		if (!el) return;

		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !loadingList && !isFetchingRef.current) {
				fetchProducts(currentPage + 1, false);
			}
		}, { rootMargin: '100px' });

		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, loadingList, currentPage, fetchProducts, viewMode]);

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this product?"))
			return;
		setIsDeleting(true);
		try {
			await apiClient.delete(`/products/${id}`);
			setProducts([]);
			setCurrentPage(1);
			setHasMore(true);
			fetchProducts(1, true);
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
			pinterestExported: prod.pinterestExported || false,
			pinterestExports: prod.pinterestExports || [],
		});
		// Use merged (static + dynamic) lists so DB-stored custom values are recognised
		const allAnime = mergeUnique(animeOptions, dynamicOptions.animeTags);
		const allCategories = mergeUnique(categoryOptions, dynamicOptions.categories);
		const allStores = mergeUnique(storeOptions, dynamicOptions.stores);

		if (!allAnime.includes(prod.animeTag)) {
			setFormData((p) => ({ ...p, animeTag: "Other" }));
			setCustomAnimeTag(prod.animeTag || "");
		} else {
			setCustomAnimeTag("");
		}
		if (!allCategories.includes(prod.category)) {
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
		if (!allStores.includes(prod.store)) {
			setFormData((p) => ({ ...p, store: "Other" }));
			setCustomStore(prod.store || "");
		} else {
			setCustomStore("");
		}
		setImageItems(
			prod.images
				? prod.images.map((img) => ({
					id: img.publicId || `img-${Math.random().toString(36).substr(2, 9)}`,
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
					id: vid.publicId || `vid-${Math.random().toString(36).substr(2, 9)}`,
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
		setCopiedFromProduct("");
		// Ensure product list is available for the copy-modal even if admin never visited list view
		if (products.length === 0) fetchProducts();
		setViewMode("form");
	};

	const urlToFile = async (url, filename) => {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error("Network response was not ok");
			const blob = await res.blob();
			return new File([blob], filename, { type: blob.type });
		} catch (err) {
			console.error("Failed to fetch media:", err);
			return null;
		}
	};

	// ─── Apply metadata template from an existing product ────────────────────────
	const applyProductTemplate = async (sourceProduct) => {
		const allAnime = mergeUnique(animeOptions, dynamicOptions.animeTags);
		const allCategories = mergeUnique(categoryOptions, dynamicOptions.categories);
		const allStores = mergeUnique(storeOptions, dynamicOptions.stores);

		setFormData(prev => ({
			...prev,
			title: sourceProduct.title || "",
			description: sourceProduct.description || "",
			animeTag: sourceProduct.animeTag || "AOT",
			store: sourceProduct.store || "Amazon",
			affiliateLink: sourceProduct.affiliateLink || "", // ALL data included
			price: sourceProduct.price || "",
			currency: sourceProduct.currency || "USD",
			category: sourceProduct.category || "Clothing",
			subCategory: sourceProduct.subCategory || "",
			countries: sourceProduct.countries || ["US"],
			colors: sourceProduct.colors || [],
			sizes: sourceProduct.sizes || [],
			isActive: sourceProduct.isActive !== undefined ? sourceProduct.isActive : true,
			scheduledUploadTime: sourceProduct.scheduledUploadTime ? new Date(sourceProduct.scheduledUploadTime).toISOString().slice(0, 16) : "",
		}));

		// Handle custom anime
		if (!allAnime.includes(sourceProduct.animeTag)) {
			setFormData(p => ({ ...p, animeTag: "Other" }));
			setCustomAnimeTag(sourceProduct.animeTag || "");
		} else { setCustomAnimeTag(""); }

		// Handle custom category
		if (!allCategories.includes(sourceProduct.category)) {
			setFormData(p => ({ ...p, category: "Other" }));
			setCustomCategory(sourceProduct.category || "");
		} else { setCustomCategory(""); }

		// Handle custom subcategory
		if (sourceProduct.subCategory && subCategoryMap[sourceProduct.category] && !subCategoryMap[sourceProduct.category].includes(sourceProduct.subCategory)) {
			setFormData(p => ({ ...p, subCategory: "Other" }));
			setCustomSubCategory(sourceProduct.subCategory || "");
		} else { setCustomSubCategory(""); }

		// Handle custom store
		if (!allStores.includes(sourceProduct.store)) {
			setFormData(p => ({ ...p, store: "Other" }));
			setCustomStore(sourceProduct.store || "");
		} else { setCustomStore(""); }

		setErrors({});
		setSubmitError("");
		setCopiedFromProduct(sourceProduct.title || "selected product");
		setShowCopyModal(false);

		setIsCopying(true);
		try {
			// Fetch and set images as new files so they can be re-uploaded
			const newImageItems = [];
			if (sourceProduct.images && sourceProduct.images.length > 0) {
				for (let i = 0; i < sourceProduct.images.length; i++) {
					const img = sourceProduct.images[i];
					const file = await urlToFile(img.url, `copied_image_${i}.jpg`);
					if (file) {
						newImageItems.push({
							id: `img-${Math.random().toString(36).substr(2, 9)}`,
							file: file,
							previewUrl: URL.createObjectURL(file),
							url: null, // force re-upload
							publicId: null,
							isMain: img.isMain
						});
					}
				}
			}
			setImageItems(newImageItems);

			const newVideoItems = [];
			if (sourceProduct.videos && sourceProduct.videos.length > 0) {
				for (let i = 0; i < sourceProduct.videos.length; i++) {
					const vid = sourceProduct.videos[i];
					const file = await urlToFile(vid.url, `copied_video_${i}.mp4`);
					if (file) {
						newVideoItems.push({
							id: `vid-${Math.random().toString(36).substr(2, 9)}`,
							file: file,
							previewUrl: URL.createObjectURL(file),
							url: null, // force re-upload
							publicId: null,
							isPrimary: vid.isPrimary
						});
					}
				}
			}
			setVideoItems(newVideoItems);
		} finally {
			setIsCopying(false);
		}
	};

	const fetchFromUrl = async () => {
		if (!urlToFetch) {
			alert("Please enter a URL to fetch.");
			return;
		}
		setIsFetchingUrl(true);
		try {
			const res = await apiClient.post("/scraper/fetch-product", { url: urlToFetch });
			if (res.data.success && res.data.data) {
				const { title, description, price, imageUrl } = res.data.data;
				setFormData(prev => ({
					...prev,
					title: title || prev.title,
					description: description || prev.description,
					price: price || prev.price,
					affiliateLink: urlToFetch, // auto-fill affiliate link
				}));

				if (imageUrl) {
					// We can fetch the image as a file and add it
					const file = await urlToFile(imageUrl, `fetched_image.jpg`);
					if (file) {
						setImageItems(prev => {
							const newImage = {
								id: `img-${Math.random().toString(36).substr(2, 9)}`,
								file: file,
								previewUrl: URL.createObjectURL(file),
								url: null,
								publicId: null,
								isMain: prev.length === 0
							};
							return [...prev, newImage];
						});
					}
				}
				setUrlToFetch("");
			}
		} catch (error) {
			console.error(error);
			alert(error.response?.data?.message || "Failed to fetch product data from URL.");
		} finally {
			setIsFetchingUrl(false);
		}
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
			return [...prev, { id: `img-${Math.random().toString(36).substr(2, 9)}`, file, previewUrl, url: null, publicId: null, isMain: isFirst }];
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
			return [...prev, { id: `vid-${Math.random().toString(36).substr(2, 9)}`, file, previewUrl, url: null, publicId: null, isPrimary: isFirst }];
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
	const setMain = (idx) => {
		setImageItems((prev) => {
			if (idx === 0) return prev.map((img, i) => ({ ...img, isMain: i === 0 }));
			const newItems = arrayMove(prev, idx, 0);
			return newItems.map((img, i) => ({ ...img, isMain: i === 0 }));
		});
	};

	const removeVideo = (idx) => {
		setVideoItems((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			if (next.length > 0 && !next.some((v) => v.isPrimary)) next[0].isPrimary = true;
			return next;
		});
	};
	const setPrimaryVideo = (idx) => {
		setVideoItems((prev) => {
			if (idx === 0) return prev.map((vid, i) => ({ ...vid, isPrimary: i === 0 }));
			const newItems = arrayMove(prev, idx, 0);
			return newItems.map((vid, i) => ({ ...vid, isPrimary: i === 0 }));
		});
	};

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const handleImageDragEndDnd = (event) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setImageItems((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const handleVideoDragEndDnd = (event) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setVideoItems((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

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
		const parsedPrice = parseFloat((formData.price || "").toString().replace(/,/g, ""));
		if (!formData.price || isNaN(parsedPrice) || parsedPrice <= 0)
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
				price: parseFloat(formData.price.toString().replace(/,/g, "")),
				images: finalImages.map(({ url, publicId, isMain }) => ({ url, publicId, isMain })),
				videos: finalVideos.map(({ url, publicId, isPrimary }) => ({ url, publicId, isPrimary })),
				isActive: formData.isActive,
				scheduledUploadTime: formData.scheduledUploadTime || null,
			};

			// Helper: inject a new custom value into dynamicOptions so the dropdown
			// reflects it immediately without waiting for a server round-trip.
			const injectDynamic = (finalAnime, finalCategory, finalStore) => {
				setDynamicOptions(prev => ({
					...prev,
					animeTags: mergeUnique(prev.animeTags, finalAnime && !ANIME_OPTIONS.includes(finalAnime) ? [finalAnime] : []),
					categories: mergeUnique(prev.categories, finalCategory && !CATEGORY_OPTIONS.includes(finalCategory) ? [finalCategory] : []),
					stores: mergeUnique(prev.stores, finalStore && !STORE_OPTIONS.includes(finalStore) ? [finalStore] : []),
				}));
			};

			if (editingId) {
				const res = await apiClient.put(
					`/products/${editingId}`,
					payload,
				);
				if (res.data.success) {
					injectDynamic(payload.animeTag, payload.category, payload.store);
					setSuccessMessage("Product updated successfully!");
					setTimeout(() => setViewMode("list"), 1500);
				}
			} else {
				const res = await apiClient.post("/products", payload);
				if (res.data.success) {
					injectDynamic(payload.animeTag, payload.category, payload.store);
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
			{(submitting || isDeleting || isCopying) && (
				<LoadingAnimation
					variant="overlay"
					message={
						submitting
							? uploadingVideoCount > 0
								? `Uploading ${uploadingVideoCount} video(s)...`
								: uploadingCount > 0
									? `Uploading ${uploadingCount} image(s)...`
									: "Saving Product..."
							: isDeleting
								? "Deleting Product..."
								: "Fetching Media..."
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
								: viewMode === "themes"
									? "Theme Controller"
									: editingId
										? "Edit Product"
										: "Add New Product"}
						</h1>
						<h1 className="sm:hidden text-lg font-bold text-white">
							{viewMode === "list" ? "Products" : viewMode === "themes" ? "Themes" : "Edit"}
						</h1>
					</div>

					{/* Desktop Menu */}
					<div className="hidden sm:flex gap-3">
						{viewMode !== "list" && (
							<Button
								onClick={() => setViewMode("list")}
								variant="secondary"
								size="sm"
							>
								Back to Products
							</Button>
						)}
						{viewMode === "list" && (
							<Button
								onClick={() => setViewMode("themes")}
								variant="secondary"
								size="sm"
								className="border border-purple-500/30 hover:border-purple-500"
							>
								Manage Themes
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
				{viewMode === "themes" ? (
					<ThemeController />

				) : viewMode === "list" ? (
					<ProductList
						BoxIcon={BoxIcon}
						Button={Button}
						FiLink={FiLink}
						FiLock={FiLock}
						SearchableDropdown={SearchableDropdown}
						filterAnime={filterAnime}
						filterCategory={filterCategory}
						filterCountry={filterCountry}
						filterStatus={filterStatus}
						filterStore={filterStore}
						finalAnimeOptions={finalAnimeOptions}
						finalCategoryOptions={finalCategoryOptions}
						finalCountryOptions={finalCountryOptions}
						finalStoreOptions={finalStoreOptions}
						handleDelete={handleDelete}
						hasMore={hasMore}
						loadingList={loadingList}
						openCreate={openCreate}
						openEdit={openEdit}
						products={products}
						searchQuery={searchQuery}
						sentinelRef={sentinelRef}
						setFilterAnime={setFilterAnime}
						setFilterCategory={setFilterCategory}
						setFilterCountry={setFilterCountry}
						setFilterStatus={setFilterStatus}
						setFilterStore={setFilterStore}
						setSearchQuery={setSearchQuery}
						setShowAffiliateModal={setShowAffiliateModal}
						setShowPrivateModal={setShowPrivateModal}
						setShowPinterestModal={setShowPinterestModal}
						setShowScheduledModal={setShowScheduledModal}
						setSortBy={setSortBy}
						sortBy={sortBy}
						totalProducts={totalProducts}
						viewMode={viewMode}
					/>
				) : (
					<ProductForm
						Button={Button}
						CURRENCY_LIST={CURRENCY_LIST}
						CURRENCY_SYMBOL_MAP={CURRENCY_SYMBOL_MAP}
						CurrencySearchableSelect={CurrencySearchableSelect}
						DndContext={DndContext}
						FiArrowDown={FiArrowDown}
						FiCopy={FiCopy}
						FiRefreshCw={FiRefreshCw}
						FiSearch={FiSearch}
						FiX={FiX}
						Input={Input}
						SearchableSelect={SearchableSelect}
						SortableContext={SortableContext}
						SortableImageItem={SortableImageItem}
						SortableVideoItem={SortableVideoItem}
						UploadIcon={UploadIcon}
						closestCenter={closestCenter}
						copiedFromProduct={copiedFromProduct}
						countries={countries}
						countryOptions={countryOptions}
						customAnimeTag={customAnimeTag}
						customCategory={customCategory}
						customCountryInput={customCountryInput}
						customStore={customStore}
						customSubCategory={customSubCategory}
						editingId={editingId}
						errors={errors}
						fetchFromUrl={fetchFromUrl}
						fileInputRef={fileInputRef}
						formAnimeOptions={formAnimeOptions}
						formCategoryOptions={formCategoryOptions}
						formData={formData}
						formStoreOptions={formStoreOptions}
						getCustomCountries={getCustomCountries}
						handleCountryToggle={handleCountryToggle}
						handleImageDragEndDnd={handleImageDragEndDnd}
						handleInputChange={handleInputChange}
						handleSubmit={handleSubmit}
						handleVideoDragEndDnd={handleVideoDragEndDnd}
						imageItems={imageItems}
						isDragOver={isDragOver}
						isFetchingUrl={isFetchingUrl}
						isVideoDragOver={isVideoDragOver}
						onDragEnterBox={onDragEnterBox}
						onDragLeaveBox={onDragLeaveBox}
						onDropBox={onDropBox}
						onFileChange={onFileChange}
						onVideoDragEnter={onVideoDragEnter}
						onVideoDragLeave={onVideoDragLeave}
						onVideoDrop={onVideoDrop}
						onVideoFileChange={onVideoFileChange}
						rectSortingStrategy={rectSortingStrategy}
						removeImage={removeImage}
						removeVideo={removeVideo}
						sensors={sensors}
						setCopiedFromProduct={setCopiedFromProduct}
						setCustomAnimeTag={setCustomAnimeTag}
						setCustomCategory={setCustomCategory}
						setCustomCountryInput={setCustomCountryInput}
						setCustomStore={setCustomStore}
						setCustomSubCategory={setCustomSubCategory}
						setErrors={setErrors}
						setFormData={setFormData}
						setMain={setMain}
						setPrimaryVideo={setPrimaryVideo}
						setShowCopyModal={setShowCopyModal}
						setUrlToFetch={setUrlToFetch}
						subCategoryMap={subCategoryMap}
						submitError={submitError}
						submitting={submitting}
						successMessage={successMessage}
						toTitleCase={toTitleCase}
						uploadingCount={uploadingCount}
						uploadingVideoCount={uploadingVideoCount}
						urlToFetch={urlToFetch}
						verticalListSortingStrategy={verticalListSortingStrategy}
						videoFileInputRef={videoFileInputRef}
						videoItems={videoItems}
					/>
				)}

			</div>
			{/* Copy Product Modal */}
			{showCopyModal && (
				<CopyProductModal
					onSelect={applyProductTemplate}
					onClose={() => setShowCopyModal(false)}
				/>
			)}
			{/* Private Products Modal */}
			{showPrivateModal && (
				<PrivateProductsModal
					onClose={() => setShowPrivateModal(false)}
					onPrivacyChanged={() => fetchProducts(1, true)}
				/>
			)}
			
			{showPinterestModal && (
				<PinterestExportModal
					onClose={() => setShowPinterestModal(false)}
					onExportComplete={() => fetchProducts(currentPage, true)}
				/>
			)}
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
			{/* Affiliate Selection Modal */}
			{showAffiliateModal && (
				<AffiliateSelectionModal
					onClose={() => setShowAffiliateModal(false)}
					onSelect={(platformId) => {
						setShowAffiliateModal(false);
						setSelectedAffiliatePlatform(platformId);
					}}
				/>
			)}

			{selectedAffiliatePlatform && (
				<AffiliateBulkModal
					platform={selectedAffiliatePlatform}
					onClose={() => setSelectedAffiliatePlatform(null)}
					onUploadSuccess={() => {
						setProducts([]);
						setCurrentPage(1);
						setHasMore(true);
						fetchProducts(1, true);
					}}
					formAnimeOptions={formAnimeOptions}
					formCategoryOptions={formCategoryOptions}
				/>
			)}
		</div>
	);
};

export default ProductManagement;
