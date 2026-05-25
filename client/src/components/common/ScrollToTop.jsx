import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to top on every route change (including footer / in-app links).
 */
const ScrollToTop = () => {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "instant" });
	}, [pathname]);

	return null;
};

export default ScrollToTop;
