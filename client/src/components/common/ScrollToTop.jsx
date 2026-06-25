import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scrolls to top on every route change (including footer / in-app links).
 * Skips scrolling to top on POP navigation (browser back/forward) to preserve scroll restoration.
 */
const ScrollToTop = () => {
	const { pathname } = useLocation();
	const navType = useNavigationType();

	useEffect(() => {
		if (navType !== "POP") {
			window.scrollTo({ top: 0, left: 0, behavior: "instant" });
		}
	}, [pathname, navType]);

	return null;
};

export default ScrollToTop;
