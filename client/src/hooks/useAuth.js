import { useState, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const readStoredUser = () => {
    try {
        const rawUser = localStorage.getItem("authUser");
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

const writeStoredUser = (user) => {
    if (!user) {
        localStorage.removeItem("authUser");
        return;
    }

    localStorage.setItem("authUser", JSON.stringify(user));
};

/**
 * Custom hook for authentication
 */
export const useAuth = () => {
    const [user, setUser] = useState(() => readStoredUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/login`,
                { email, password },
                { withCredentials: true }
            );

            if (response.data.success) {
                setUser(response.data.data.user);
                writeStoredUser(response.data.data.user);
                localStorage.setItem("token", response.data.data.token);
                return response.data.data;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed';
            setError(errorMessage);
            console.error('Login error:', errorMessage);
        } finally {
            setLoading(false);
        }

        return null;
    }, []);

    const register = useCallback(async (username, email, password, confirmPassword) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username,
                email,
                password,
                confirmPassword,
            });

            if (response.data.success) {
                setUser(response.data.data.user);
                writeStoredUser(response.data.data.user);
                localStorage.setItem("token", response.data.data.token);
                return response.data.data;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            console.error('Registration error:', errorMessage);
        } finally {
            setLoading(false);
        }

        return null;
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
            setUser(null);
            localStorage.removeItem("token");
            writeStoredUser(null);
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const getCurrentUser = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return null;

        try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setUser(response.data.data.user);
                writeStoredUser(response.data.data.user);
                return response.data.data.user;
            }
        } catch (err) {
            console.error("Get current user error:", err);
            localStorage.removeItem("token");
            writeStoredUser(null);
        }

        return null;
    }, []);

    return {
        user,
        loading,
        error,
        login,
        register,
        logout,
        getCurrentUser,
        setUser,
    };
};

export default useAuth;
