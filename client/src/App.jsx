import { useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import AppProvider from "./context/AppContext";
import useAuth from "./hooks/useAuth";
import { useAppContext } from "./hooks/useAppContext";

import LandingPage from "./features/Landing/LandingPage";
import Homepage from "./features/Home/Homepage";
import ProductDisplayPage from "./features/Product/ProductDisplayPage";
import LoadingAnimation from "./components/common/LoadingAnimation";

// Admin Pages
import AdminLogin from "./features/Admin/AdminLogin";
import AdminRegister from "./features/Admin/AdminRegister";
import AdminDashboard from "./features/Admin/AdminDashboard";
import ProductManagement from "./features/Admin/ProductManagement";
import BannerManagement from "./features/Admin/BannerManagement";
import CarouselManagement from "./features/Admin/CarouselManagement";
import TrendingManagement from "./features/Admin/TrendingManagement";
import LegalPage from "./features/Legal/LegalPage";
import NotFoundPage from "./features/NotFound/NotFoundPage";

// Footer
import Footer from "./components/common/Footer";
import ScrollToTop from "./components/common/ScrollToTop";

/**
 * Protected Route Component
 */
const ProtectedRoute = ({ children }) => {
	const { user } = useAuth();
	return user ? children : <Navigate to="/admin/login" replace />;
};

const PageWithFooter = ({ children }) => (
	<>
		{children}
		<Footer />
	</>
);

const AppRoutes = () => {
	const { getCurrentUser } = useAuth();
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		const initializeApp = async () => {
			await getCurrentUser();
			setIsInitialLoading(false);
		};
		initializeApp();
	}, [getCurrentUser]);

	if (isInitialLoading) {
		return <LoadingAnimation />;
	}

	return (
		<Routes>
			<Route
				path="/"
				element={
					<PageWithFooter>
						<LandingPage />
					</PageWithFooter>
				}
			/>
			<Route
				path="/country/:countrySlug"
				element={
					<PageWithFooter>
						<Homepage />
					</PageWithFooter>
				}
			/>
			<Route
				path="/country/:countrySlug/anime/:animeTagSlug"
				element={
					<PageWithFooter>
						<Homepage />
					</PageWithFooter>
				}
			/>
			<Route
				path="/legal/:page"
				element={
					<PageWithFooter>
						<LegalPage />
					</PageWithFooter>
				}
			/>
			<Route
				path="/product/:id"
				element={
					<PageWithFooter>
						<ProductDisplayPage />
					</PageWithFooter>
				}
			/>
			<Route path="/admin/login" element={<AdminLogin />} />
			<Route path="/admin/register" element={<AdminRegister />} />
			<Route
				path="/admin/dashboard"
				element={
					<ProtectedRoute>
						<PageWithFooter>
							<AdminDashboard />
						</PageWithFooter>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin/products"
				element={
					<ProtectedRoute>
						<PageWithFooter>
							<ProductManagement />
						</PageWithFooter>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin/banners"
				element={
					<ProtectedRoute>
						<PageWithFooter>
							<BannerManagement />
						</PageWithFooter>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin/carousels"
				element={
					<ProtectedRoute>
						<PageWithFooter>
							<CarouselManagement />
						</PageWithFooter>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin/trending"
				element={
					<ProtectedRoute>
						<PageWithFooter>
							<TrendingManagement />
						</PageWithFooter>
					</ProtectedRoute>
				}
			/>
			<Route
				path="*"
				element={
					<PageWithFooter>
						<NotFoundPage />
					</PageWithFooter>
				}
			/>
		</Routes>
	);
};

/**
 * Main App Component
 * Routing and context setup
 */
function App() {
	return (
		<HelmetProvider>
			<AppProvider>
				<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
					<ScrollToTop />
					<AppRoutes />
				</Router>
			</AppProvider>
		</HelmetProvider>
	);
}

export default App;
