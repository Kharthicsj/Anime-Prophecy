import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { SearchableDropdown } from './FilterPanel';
import { countries } from '../../utils/countries';
import apiClient from '../../services/apiClient';

const SuggestProductModal = ({ isOpen, onClose, defaultCountry }) => {
    const initialCountry = (defaultCountry && defaultCountry !== 'Worldwide') ? defaultCountry : 'Select Country';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        country: initialCountry,
        productDetails: '',
        relevantLink: ''
    });
    const [otherCountry, setOtherCountry] = useState('');
    const [dynamicCountries, setDynamicCountries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await apiClient.get("/products/meta/filters");
                const d = res.data?.data || {};
                setDynamicCountries(d.countries || []);
            } catch {
                // silently ignore
            }
        };
        fetchMeta();
    }, []);

    if (!isOpen) return null;

    const staticCountry = countries.filter(c => c.value !== "Worldwide");
    const knownCountryValues = new Set(staticCountry.map(c => c.value));
    const customCountries = dynamicCountries.filter(v => !knownCountryValues.has(v) && v !== "Worldwide");

    const countryOptions = [
        { value: "Select Country", label: "Select Country" },
        ...staticCountry.map(c => ({ value: c.value, label: c.label })),
        ...customCountries.map(v => ({ value: v, label: v })),
        { value: "Other", label: "Other" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCountryChange = (val) => {
        setFormData(prev => ({ ...prev, country: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        let finalCountry = formData.country;
        if (finalCountry === 'Other') {
            if (!otherCountry.trim()) {
                setError('Please specify your country');
                return;
            }
            finalCountry = otherCountry.trim();
        } else if (finalCountry === 'Select Country') {
            setError('Please select a country');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/suggestions', { ...formData, country: finalCountry });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    name: '',
                    email: '',
                    country: initialCountry,
                    productDetails: '',
                    relevantLink: ''
                });
                setOtherCountry('');
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit suggestion. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                padding: '2rem',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <FaTimes />
                </button>

                <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>
                    Suggest a Product
                </h2>

                {success ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#4ade80' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                        <h3 style={{ margin: 0 }}>Thank you!</h3>
                        <p style={{ color: '#a1a1aa', marginTop: '0.5rem' }}>Your suggestion has been submitted successfully.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{error}</div>}
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>Name <span style={{color: '#ef4444'}}>*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #3f3f46',
                                    background: '#09090b',
                                    color: '#fff',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>Email <span style={{color: '#ef4444'}}>*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #3f3f46',
                                    background: '#09090b',
                                    color: '#fff',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ position: 'relative', zIndex: 50 }}>
                            <SearchableDropdown
                                label={<span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Country <span style={{color: '#ef4444'}}>*</span></span>}
                                value={formData.country}
                                options={countryOptions}
                                onChange={handleCountryChange}
                            />
                        </div>

                        {formData.country === 'Other' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>Specify Country <span style={{color: '#ef4444'}}>*</span></label>
                                <input
                                    type="text"
                                    value={otherCountry}
                                    onChange={(e) => setOtherCountry(e.target.value)}
                                    placeholder="Enter your country"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #3f3f46',
                                        background: '#09090b',
                                        color: '#fff',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>Product Details <span style={{color: '#ef4444'}}>*</span></label>
                            <textarea
                                name="productDetails"
                                value={formData.productDetails}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Tell us about the product you want..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #3f3f46',
                                    background: '#09090b',
                                    color: '#fff',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.875rem' }}>Relevant Link (Optional)</label>
                            <input
                                type="url"
                                name="relevantLink"
                                value={formData.relevantLink}
                                onChange={handleChange}
                                placeholder="https://..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #3f3f46',
                                    background: '#09090b',
                                    color: '#fff',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '1rem',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: loading ? '#9333ea' : '#7c3aed',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                fontFamily: 'inherit'
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Suggestion'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SuggestProductModal;
