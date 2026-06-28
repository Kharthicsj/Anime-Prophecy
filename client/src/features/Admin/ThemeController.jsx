import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { SearchableDropdown } from '../../components/common/FilterPanel';
import { ANIME_FILTER_OPTIONS, STORE_FILTER_OPTIONS } from '../../constants/productFilters';
import { countries } from '../../utils/countries';
import ProductCard from '../../components/common/ProductCard';

const ThemeController = () => {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        tagType: 'anime',
        tag: '',
        backgroundColor: '#9333ea',
        textColor: '#ffffff',
        borderColor: 'transparent',
        buttonColor: '#9333ea',
        priceColor: '#c084fc',
        categoryBgColor: '#27272a',
        categoryTextColor: '#e4e4e7',
        subCategoryBgColor: '#4c1d95',
        subCategoryTextColor: '#c4b5fd'
    });
    const [editingId, setEditingId] = useState(null);

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
                // ignore
            }
        };
        fetchMeta();
    }, []);

    const fetchThemes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/themes');
            if (res.data.success) {
                setThemes(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch themes', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThemes();
    }, [fetchThemes]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'tagType' && value === 'general') {
                next.tag = 'Global';
            } else if (name === 'tagType' && prev.tagType === 'general') {
                next.tag = '';
            }
            return next;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.tag) {
            alert("Please select a tag name.");
            return;
        }
        setSaving(true);
        try {
            const res = await apiClient.post('/themes', formData);
            if (res.data.success) {
                fetchThemes();
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    tagType: 'anime',
                    tag: '',
                    backgroundColor: '#9333ea',
                    textColor: '#ffffff',
                    borderColor: 'transparent',
                    buttonColor: '#9333ea',
                    priceColor: '#c084fc',
                    categoryBgColor: '#27272a',
                    categoryTextColor: '#e4e4e7',
                    subCategoryBgColor: '#4c1d95',
                    subCategoryTextColor: '#c4b5fd'
                });
            }
        } catch (error) {
            console.error('Failed to save theme', error);
            alert(error.response?.data?.message || 'Failed to save theme');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (theme) => {
        setFormData({
            tagType: theme.tagType,
            tag: theme.tag,
            backgroundColor: theme.backgroundColor,
            textColor: theme.textColor,
            borderColor: theme.borderColor,
            buttonColor: theme.buttonColor || '#9333ea',
            priceColor: theme.priceColor || '#c084fc',
            categoryBgColor: theme.categoryBgColor || '#27272a',
            categoryTextColor: theme.categoryTextColor || '#e4e4e7',
            subCategoryBgColor: theme.subCategoryBgColor || '#4c1d95',
            subCategoryTextColor: theme.subCategoryTextColor || '#c4b5fd'
        });
        setEditingId(theme._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this theme?')) return;
        setLoading(true);
        try {
            await apiClient.delete(`/themes/${id}`);
            fetchThemes();
        } catch (error) {
            console.error('Failed to delete theme', error);
        } finally {
            setLoading(false);
        }
    };

    const tagTypeOptions = [
        { value: 'anime', label: 'Anime (e.g., Demon Slayer)' },
        { value: 'store', label: 'Store (e.g., Amazon)' },
        { value: 'country', label: 'Country (e.g., INDIA)' },
        { value: 'general', label: 'General (Whole Card)' }
    ];

    const mergeUnique = (staticArr, dynamicArr) => {
        const set = new Set([...staticArr, ...dynamicArr]);
        return [...set];
    };

    const getTagOptions = () => {
        let options = [];
        switch (formData.tagType) {
            case 'anime':
                options = mergeUnique(ANIME_FILTER_OPTIONS.filter(v => v !== 'All Anime'), dynamicOptions.animeTags);
                break;
            case 'store':
                options = mergeUnique(STORE_FILTER_OPTIONS.filter(v => v !== 'All Stores'), dynamicOptions.stores);
                break;
            case 'country':
                options = mergeUnique(countries.filter(c => c.value !== 'Worldwide').map(c => c.value), dynamicOptions.countries);
                break;
            case 'general':
                options = ['Global'];
                break;
            default:
                options = [];
        }
        return options.map(opt => ({ value: opt, label: opt }));
    };

    if (loading) {
        return <LoadingAnimation message="Loading Themes..." />;
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4 mt-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Theme & Color Controller</h2>
                    <p className="text-zinc-400 text-sm mt-1">Manage colors for product tags (Anime, Store, Country, etc.)</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                        <FiPlus /> Add Theme
                    </Button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-zinc-950 p-5 rounded-xl border border-zinc-700 mb-8 space-y-4 shadow-lg shadow-purple-900/10">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-purple-300">{editingId ? 'Edit Theme' : 'New Theme'}</h3>
                        <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-zinc-500 hover:text-red-400 transition-colors">
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-1">Tag Type</label>
                            <select
                                name="tagType"
                                value={formData.tagType}
                                onChange={handleInputChange}
                                className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:outline-none focus:border-purple-500"
                                required
                            >
                                {tagTypeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <SearchableDropdown
                                label={<span className="text-sm font-semibold text-zinc-300">Tag Name (Select) *</span>}
                                value={formData.tag}
                                onChange={(val) => setFormData(p => ({ ...p, tag: val }))}
                                options={getTagOptions()}
                                buttonStyle={{ padding: "0.55rem 0.75rem", opacity: formData.tagType === 'general' ? 0.7 : 1, pointerEvents: formData.tagType === 'general' ? 'none' : 'auto' }}
                            />
                        </div>
                        
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border border-zinc-800 p-4 rounded-lg bg-zinc-900/50 mt-2">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Background Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="backgroundColor" 
                                        value={formData.backgroundColor} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="backgroundColor" 
                                        value={formData.backgroundColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Text Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="textColor" 
                                        value={formData.textColor} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="textColor" 
                                        value={formData.textColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Border Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="borderColor" 
                                        value={formData.borderColor === 'transparent' ? '#000000' : formData.borderColor} 
                                        onChange={(e) => setFormData(p => ({ ...p, borderColor: e.target.value }))} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="borderColor" 
                                        value={formData.borderColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                        placeholder="e.g. transparent, #fff"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Button Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="buttonColor" 
                                        value={formData.buttonColor || '#9333ea'} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="buttonColor" 
                                        value={formData.buttonColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Price Text Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="priceColor" 
                                        value={formData.priceColor || '#c084fc'} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="priceColor" 
                                        value={formData.priceColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Category Tag Bg</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="categoryBgColor" 
                                        value={formData.categoryBgColor || '#27272a'} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="categoryBgColor" 
                                        value={formData.categoryBgColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Category Tag Text</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="categoryTextColor" 
                                        value={formData.categoryTextColor || '#e4e4e7'} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="categoryTextColor" 
                                        value={formData.categoryTextColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Subcategory Tag Bg</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="subCategoryBgColor" 
                                        value={formData.subCategoryBgColor || '#4c1d95'} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="subCategoryBgColor" 
                                        value={formData.subCategoryBgColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-1">Subcategory Tag Text</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        name="subCategoryTextColor" 
                                        value={formData.subCategoryTextColor || '#c4b5fd'} 
                                        onChange={handleInputChange} 
                                        className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <Input 
                                        name="subCategoryTextColor" 
                                        value={formData.subCategoryTextColor} 
                                        onChange={handleInputChange} 
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
                            <div className="text-zinc-500 text-sm mb-4 self-start">Card Preview</div>
                            <div className="w-full max-w-[280px] pointer-events-none">
                                <ProductCard 
                                    product={{
                                        _id: 'preview',
                                        title: 'Preview Product Name',
                                        category: 'Figures',
                                        subCategory: 'Action Figure',
                                        price: 49.99,
                                        currency: 'USD',
                                        rating: 0,
                                        inStock: true,
                                        animeTag: formData.tagType === 'anime' ? formData.tag || 'Anime' : 'Demon Slayer',
                                        store: formData.tagType === 'store' ? formData.tag || 'Store' : 'Amazon',
                                        countries: formData.tagType === 'country' ? [formData.tag || 'Country'] : ['US', 'UK'],
                                        images: [{ isMain: true, url: 'https://placehold.co/400x400/18181b/a855f7?text=Preview' }]
                                    }}
                                    showCountryTag={true}
                                    overrideTheme={{...formData}}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
                            <FiSave /> {saving ? 'Saving...' : 'Save Theme'}
                        </Button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-400">
                        <tr>
                            <th className="px-4 py-3">Tag Type</th>
                            <th className="px-4 py-3">Tag</th>
                            <th className="px-4 py-3">Preview</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {themes.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-6 text-zinc-500">No themes configured yet.</td>
                            </tr>
                        ) : (
                            themes.map(theme => (
                                <tr key={theme._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-4 py-3 capitalize">{theme.tagType}</td>
                                    <td className="px-4 py-3 font-semibold text-white">{theme.tag}</td>
                                    <td className="px-4 py-3">
                                        <span 
                                            style={{
                                                backgroundColor: theme.backgroundColor,
                                                color: theme.textColor,
                                                borderColor: theme.borderColor === 'transparent' ? 'transparent' : theme.borderColor,
                                                borderWidth: theme.borderColor !== 'transparent' ? '1px' : '0',
                                                borderStyle: 'solid'
                                            }}
                                            className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm inline-block"
                                        >
                                            {theme.tag}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        <button onClick={() => handleEdit(theme)} className="p-1.5 text-zinc-400 hover:text-purple-400 transition-colors bg-zinc-800 rounded">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(theme._id)} className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors bg-zinc-800 rounded">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ThemeController;
