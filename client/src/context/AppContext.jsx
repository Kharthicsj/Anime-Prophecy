/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from "react";
import { normalizeCountryValue } from "../utils/countries";

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
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
