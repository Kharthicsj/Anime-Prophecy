import React, { useState, useCallback, useRef, useEffect } from "react";
import { FiRefreshCw, FiSearch, FiDownload, FiCalendar } from "react-icons/fi";
import { FaPinterest } from "react-icons/fa";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import apiClient from "../../services/apiClient";
import FilterBar from "../common/FilterBar";

const SocialMediaExportGrid = ({ activeTab, onExportComplete }) => {
	const [selectedFilters, setSelectedFilters] = useState({
		search: "",
		animeTag: "All Anime",
		store: "All Stores",
		category: "All Categories",
		country: "All Countries",
		status: "All Statuses",
		sort: "-createdAt",
        pinterestExported: "All",
	});
	const [products, setProducts] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [totalProducts, setTotalProducts] = useState(0);
	const [selectedProductsMap, setSelectedProductsMap] = useState(new Map());
	const [isExporting, setIsExporting] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [scheduleDate, setScheduleDate] = useState("");
	const [needScheduling, setNeedScheduling] = useState(false);

	const sentinelRef = useRef(null);
	const isFetchingRef = useRef(false);
	const PAGE_SIZE = 20;

	const buildParams = useCallback((extra = {}) => {
		return new URLSearchParams({
			sort: selectedFilters.sort || "-createdAt",
			...(selectedFilters.search && { search: selectedFilters.search }),
			...(selectedFilters.animeTag && selectedFilters.animeTag !== "All Anime" && { animeTag: selectedFilters.animeTag }),
			...(selectedFilters.category && selectedFilters.category !== "All Categories" && { category: selectedFilters.category }),
			...(selectedFilters.store && selectedFilters.store !== "All Stores" && { store: selectedFilters.store }),
			...(selectedFilters.country && selectedFilters.country !== "All Countries" && { country: selectedFilters.country }),
			...(selectedFilters.status && selectedFilters.status !== "All Statuses" && { status: selectedFilters.status === "Inactive (Private)" ? "inactive" : selectedFilters.status.toLowerCase() }),
            ...(selectedFilters.pinterestExported !== "All" && { pinterestExported: selectedFilters.pinterestExported === "Exported" ? "true" : "false" }),
			...extra,
		});
	}, [selectedFilters]);

	const fetchPage = useCallback(async (page, reset = false) => {
		if (isFetchingRef.current) return;
		isFetchingRef.current = true;
		setIsLoading(true);
		try {
			const params = buildParams({ page, limit: PAGE_SIZE });
			const res = await apiClient.get(`/products/admin/all?${params}`);
			const data = res.data?.data;
			const newProducts = Array.isArray(data?.products) ? data.products : [];
			const total = data?.pagination?.total || 0;
			setTotalProducts(total);
			setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
			setHasMore(newProducts.length === PAGE_SIZE && newProducts.length < total);
			setCurrentPage(page);
		} catch (err) {
			console.error("Failed to fetch products for export modal", err);
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [buildParams]);

	useEffect(() => {
		setProducts([]);
		setCurrentPage(1);
		setHasMore(true);
		fetchPage(1, true);
	}, [selectedFilters, fetchPage]);

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !isLoading) {
				fetchPage(currentPage + 1);
			}
		}, { rootMargin: "200px" });
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, isLoading, currentPage, fetchPage]);

	const toggleSelect = (p) => {
		setSelectedProductsMap(prev => {
			const next = new Map(prev);
			if (next.has(p._id)) {
				next.delete(p._id);
			} else {
				next.set(p._id, p);
			}
			return next;
		});
	};

	const handleSelectAllCurrentFilter = async () => {
		setIsLoading(true);
		try {
			const params = buildParams({ page: 1, limit: totalProducts });
			const res = await apiClient.get(`/products/admin/all?${params}`);
			const allProds = res.data?.data?.products || [];
			setSelectedProductsMap(prev => {
				const next = new Map(prev);
				allProds.forEach(p => next.set(p._id, p));
				return next;
			});
			setSuccessMsg(`Added ${allProds.length} products to selection.`);
			setTimeout(() => setSuccessMsg(""), 3000);
		} catch {
			setErrorMsg("Failed to fetch products for selection.");
			setTimeout(() => setErrorMsg(""), 4000);
		} finally {
			setIsLoading(false);
		}
	};

    const convertToCSV = (dataList, forcedScheduleDate) => {
        const getFullAnimeName = (name) => {
            if (!name) return name;
            const lowerName = name.toLowerCase().trim();
            const map = {
                'aot': 'Attack of the titans',
                'dbz': 'Dragon Ball Z',
                'op': 'One Piece',
                'mha': 'My Hero Academia',
                'jjk': 'Jujutsu Kaisen',
                'ds': 'Demon Slayer',
                'sao': 'Sword Art Online',
                'hxh': 'Hunter x Hunter',
                'fmab': 'Fullmetal Alchemist'
            };
            return map[lowerName] || name;
        };

        const getFullCountryName = (country) => {
            if (!country) return country;
            const lower = country.toLowerCase().trim();
            const map = {
                'us': 'USA',
                'usa': 'USA',
                'uk': 'UNITED KINGDOM',
                'eu': 'EUROPE',
                'ca': 'CANADA',
                'au': 'AUSTRALIA',
                'nz': 'NEW ZEALAND',
                'jp': 'JAPAN',
                'cn': 'CHINA',
                'in': 'INDIA',
                'kr': 'SOUTH KOREA'
            };
            return map[lower] || country;
        };

        const usedSched = forcedScheduleDate !== undefined ? forcedScheduleDate : scheduleDate;
        
        const header = ["Title", "Media URL", "Thumbnail", "Description", "Link", "Pinterest board", "Keywords"];
        if (usedSched) {
            header.push("Publish date");
        }

        const rows = dataList.map(p => {
            const title = `"${(p.title || "").replace(/"/g, '""')}"`;
            const rawTags = [p.animeTag, p.category, p.subCategory, p.store];
            const cleanTags = rawTags.filter(t => t && t.trim() !== "");
            const hashtags = cleanTags.map(t => `#${t.replace(/[\s-]/g, '')}`).join(" ");

            let baseDesc = p.description || "";
            const tagsSpace = hashtags.length > 0 ? hashtags.length + 2 : 0;
            const maxBaseLen = 500 - tagsSpace;
            
            if (baseDesc.length > maxBaseLen) {
                baseDesc = baseDesc.substring(0, maxBaseLen - 3).trim() + "...";
            }
            
            const finalDesc = hashtags.length > 0 ? `${baseDesc}\n\n${hashtags}` : baseDesc;
            const desc = `"${finalDesc.replace(/"/g, '""')}"`;
            
            const baseDomain = window.location.hostname === 'localhost' ? window.location.origin : 'https://animeprophecy.com';
            const link = `"${baseDomain}/product/${p._id}"`;
            
            const rawCountry = p.countries?.[0] || "WORLDWIDE";
            const rawAnime = p.animeTag || "ANIME";
            
            const countryStr = getFullCountryName(rawCountry);
            const animeStr = getFullAnimeName(rawAnime);
            const boardStr = `${countryStr}/${animeStr}`.toUpperCase();
            const pinterestBoard = `"${boardStr.replace(/"/g, '""')}"`;
            
            const keywords = `"${cleanTags.join(", ")}"`;
            
            let mediaUrlStr = "";
            let thumbnailStr = "";
            if (p.videos && p.videos.length > 0) {
                mediaUrlStr = p.videos[0].url;
                thumbnailStr = p.images?.[0]?.url || "";
            } else {
                mediaUrlStr = p.images?.[0]?.url || "";
                thumbnailStr = "";
            }

            const mediaUrl = `"${mediaUrlStr}"`;
            const thumbnail = `"${thumbnailStr}"`;
            
            const rowArr = [title, mediaUrl, thumbnail, desc, link, pinterestBoard, keywords];
            if (usedSched) {
                rowArr.push(`"${new Date(usedSched).toISOString()}"`);
            }
            return rowArr.join(",");
        });
        
        return [header.join(","), ...rows].join("\n");
    };

    const downloadCSV = (csvStr, filename) => {
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

	const handleExport = async () => {
		if (selectedProductsMap.size === 0) return;
		setIsExporting(true);
		setErrorMsg("");
		try {
            const productIds = Array.from(selectedProductsMap.keys());
			await apiClient.post("/products/admin/pinterest-export", { 
                ids: productIds,
                scheduledDate: scheduleDate || null
            });
			
            const selectedList = Array.from(selectedProductsMap.values());
            const csvStr = convertToCSV(selectedList);
            downloadCSV(csvStr, `pinterest_export_${new Date().getTime()}.csv`);

			setSuccessMsg(`${productIds.length} products exported successfully.`);
			setSelectedProductsMap(new Map());
            if (onExportComplete) onExportComplete();
			setTimeout(() => {
                setSuccessMsg("");
                fetchPage(1, true);
            }, 3000);
		} catch (err) {
			const msg = err.response?.data?.message || "Export failed. Please try again.";
			setErrorMsg(msg);
			setTimeout(() => setErrorMsg(""), 5000);
			console.error("Export failed", err);
		} finally {
			setIsExporting(false);
		}
	};

    const handleImageExport = async () => {
        if (selectedProductsMap.size === 0) return;
        setIsExporting(true);
        setErrorMsg("");
        
        try {
            const productIds = Array.from(selectedProductsMap.keys());
            const selectedList = Array.from(selectedProductsMap.values());
            
            const zip = new JSZip();
            let imgCount = 0;
            
            for (const p of selectedList) {
                const safeTitle = (p.title || p._id).replace(/[^a-zA-Z0-9 -]/g, "").substring(0, 50).trim();
                if (p.images && p.images.length > 0) {
                    const imgFolder = zip.folder(safeTitle);
                    for (let i = 0; i < p.images.length; i++) {
                        try {
                            const res = await fetch(p.images[i].url);
                            const blob = await res.blob();
                            imgFolder.file(`image_${i+1}.jpg`, blob);
                            imgCount++;
                        } catch (err) {
                            console.error(`Failed to fetch image for ${p.title}`, err);
                        }
                    }
                }
            }
            
            if (imgCount === 0) {
                setErrorMsg("No images found for the selected products.");
                setIsExporting(false);
                return;
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `product_images_export_${new Date().getTime()}.zip`);

            await apiClient.post("/products/admin/image-export", { ids: productIds });
            
            setSuccessMsg(`${productIds.length} products' images exported successfully.`);
            setSelectedProductsMap(new Map());
            if (onExportComplete) onExportComplete();
            
            setTimeout(() => {
                setSuccessMsg("");
            }, 3000);
        } catch (err) {
            const msg = err.response?.data?.message || "Export failed. Please try again.";
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(""), 5000);
            console.error("Export failed", err);
        } finally {
            setIsExporting(false);
        }
    };

	const selectedCount = selectedProductsMap.size;

    if (activeTab !== "pinterest" && activeTab !== "imageExporter") return null;

    return (
        <>
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                <div className="w-full">
                    <FilterBar 
                        selectedFilters={selectedFilters} 
                        onFilterChange={setSelectedFilters} 
                        showPinterestFilter={true} 
                    />
                </div>
                <div className="flex flex-wrap justify-between items-center mt-4 gap-3 pt-4 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
                        {products.length} of {totalProducts} products loaded
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleSelectAllCurrentFilter}
                            disabled={isLoading || isExporting}
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all disabled:opacity-60 bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        >
                            Select All {totalProducts} in Current Filter
                        </button>

                        {selectedCount > 0 && (
                            <div className="flex items-center gap-3 ml-2 border-l border-zinc-700 pl-4">
                                {activeTab === "pinterest" && (
                                    <>
                                        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={needScheduling} 
                                                onChange={(e) => {
                                                    setNeedScheduling(e.target.checked);
                                                    if (!e.target.checked) setScheduleDate("");
                                                }}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-red-500 cursor-pointer accent-red-500"
                                            />
                                            Need scheduling?
                                        </label>
                                        {needScheduling && (
                                            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 animate-in fade-in zoom-in duration-200">
                                                <FiCalendar className="text-zinc-400" />
                                                <input
                                                    type="datetime-local"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                    className="bg-transparent text-sm text-white focus:outline-none placeholder-zinc-500"
                                                    title="Schedule Date"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {activeTab === "imageExporter" ? (
                                    <button
                                        onClick={handleImageExport}
                                        disabled={isExporting}
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-lg shadow-blue-900/30 border border-blue-500"
                                    >
                                        <FiDownload className="text-lg" /> {isExporting ? "Exporting Images..." : `Export Images ZIP (${selectedCount})`}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-all shadow-lg shadow-red-900/30 border border-red-500"
                                    >
                                        <FiDownload className="text-lg" /> {isExporting ? "Exporting CSV..." : `Export CSV (${selectedCount})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {successMsg && (
                    <div className="mt-3 px-4 py-2.5 rounded-lg bg-green-900/30 border border-green-700/60 text-green-300 text-sm font-medium flex items-center gap-2">
                        <span>✓</span> {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="mt-3 px-4 py-2.5 rounded-lg bg-red-900/30 border border-red-700/60 text-red-300 text-sm font-medium">
                        ⚠ {errorMsg}
                    </div>
                )}

                {selectedCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full font-semibold border bg-red-900/30 border-red-800/50 text-red-400">
                            {selectedCount} product{selectedCount !== 1 ? "s" : ""} selected in total
                        </span>
                        <button
                            onClick={() => setSelectedProductsMap(new Map())}
                            className="cursor-pointer text-zinc-500 hover:text-red-400 transition-colors underline"
                        >
                            Clear all selection
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6">
                {products.length === 0 && !isLoading ? (
                    <div className="py-32 text-center text-zinc-500 flex flex-col items-center justify-center">
                        <FiSearch className="text-6xl mb-5 opacity-40" />
                        <p className="font-semibold text-xl text-zinc-300">No products match your search</p>
                        <p className="text-sm mt-2 text-zinc-500">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                            {products.map(p => {
                                const isSelected = selectedProductsMap.has(p._id);
                                const isExported = p.pinterestExported;
                                return (
                                    <div
                                        key={p._id}
                                        onClick={() => toggleSelect(p)}
                                        className={`relative bg-zinc-950 border rounded-xl overflow-hidden cursor-pointer flex flex-col transition-all duration-200 ${
                                            isSelected
                                                ? "border-red-500 shadow-lg shadow-red-900/30 ring-2 ring-red-500/30"
                                                : "border-zinc-800 hover:border-zinc-600 hover:shadow-lg"
                                        }`}
                                    >
                                        <div className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            isSelected ? "bg-red-500 border-red-400" : "bg-zinc-900/80 border-zinc-600"
                                        }`}>
                                            {isSelected && <span className="text-white text-xs leading-none font-bold">✓</span>}
                                        </div>

                                        {isExported && (
                                            <div className="absolute top-2.5 right-2.5 z-10 bg-red-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm border border-red-500 flex items-center gap-1">
                                                <FaPinterest /> Exported
                                            </div>
                                        )}

                                        <div className="relative overflow-hidden bg-zinc-800 aspect-square">
                                            <img
                                                src={p.images?.[0]?.url || "placeholder.jpg"}
                                                alt={p.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        <div className="p-3 flex flex-col flex-1">
                                            <h3 className={`font-bold line-clamp-2 text-xs leading-relaxed mb-1.5 transition-colors ${isSelected ? "text-red-200" : "text-zinc-100"}`}>
                                                {p.title}
                                            </h3>
                                            <p className="text-zinc-500 text-[10px] mb-2">{p.category}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {hasMore && (
                            <div ref={sentinelRef} className="h-24 flex items-center justify-center mt-6">
                                {isLoading && (
                                    <span className="text-sm font-medium text-zinc-400 flex items-center gap-3 bg-zinc-900/80 px-5 py-2.5 rounded-full border border-zinc-800 shadow-sm">
                                        <FiRefreshCw className="animate-spin text-purple-400" /> Loading more...
                                    </span>
                                )}
                            </div>
                        )}

                        {!hasMore && products.length > 0 && (
                            <p className="text-center text-zinc-600 text-sm mt-12 mb-4 font-semibold">
                                All {totalProducts} products loaded ✓
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default SocialMediaExportGrid;
