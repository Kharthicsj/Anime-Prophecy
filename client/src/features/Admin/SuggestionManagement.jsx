import React, { useState, useEffect, useMemo } from 'react';
import { FaTrash, FaCheckSquare, FaSquare, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import apiClient from '../../services/apiClient';

const COLORS = ['#7c3aed', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const SuggestionManagement = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/suggestions');
            setSuggestions(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSave = async (id, currentStatus) => {
        try {
            await apiClient.put(`/suggestions/${id}`, { isSaved: !currentStatus });
            setSuggestions(prev => prev.map(s => s._id === id ? { ...s, isSaved: !currentStatus } : s));
        } catch (err) {
            console.error("Failed to update suggestion", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this suggestion?")) return;
        try {
            await apiClient.delete(`/suggestions/${id}`);
            setSuggestions(prev => prev.filter(s => s._id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (err) {
            console.error("Failed to delete suggestion", err);
        }
    };

    const handleDeleteMultiple = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} suggestions?`)) return;
        
        try {
            await apiClient.post('/suggestions/delete-multiple', { ids: selectedIds });
            setSuggestions(prev => prev.filter(s => !selectedIds.includes(s._id)));
            setSelectedIds([]);
        } catch (err) {
            console.error("Failed to delete multiple suggestions", err);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("WARNING: Are you sure you want to delete ALL suggestions? This cannot be undone.")) return;
        try {
            await apiClient.delete('/suggestions');
            setSuggestions([]);
            setSelectedIds([]);
        } catch (err) {
            console.error("Failed to delete all suggestions", err);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === suggestions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(suggestions.map(s => s._id));
        }
    };

    // Chart Data Preparation
    const countryData = useMemo(() => {
        const counts = {};
        suggestions.forEach(s => {
            counts[s.country] = (counts[s.country] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [suggestions]);



    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#18181b', border: '1px solid #3f3f46', padding: '0.5rem 1rem', borderRadius: '8px', color: '#fff' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{`${payload[0].name} : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                    Product Suggestions
                </h2>
                <p style={{ margin: 0, color: "#71717a", fontSize: "0.9rem" }}>
                    Manage user requests for new products and analyze trends.
                </p>
            </div>

            {/* Charts Section */}
            {suggestions.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: "rgba(24,24,27,0.7)", border: "1px solid #27272a", borderRadius: "14px", padding: "1.5rem", display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Requests by Country</h3>
                        <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={countryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {countryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#a1a1aa' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', marginTop: '-10px' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{suggestions.length}</div>
                                <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Total</div>
                            </div>
                        </div>
                    </div>


                </div>
            )}

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleDeleteMultiple}
                        disabled={selectedIds.length === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            border: `1px solid ${selectedIds.length > 0 ? '#ef4444' : '#3f3f46'}`,
                            background: selectedIds.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            color: selectedIds.length > 0 ? '#ef4444' : '#71717a',
                            cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        <FaTrash /> Delete Selected ({selectedIds.length})
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        disabled={suggestions.length === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            border: '1px solid #ef4444', background: '#ef4444', color: '#fff',
                            cursor: suggestions.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        <FaTrash /> Delete All
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div style={{ background: "rgba(24,24,27,0.7)", border: "1px solid #27272a", borderRadius: "14px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>Loading suggestions...</div>
                ) : suggestions.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>No product suggestions found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #27272a', background: 'rgba(9,9,11,0.5)' }}>
                                    <th style={{ padding: '1rem', width: '40px' }}>
                                        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            {selectedIds.length === suggestions.length ? <FaCheckSquare size={16} color="#a855f7" /> : <FaSquare size={16} />}
                                        </button>
                                    </th>
                                    <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Save</th>
                                    <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Info</th>
                                    <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</th>
                                    <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Details</th>
                                    <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                    <th style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suggestions.map(s => (
                                    <tr key={s._id} style={{ borderBottom: '1px solid #27272a', background: selectedIds.includes(s._id) ? 'rgba(168,85,247,0.05)' : 'transparent', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => toggleSelect(s._id)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                {selectedIds.includes(s._id) ? <FaCheckSquare size={16} color="#a855f7" /> : <FaSquare size={16} />}
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => toggleSave(s._id, s.isSaved)} title={s.isSaved ? "Unsave" : "Save"} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                                {s.isSaved ? <FaBookmark size={18} color="#facc15" /> : <FaRegBookmark size={18} color="#71717a" />}
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>{s.name}</div>
                                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.2rem' }}>{s.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#e4e4e7', fontSize: '0.875rem' }}>
                                            {s.country}
                                        </td>
                                        <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                            <div style={{ color: '#e4e4e7', fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={s.productDetails}>
                                                {s.productDetails}
                                            </div>
                                            {s.relevantLink && (
                                                <a href={s.relevantLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#a855f7', textDecoration: 'none', wordBreak: 'break-all' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                                    {s.relevantLink} ↗
                                                </a>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#a1a1aa', fontSize: '0.875rem' }}>
                                            {new Date(s.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(s._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}>
                                                <FaTrash size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuggestionManagement;
