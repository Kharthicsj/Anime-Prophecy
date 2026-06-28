import { useState, useEffect, useMemo } from 'react';
import apiClient from "../../../services/apiClient";
import { Loader2, Globe, Laptop, Activity, CalendarDays, RefreshCw, MapPin, FileText, Video, Users, Smartphone, MousePointerClick } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const TrafficPanel = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/analytics');
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setError("Failed to fetch traffic data");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Could not connect to analytics server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // 1. Time Series Chart Data (Views + Visitors)
    const timeSeriesData = useMemo(() => {
        if (!data?.pageviews?.[0]) return [];
        const pv = data.pageviews[0];
        const uv = data.uniqueVisitors?.[0];
        if (pv.labels && pv.data) {
            return pv.labels.map((label, idx) => ({
                date: label.slice(5, 10).replace('-', '/'), // MM/DD format
                views: pv.data[idx] || 0,
                visitors: uv?.data?.[idx] || 0
            }));
        }
        return [];
    }, [data]);

    const totals = useMemo(() => {
        const views = timeSeriesData.reduce((acc, curr) => acc + curr.views, 0);
        const visitors = timeSeriesData.reduce((acc, curr) => acc + curr.visitors, 0);
        return { views, visitors };
    }, [timeSeriesData]);

    // 2. Data Parsers
    const parseData = (rawData, defaultLabel = "Unknown", limit = 5) => {
        if (!rawData) return [];
        return rawData
            .map(item => {
                const total = item.aggregated_value ?? item.data?.reduce((a, b) => a + b, 0) ?? 0;
                let name = item.label;
                if (!name || name === "$direct" || name === "") name = defaultLabel;
                return { name, value: total };
            })
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    };

    const referrersData = useMemo(() => parseData(data?.referrers, "Direct", 6), [data]);
    const browsersData = useMemo(() => parseData(data?.browsers, "Unknown Browser"), [data]);
    const pathsData = useMemo(() => parseData(data?.paths, "/", 10), [data]);
    const countriesData = useMemo(() => parseData(data?.countries, "Unknown", 100), [data]); // Get as many countries as possible for the map
    const devicesData = useMemo(() => parseData(data?.devices, "Desktop", 4), [data]);

    if (loading && !data) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-3 py-24 text-zinc-500 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400/80" />
                <p className="text-sm">Loading PostHog Web Analytics…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-4 py-24 rounded-xl border border-red-900/30 bg-red-950/20">
                <p className="text-sm text-red-400/90">{error}</p>
                <button onClick={fetchAnalytics} className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-2 text-sm text-red-300 hover:bg-red-900/40">
                    <RefreshCw className="h-4 w-4" /> Retry
                </button>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/90 p-3 shadow-xl backdrop-blur-md min-w-[120px]">
                    <p className="mb-2 text-xs font-semibold text-zinc-400">{label}</p>
                    {payload.map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-4 text-sm mb-1">
                            <span style={{ color: entry.color }} className="capitalize">{entry.name}</span>
                            <span className="font-bold text-zinc-100">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-violet-400/80" />
                        <h2 className="text-xl font-bold text-zinc-100">Web Analytics Dashboard</h2>
                    </div>
                    <p className="text-sm text-zinc-500">Real-time web traffic insights powered by PostHog</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchAnalytics}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                    <a 
                        href="https://us.posthog.com/project/489126/web" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/50 bg-violet-600/10 px-3 py-2 text-xs font-semibold text-violet-400 transition-colors hover:bg-violet-600/20"
                    >
                        Open in PostHog
                    </a>
                </div>
            </div>

            {/* ── Top Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Visitors</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">{totals.visitors}</p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Page Views</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">{totals.views}</p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Sessions</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">{totals.visitors}</p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Session Duration</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">N/A</p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Bounce Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">0%</p>
                </div>
            </div>
            
            {/* ── Main Chart ── */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">Unique visitors</h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeriesData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area type="monotone" name="views" dataKey="views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" strokeDasharray="5 5" />
                            <Area type="monotone" name="visitors" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Full Width Path Table ── */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200">Paths</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="text-[11px] uppercase text-zinc-500 border-b border-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-semibold">Path</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold">Visitors</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold">Views</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold">Bounce Rate</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pathsData.map((item, idx) => (
                                <tr key={idx} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-zinc-300">{item.name}</td>
                                    <td className="px-4 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                    <td className="px-4 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                    <td className="px-4 py-3 text-right font-medium text-red-400/80">0.0%</td>
                                    <td className="px-4 py-3 text-right">
                                        <a href="https://us.posthog.com/replay" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                                            View recordings <Video className="h-3 w-3" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {(!pathsData || pathsData.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-6 text-center text-xs italic">No path data yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Secondary Grid (Sources, Devices) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Traffic Sources */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-semibold text-zinc-200">Sources by Channel</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="text-[11px] uppercase text-zinc-500 border-b border-zinc-800/50">
                                <tr>
                                    <th scope="col" className="px-2 py-3 font-semibold">Channel Type</th>
                                    <th scope="col" className="px-2 py-3 text-right font-semibold">Visitors</th>
                                    <th scope="col" className="px-2 py-3 text-right font-semibold">Views</th>
                                    <th scope="col" className="px-2 py-3 text-right font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {referrersData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-2 py-3 font-medium text-zinc-300 capitalize">{item.name}</td>
                                        <td className="px-2 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                        <td className="px-2 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                        <td className="px-2 py-3 text-right">
                                            <a href="https://us.posthog.com/replay" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                                                View recordings <Video className="h-3 w-3" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Devices */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-semibold text-zinc-200">Devices by Device type</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="text-[11px] uppercase text-zinc-500 border-b border-zinc-800/50">
                                <tr>
                                    <th scope="col" className="px-2 py-3 font-semibold">Device Type</th>
                                    <th scope="col" className="px-2 py-3 text-right font-semibold">Visitors</th>
                                    <th scope="col" className="px-2 py-3 text-right font-semibold">Views</th>
                                    <th scope="col" className="px-2 py-3 text-right font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {devicesData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-2 py-3 font-medium text-zinc-300 flex items-center gap-2 capitalize">
                                            {item.name === "Desktop" ? <Laptop className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                                            {item.name}
                                        </td>
                                        <td className="px-2 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                        <td className="px-2 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                        <td className="px-2 py-3 text-right">
                                            <a href="https://us.posthog.com/replay" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                                                View recordings <Video className="h-3 w-3" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Geography Map ── */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 flex flex-col items-center relative">
                <div className="flex w-full items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200">Geography by Map</h3>
                </div>
                <div className="w-full max-w-5xl overflow-hidden flex justify-center">
                    <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120, center: [0, 30] }} className="w-full h-auto">
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const d = countriesData.find(c => c.name === geo.properties.name || c.name === geo.properties.name.toLowerCase());
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={d ? "#2563eb" : "#d4d4d8"}
                                            stroke="#ffffff"
                                            strokeWidth={0.5}
                                            onMouseEnter={(e) => {
                                                setTooltip({
                                                    show: true,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    content: { name: geo.properties.name, value: d ? d.value : 0 }
                                                });
                                            }}
                                            onMouseMove={(e) => {
                                                setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                                            }}
                                            onMouseLeave={() => {
                                                setTooltip({ show: false, x: 0, y: 0, content: null });
                                            }}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "#3b82f6", outline: "none", cursor: "pointer" },
                                                pressed: { outline: "none" },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ComposableMap>
                </div>
                
                {/* Map Tooltip */}
                {tooltip.show && tooltip.content && (
                    <div 
                        className="fixed z-[100] pointer-events-none bg-white text-zinc-900 shadow-xl rounded-md px-3 py-2 flex items-center gap-6 text-sm font-semibold border border-zinc-200"
                        style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
                    >
                        <div className="flex items-center gap-2">
                            <span>{tooltip.content.name}</span>
                        </div>
                        <span className="text-zinc-500 font-normal">{tooltip.content.value}</span>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TrafficPanel;
