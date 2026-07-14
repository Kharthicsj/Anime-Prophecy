import React, { useState, useEffect, useCallback } from "react";
import { FiRefreshCw, FiDownload, FiTrash2, FiClock } from "react-icons/fi";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import apiClient from "../../services/apiClient";

const SocialMediaExportHistory = ({ onHistoryChange }) => {
    const [historyTab, setHistoryTab] = useState("pinterest");
    const [previousExports, setPreviousExports] = useState([]);
    const [isLoadingExports, setIsLoadingExports] = useState(false);
    const [downloadingExportId, setDownloadingExportId] = useState(null);

    const fetchPreviousExports = useCallback(async () => {
        setIsLoadingExports(true);
        try {
            const endpoint = historyTab === "pinterest" 
                ? "/products/admin/pinterest-export" 
                : "/products/admin/image-export";
            const res = await apiClient.get(endpoint);
            setPreviousExports(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch previous exports", err);
        } finally {
            setIsLoadingExports(false);
        }
    }, [historyTab]);

    useEffect(() => {
        fetchPreviousExports();
    }, [fetchPreviousExports]);

    const convertToCSV = (dataList, forcedScheduleDate) => {
        const header = ["Title", "Media URL", "Thumbnail", "Description", "Link", "Pinterest board", "Keywords"];
        if (forcedScheduleDate) header.push("Publish date");

        const rows = dataList.map(p => {
            const title = `"${(p.title || "").replace(/"/g, '""')}"`;
            const rawTags = [p.animeTag, p.category, p.subCategory, p.store];
            const cleanTags = rawTags.filter(t => t && t.trim() !== "");
            const hashtags = cleanTags.map(t => `#${t.replace(/[\s-]/g, '')}`).join(" ");

            let baseDesc = p.description || "";
            const tagsSpace = hashtags.length > 0 ? hashtags.length + 2 : 0;
            const maxBaseLen = 500 - tagsSpace;
            if (baseDesc.length > maxBaseLen) baseDesc = baseDesc.substring(0, maxBaseLen - 3).trim() + "...";
            
            const finalDesc = hashtags.length > 0 ? `${baseDesc}\n\n${hashtags}` : baseDesc;
            const desc = `"${finalDesc.replace(/"/g, '""')}"`;
            
            const baseDomain = window.location.hostname === 'localhost' ? window.location.origin : 'https://animeprophecy.com';
            const link = `"${baseDomain}/product/${p._id}"`;
            
            const countryStr = p.countries?.[0] || "WORLDWIDE";
            const animeStr = p.animeTag || "ANIME";
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
            if (forcedScheduleDate) rowArr.push(`"${new Date(forcedScheduleDate).toISOString()}"`);
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

    const handleDownloadPreviousExport = async (exp) => {
        setDownloadingExportId(exp._id);
        try {
            if (historyTab === "pinterest") {
                const res = await apiClient.get(`/products/admin/pinterest-export/${exp._id}/download`);
                const data = res.data.data;
                const prods = data.productIds || [];
                const csvStr = convertToCSV(prods, data.scheduledDate);
                downloadCSV(csvStr, `pinterest_export_${new Date(data.createdAt).getTime()}.csv`);
            } else {
                const res = await apiClient.get(`/products/admin/image-export/${exp._id}/download`);
                const data = res.data.data;
                const prods = data.productIds || [];
                
                const zip = new JSZip();
                for (const p of prods) {
                    const safeTitle = (p.title || p._id).replace(/[^a-zA-Z0-9 -]/g, "").substring(0, 50).trim();
                    if (p.images && p.images.length > 0) {
                        const imgFolder = zip.folder(safeTitle);
                        for (let i = 0; i < p.images.length; i++) {
                            try {
                                const response = await fetch(p.images[i].url);
                                const blob = await response.blob();
                                imgFolder.file(`image_${i+1}.jpg`, blob);
                            } catch (e) {
                                console.error(`Failed to fetch ${p.images[i].url}`);
                            }
                        }
                    }
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                saveAs(zipBlob, `product_images_export_${new Date(data.createdAt).getTime()}.zip`);
            }
        } catch (err) {
            console.error("Failed to download export", err);
            alert("Failed to download export.");
        } finally {
            setDownloadingExportId(null);
        }
    };

    const handleDeleteExport = async (id) => {
        const isPinterest = historyTab === "pinterest";
        let confirmMsg = "Are you sure you want to delete this export record?";
        if (isPinterest) {
            confirmMsg = "Do you want to reset the products' exported status to 'Not Exported' for this record? (Press OK to reset, Cancel to keep status but delete record)";
        }

        const confirmReset = isPinterest ? window.confirm(confirmMsg) : false;
        if (!isPinterest && !window.confirm(confirmMsg)) return;

        try {
            const endpoint = isPinterest 
                ? `/products/admin/pinterest-export/${id}?resetProducts=${confirmReset}`
                : `/products/admin/image-export/${id}`;
                
            await apiClient.delete(endpoint);
            fetchPreviousExports();
            if (onHistoryChange) onHistoryChange();
        } catch (err) {
            console.error("Failed to delete export", err);
            alert("Failed to delete export.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Export History</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        <FiClock className="inline mr-1" />
                        History records are automatically deleted after 30 days.
                    </p>
                </div>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button 
                        onClick={() => setHistoryTab("pinterest")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${historyTab === "pinterest" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                    >
                        Pinterest CSVs
                    </button>
                    <button 
                        onClick={() => setHistoryTab("imageExporter")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${historyTab === "imageExporter" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                    >
                        Image ZIPs
                    </button>
                </div>
            </div>
            {isLoadingExports ? (
                <p className="text-zinc-500">Loading exports...</p>
            ) : previousExports.length === 0 ? (
                <p className="text-zinc-500 text-center py-10">No previous exports found.</p>
            ) : (
                <div className="space-y-4">
                    {previousExports.map(exp => (
                        <div key={exp._id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-300">
                                    Exported on: <span className="font-bold text-white">{new Date(exp.createdAt).toLocaleString()}</span>
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {exp.productCount} products exported.
                                </p>
                                {exp.scheduledDate && (
                                    <p className="text-xs text-blue-400 mt-1">
                                        Scheduled for: {new Date(exp.scheduledDate).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDownloadPreviousExport(exp)}
                                    disabled={downloadingExportId === exp._id}
                                    className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900/30 text-blue-400 border border-blue-900/50 hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                >
                                    {downloadingExportId === exp._id ? <FiRefreshCw className="animate-spin" /> : <FiDownload />} Download
                                </button>
                                <button 
                                    onClick={() => handleDeleteExport(exp._id)}
                                    className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-colors"
                                >
                                    <FiTrash2 /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SocialMediaExportHistory;
