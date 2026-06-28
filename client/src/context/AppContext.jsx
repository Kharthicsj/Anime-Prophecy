/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback, useEffect } from "react";
import { normalizeCountryValue } from "../utils/countries";
import apiClient from "../services/apiClient";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
	const [selectedCountry, setSelectedCountry] = useState(() => {
		return normalizeCountryValue(localStorage.getItem("selectedCountry"));
	});

	const [selectedLanguage, setSelectedLanguage] = useState(() => {
		return localStorage.getItem("selectedLanguage") || "en";
	});

	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(false);
	const [themes, setThemes] = useState([]);

	useEffect(() => {
		const fetchThemes = async () => {
			try {
				const res = await apiClient.get('/themes');
				if (res.data?.success) {
					setThemes(res.data.data);
				}
			} catch (error) {
				console.error("Failed to fetch themes", error);
			}
		};
		fetchThemes();
	}, []);

	const getTheme = useCallback((tagType, tag) => {
		if (!tag) return null;
		// Case insensitive match
		return themes.find(t => t.tagType === tagType && t.tag.toLowerCase() === tag.toLowerCase()) || null;
	}, [themes]);

	const updateCountry = useCallback((country) => {
		setSelectedCountry(country);
		localStorage.setItem("selectedCountry", country);
	}, []);

	const updateLanguage = useCallback((language) => {
		setSelectedLanguage(language);
		localStorage.setItem("selectedLanguage", language);
	}, []);

	const updateUser = useCallback((userData, authenticated = true) => {
		setUser(userData);
		setIsAuthenticated(authenticated);
	}, []);

	const value = {
		selectedCountry,
		updateCountry,
		selectedLanguage,
		updateLanguage,
		user,
		updateUser,
		isAuthenticated,
		setIsAuthenticated,
		loading,
		setLoading,
		themes,
		getTheme,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
