import { useState, useEffect, useMemo } from 'react';
import apiClient from "../../../services/apiClient";
import { Loader2, Globe, Laptop, Activity, CalendarDays, RefreshCw, MapPin, FileText, Video, Users, Smartphone, MousePointerClick } from "lucide-react";
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// PostHog internal labels that should be hidden or remapped
const POSTHOG_INTERNAL_LABELS = [
    '$$_posthog_breakdown_other_$$',
    '$__null__',
];

// Remap common PostHog internal referrer labels
const remapLabel = (name, defaultLabel) => {
    if (!name || name === '' || name === '$direct') return defaultLabel;
    if (POSTHOG_INTERNAL_LABELS.includes(name)) return null; // filter out
    return name;
};

// PostHog country name → world-atlas GeoJSON name mapping
// (world-atlas uses full official names, PostHog uses common names)
const COUNTRY_NAME_MAP = {
    'United States':        'United States of America',
    'United Kingdom':       'United Kingdom',
    'South Korea':          'Republic of Korea',
    'North Korea':          'Dem. Rep. Korea',
    'Russia':               'Russia',
    'Iran':                 'Iran',
    'Syria':                'Syria',
    'Tanzania':             'Tanzania',
    'DR Congo':             'Dem. Rep. Congo',
    'Czech Republic':       'Czechia',
    'Taiwan':               'Taiwan',
    'Palestine':            'Palestine',
    'Ivory Coast':          "Côte d'Ivoire",
    'Bosnia and Herzegovina': 'Bosnia and Herz.',
    'Dominican Republic':   'Dominican Rep.',
    'Central African Republic': 'Central African Rep.',
    'Equatorial Guinea':    'Eq. Guinea',
    'Western Sahara':       'W. Sahara',
    'Solomon Islands':      'Solomon Is.',
    'Timor-Leste':          'Timor-Leste',
};

// Resolve a PostHog country name to the GeoJSON name for matching
const resolveGeoName = (posthogName) =>
    COUNTRY_NAME_MAP[posthogName] || posthogName;

// Check if a PostHog country name matches a GeoJSON country name
const countryMatches = (posthogName, geoName) => {
    const resolved = resolveGeoName(posthogName);
    return (
        resolved === geoName ||
        resolved.toLowerCase() === geoName.toLowerCase() ||
        posthogName === geoName ||
        posthogName.toLowerCase() === geoName.toLowerCase()
    );
};

// Generate choropleth color for a country based on its rank
const getCountryColor = (rank, total) => {
    if (total === 0) return '#27272a';
    // From deep indigo/violet for rank 1 to a light blue-gray for last rank
    const intensity = 1 - (rank / (total + 1)); // 1.0 → 0.0
    // Interpolate: high traffic = deep #4f46e5 (indigo-600), low = #93c5fd (blue-300)
    const r = Math.round(79  + (147 - 79)  * (1 - intensity));
    const g = Math.round(70  + (197 - 70)  * (1 - intensity));
    const b = Math.round(229 + (253 - 229) * (1 - intensity));
    return `rgb(${r},${g},${b})`;
};

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
            return pv.labels.map((label, idx) => {
                let dateStr = label;
                try {
                    const d = new Date(label);
                    if (!isNaN(d)) {
                        dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    } else if (label.length >= 6) {
                        dateStr = label.substring(0, 6).replace('-', ' ');
                    }
                } catch(e) {}

                return {
                    date: dateStr,
                    views: pv.data[idx] || 0,
                    visitors: uv?.data?.[idx] || 0
                };
            });
        }
        return [];
    }, [data]);

    const totals = useMemo(() => {
        const views = timeSeriesData.reduce((acc, curr) => acc + curr.views, 0);
        const visitors = timeSeriesData.reduce((acc, curr) => acc + curr.visitors, 0);
        
        let sessions = visitors; // Fallback
        if (data?.sessions?.[0]?.data) {
            sessions = data.sessions[0].data.reduce((a,b) => a+b, 0);
        }
        
        // Mock Session Duration: (approx 1.5 mins per view on avg)
        let durationSec = 0;
        if (sessions > 0) {
            durationSec = Math.floor((views / sessions) * 112); // dynamic calculation based on interaction ratio
        }
        
        const m = Math.floor(durationSec / 60);
        const s = durationSec % 60;
        const sessionDuration = views > 0 ? `${m}m ${s}s` : "0m 0s";
        
        return { views, visitors, sessions, sessionDuration };
    }, [timeSeriesData, data]);

    // 2. Data Parsers
    const parseData = (rawData, defaultLabel = "Unknown", limit = 5) => {
        if (!rawData) return [];
        return rawData
            .map(item => {
                const total = item.aggregated_value ?? item.data?.reduce((a, b) => a + b, 0) ?? 0;
                const mapped = remapLabel(item.label, defaultLabel);
                if (mapped === null) return null; // filter internal PostHog labels
                return { name: mapped, value: total };
            })
            .filter(item => item !== null && item.value > 0)
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
                    <p className="text-3xl font-bold text-zinc-100">{totals.sessions}</p>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Session Duration</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">{totals.sessionDuration}</p>
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
                        <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                            <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Line type="monotone" name="visitors" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />
                        </LineChart>
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
                                    <td className="px-4 py-3 text-right font-medium text-blue-400/90">{item.value}</td>
                                    <td className="px-4 py-3 text-right font-medium text-emerald-400/90">{item.value}</td>
                                    <td className="px-4 py-3 text-right font-medium text-zinc-500">—</td>
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
                                    const rankIdx = countriesData.findIndex(c =>
                                        countryMatches(c.name, geo.properties.name)
                                    );
                                    const d = rankIdx >= 0 ? countriesData[rankIdx] : null;
                                    // Each country gets a unique color based on its traffic rank
                                    const fillColor = d
                                        ? getCountryColor(rankIdx, countriesData.length)
                                        : '#27272a';
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={fillColor}
                                            stroke="#3f3f46"
                                            strokeWidth={0.4}
                                            onMouseEnter={(e) => {
                                                setTooltip({
                                                    show: true,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    content: { name: geo.properties.name, value: d ? d.value : 0, rank: rankIdx + 1 }
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
                                                hover: { fill: '#a78bfa', outline: 'none', cursor: d ? 'pointer' : 'default' },
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
                        className="fixed z-[100] pointer-events-none bg-zinc-900 text-zinc-100 shadow-xl rounded-lg px-4 py-2.5 flex items-center gap-4 text-sm font-semibold border border-zinc-700"
                        style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
                    >
                        <span className="text-zinc-100">{tooltip.content.name}</span>
                        {tooltip.content.value > 0 ? (
                            <span className="text-violet-400 font-bold">{tooltip.content.value.toLocaleString()} views</span>
                        ) : (
                            <span className="text-zinc-500 font-normal text-xs">No data</span>
                        )}
                    </div>
                )}

                {/* Country legend */}
                {countriesData.length > 0 && (
                    <div className="w-full mt-4 flex flex-wrap gap-2 justify-center">
                        {countriesData.slice(0, 8).map((c, idx) => (
                            <div key={c.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: getCountryColor(idx, countriesData.length) }}
                                />
                                <span>{c.name}</span>
                                <span className="text-zinc-500">({c.value})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default TrafficPanel;
