import React, { useState, useEffect } from 'react';
import { FiX, FiTerminal, FiCheckCircle, FiAlertCircle, FiClock, FiBox, FiTrash2, FiFilter, FiArrowLeft } from 'react-icons/fi';
import apiClient from '../../services/apiClient';

const CronLogsModal = ({ onClose, onBack }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [filterDate, setFilterDate] = useState("");
    const [eventFilter, setEventFilter] = useState("All");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await apiClient.get('/products/admin/cron-logs');
                setLogs(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch cron logs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const handleDelete = async (e, logId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        
        try {
            setIsDeleting(true);
            await apiClient.delete(`/products/admin/cron-logs/${logId}`);
            setLogs(logs.filter(l => l._id !== logId));
            if (selectedLog?._id === logId) {
                setSelectedLog(null);
                setEventFilter("All");
            }
            alert("Log deleted successfully");
        } catch (error) {
            console.error("Failed to delete log", error);
            alert("Failed to delete log");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[85vh] flex shadow-2xl overflow-hidden font-mono text-sm">

                {/* Sidebar (List of logs) */}
                <div className="w-1/3 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                        <div className="flex items-center gap-2">
                            {onBack && (
                                <button onClick={onBack} className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer" title="Go Back">
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <FiTerminal className="text-green-500" /> CRON History (30 Days)
                            </h2>
                        </div>
                    </div>
                    <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center gap-2">
                        <FiFilter className="text-zinc-400" />
                        <input 
                            type="date" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300 focus:outline-none focus:border-green-500 flex-1"
                        />
                        {filterDate && (
                            <button 
                                onClick={() => setFilterDate("")} 
                                className="text-zinc-500 hover:text-white transition-colors"
                                title="Clear filter"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {isLoading ? (
                            <div className="p-4 text-zinc-500 text-center">Loading logs...</div>
                        ) : (() => {
                            const filteredLogs = filterDate 
                                ? logs.filter(log => new Date(log.runDate).toDateString() === new Date(filterDate).toDateString())
                                : logs;

                            if (filteredLogs.length === 0) {
                                return <div className="p-4 text-zinc-500 text-center">No CRON logs found.</div>;
                            }

                            return filteredLogs.map(log => (
                                <div 
                                    key={log._id} 
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setEventFilter("All");
                                    }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors relative group ${selectedLog?._id === log._id ? 'bg-zinc-800 border-green-500/50' : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-600'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-bold ${log.platform === 'AliExpress' ? 'text-orange-500' : 'text-green-500'}`}>
                                            {log.platform}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                <FiClock /> {formatDate(log.runDate)}
                                            </span>
                                            <button 
                                                onClick={(e) => handleDelete(e, log._id)}
                                                disabled={isDeleting}
                                                className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Log"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400 truncate pr-2">{log.summary || 'No summary'}</span>
                                        {log.status === 'Success' ? <FiCheckCircle className="text-green-500 shrink-0" /> : <FiAlertCircle className="text-amber-500 shrink-0" />}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Main Content (Log Details) */}
                <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="text-zinc-300 font-bold">
                            {selectedLog ? `Execution Details - ${formatDate(selectedLog.runDate)}` : 'Select a log to view details'}
                        </h3>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        {selectedLog ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-zinc-500 text-xs mb-1">Platform</div>
                                        <div className={`font-bold ${selectedLog.platform === 'AliExpress' ? 'text-orange-500' : 'text-green-500'}`}>
                                            {selectedLog.platform}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-zinc-500 text-xs mb-1">Status</div>
                                        <div className={`font-bold ${selectedLog.status === 'Success' ? 'text-green-500' : 'text-amber-500'}`}>
                                            {selectedLog.status}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-zinc-500 text-xs mb-1">Events Processed</div>
                                        <div className="font-bold text-zinc-300">{selectedLog.events?.length || 0}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3">
                                    <h4 className="text-zinc-400 font-bold">Event Trace</h4>
                                    <select 
                                        value={eventFilter} 
                                        onChange={(e) => setEventFilter(e.target.value)}
                                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-green-500 cursor-pointer"
                                    >
                                        <option value="All">All Events</option>
                                        <option value="Updated">Updated</option>
                                        <option value="Private">Made Private</option>
                                    </select>
                                </div>

                                {selectedLog.events?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedLog.events.filter(e => eventFilter === 'All' || e.eventType === eventFilter).map((event, idx) => (
                                            <div key={idx} className="bg-zinc-900/50 p-3 rounded border border-zinc-800/50 flex flex-col gap-2">
                                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-bold ${event.eventType === 'Updated' ? 'bg-blue-900/30 text-blue-400 border border-blue-900' : event.eventType === 'Private' ? 'bg-amber-900/30 text-amber-400 border border-amber-900' : 'bg-red-900/30 text-red-400 border border-red-900'}`}>
                                                        {event.eventType}
                                                    </span>
                                                    <span className="text-zinc-300 font-sans font-semibold text-sm flex-1 flex items-center gap-2 min-w-0">
                                                        <FiBox className="text-zinc-500 shrink-0" /> 
                                                        <span className="truncate">{event.productTitle || 'Unknown Product'}</span>
                                                    </span>
                                                    <span className="text-xs text-zinc-600 font-mono shrink-0 hidden sm:block">
                                                        ID: {event.productId}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-zinc-400 pl-1 border-l-2 border-zinc-800 ml-2">
                                                    {event.details || 'No additional details provided.'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-zinc-500 text-center py-10 bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                        No active products were modified during this execution.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-600">
                                <div className="text-center">
                                    <FiTerminal className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Select an execution log from the sidebar to view traces</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CronLogsModal;
