import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom hook for product fetching and filtering
 */
export const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 12,
        total: 0,
        pages: 0,
    });

    const fetchProducts = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                country: filters.country || 'US',
                animeTag: filters.animeTag || 'All Anime',
                store: filters.store || 'All Stores',
                category: filters.category || 'All Categories',
                page: filters.page || 1,
                limit: filters.limit || 12,
                ...(filters.search && { search: filters.search }),
                ...(filters.sort && { sort: filters.sort }),
            });

            const response = await axios.get(`${API_BASE_URL}/products?${queryParams}`, {
                withCredentials: true,
            });

            if (response.data.success) {
                setProducts(response.data.data.products);
                setPagination(response.data.data.pagination);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch products';
            setError(errorMessage);
            console.error('Error fetching products:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const getProductById = useCallback(async (productId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/products/${productId}`, {
                withCredentials: true,
            });

            if (response.data.success) {
                return response.data.data.product;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch product';
            setError(errorMessage);
            console.error('Error fetching product:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        products,
        loading,
        error,
        pagination,
        fetchProducts,
        getProductById,
    };
};

export default useProducts;
