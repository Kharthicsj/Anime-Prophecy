import React, { useState, useEffect } from "react";
import { FiX, FiArrowLeft, FiImage, FiClock } from "react-icons/fi";
import { FaPinterest, FaShareAlt } from "react-icons/fa";
import SocialMediaExportGrid from "./SocialMediaExportGrid";
import SocialMediaExportHistory from "./SocialMediaExportHistory";

const PinterestExportModal = ({ onClose, onExportComplete, initialShowHistory = false }) => {
    const [showPreviousExports, setShowPreviousExports] = useState(initialShowHistory);
    const [activeTab, setActiveTab] = useState("pinterest");

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "unset";
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-900 shrink-0">
                    <div className="flex items-center gap-4">
                        {showPreviousExports && (
                            <button
                                onClick={() => setShowPreviousExports(false)}
                                className="cursor-pointer flex-shrink-0 text-zinc-400 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                                title="Back to Products"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                                <FaShareAlt className="text-blue-500 text-2xl" /> {showPreviousExports ? "Exported Files Tracker" : "Social Media Handler"}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">
                                {showPreviousExports ? "View and manage your previously generated export files." : "Manage your social media exports and product assets."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!showPreviousExports && (
                            <button
                                onClick={() => setShowPreviousExports(true)}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                            >
                                <FiClock className="w-4 h-4" /> Exported Files Tracker
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="cursor-pointer flex-shrink-0 text-zinc-400 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                {/* Tabs Navigation */}
                {!showPreviousExports && (
                    <div className="px-6 flex items-center gap-6 border-b border-zinc-800 bg-zinc-900 shrink-0">
                        <button 
                            onClick={() => setActiveTab("pinterest")}
                            className={`cursor-pointer py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "pinterest" ? "border-red-500 text-red-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                        >
                            <span className="flex items-center gap-2"><FaPinterest /> Pinterest Export</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("imageExporter")}
                            className={`cursor-pointer py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "imageExporter" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                        >
                            <span className="flex items-center gap-2"><FiImage /> Product Image Exporter</span>
                        </button>
                    </div>
                )}

                {/* Scrollable Container */}
                <div className="overflow-y-auto flex-1 bg-black/20">
                    {showPreviousExports ? (
                        <SocialMediaExportHistory onHistoryChange={onExportComplete} />
                    ) : (
                        <SocialMediaExportGrid activeTab={activeTab} onExportComplete={onExportComplete} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PinterestExportModal;
