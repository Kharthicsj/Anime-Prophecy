import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import apiClient from "../../services/apiClient";
import NewsletterPanel from "./NewsletterPanel";

/* ─── Icons (inline SVG) ─── */
const Icon = ({ d, size = 20 }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d={d} />
	</svg>
);
const IcChart = () => <Icon d="M3 3v18h18M7 16l4-4 4 4 4-4" />;
const IcBox = () => (
	<Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
);
const IcImage = () => (
	<Icon d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M16 5h6m-3-3v6M9 15l3-3 3 3" />
);
const IcSlides = () => (
	<Icon d="M2 7h4v10H2zM6 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6V7zM18 7h4v10h-4" />
);
const IcTrending = () => (
	<Icon d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6L12 2z" />
);
const IcCog = () => (
	<Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7-3a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
);
const IcLogout = () => (
	<Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
);
const IcArrow = () => <Icon d="M5 12h14M12 5l7 7-7 7" />;
const IcLandscape = () => <Icon d="M3 9l4-4 4 4 4-6 6 6H3zM3 21h18v-6H3v6z" />;

const NAV_ITEMS = [
	{ id: "overview", label: "Overview", Icon: IcChart },
	{ id: "products", label: "Products", Icon: IcBox },
	{ id: "banners", label: "Banners", Icon: IcImage },
	{ id: "carousels", label: "Carousels", Icon: IcSlides },
	{ id: "trending", label: "Trending Products", Icon: IcTrending },
	{ id: "landingImage", label: "Landing Image", Icon: IcLandscape },
	{ id: "newsletters", label: "Newsletters", Icon: IcCog },
];

/* ─── Stat card ─── */
const StatCard = ({ label, value, sub, accent }) => (
	<div
		style={{
			background: "rgba(24,24,27,0.7)",
			border: "1px solid #27272a",
			borderRadius: "14px",
			padding: "1.5rem",
			position: "relative",
			overflow: "hidden",
		}}
	>
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				height: "2px",
				background: accent,
				borderRadius: "14px 14px 0 0",
			}}
		/>
		<p
			style={{
				margin: "0 0 0.5rem",
				fontSize: "0.75rem",
				color: "#71717a",
				letterSpacing: "0.1em",
				textTransform: "uppercase",
			}}
		>
			{label}
		</p>
		<p
			style={{
				margin: "0 0 0.25rem",
				fontSize: "2rem",
				fontWeight: 800,
				color: "#fff",
			}}
		>
			{value ?? "—"}
		</p>
		<p style={{ margin: 0, fontSize: "0.75rem", color: "#52525b" }}>
			{sub}
		</p>
	</div>
);

/* ─── Quick action card ─── */
const ActionCard = ({ label, desc, onClick, Icon: Ic }) => {
	const [hov, setHov] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHov(true)}
			onMouseLeave={() => setHov(false)}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "1rem",
				padding: "1.25rem",
				borderRadius: "12px",
				border: `1px solid ${hov ? "rgba(168,85,247,0.5)" : "#27272a"}`,
				background: hov
					? "rgba(168,85,247,0.07)"
					: "rgba(24,24,27,0.6)",
				cursor: "pointer",
				textAlign: "left",
				width: "100%",
				transition: "border-color 0.2s, background 0.2s",
				fontFamily: "inherit",
			}}
		>
			<div
				style={{
					width: "42px",
					height: "42px",
					borderRadius: "10px",
					background: "rgba(168,85,247,0.12)",
					border: "1px solid rgba(168,85,247,0.2)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#a855f7",
					flexShrink: 0,
				}}
			>
				<Ic />
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<p
					style={{
						margin: 0,
						fontWeight: 600,
						color: "#fff",
						fontSize: "0.9rem",
					}}
				>
					{label}
				</p>
				<p
					style={{
						margin: "0.2rem 0 0",
						fontSize: "0.78rem",
						color: "#71717a",
					}}
				>
					{desc}
				</p>
			</div>
			<span
				style={{
					color: "#52525b",
					transition: "color 0.2s, transform 0.2s",
					color: hov ? "#a855f7" : "#52525b",
				}}
			>
				<IcArrow />
			</span>
		</button>
	);
};

/* ═══════════════════════════════════════
   Admin Dashboard
═══════════════════════════════════════ */
const AdminDashboard = () => {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [activeTab, setActiveTab] = useState("overview");
	const [analytics, setAnalytics] = useState(null);
	const [newsletterCount, setNewsletterCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false);

	const fetchAnalytics = useCallback(async () => {
		setLoading(true);
		try {
			const res = await apiClient.get("/products/analytics/stats");
			if (res.data.success) setAnalytics(res.data.data);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchNewsletterCount = useCallback(async () => {
		try {
			const res = await apiClient.get("/newsletter/subscribers?limit=1");
			if (res.data.success) {
				setNewsletterCount(res.data.data.pagination?.total || 0);
			}
		} catch {
			/* silent */
		}
	}, []);

	useEffect(() => {
		if (!user) {
			navigate("/admin/login");
			return;
		}
		fetchAnalytics();
		fetchNewsletterCount();
	}, [user, navigate, fetchAnalytics, fetchNewsletterCount]);

	const handleLogout = async () => {
		await logout();
		navigate("/");
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				background:
					"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168,85,247,0.1) 0%, transparent 60%), #09090b",
				fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* ── Top header bar ── */}
			<header
				style={{
					borderBottom: "1px solid #1c1c1f",
					background: "rgba(9,9,11,0.9)",
					backdropFilter: "blur(16px)",
					position: "sticky",
					top: 0,
					zIndex: 50,
					flexShrink: 0,
				}}
			>
				{/* Desktop Header */}
				<div
					style={{
						height: "60px",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 1.5rem",
					}}
					className="hidden md:flex h-15"
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
						}}
					>
						<div
							style={{
								width: "32px",
								height: "32px",
								borderRadius: "8px",
								background:
									"linear-gradient(135deg, #7c3aed, #a855f7)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "0.9rem",
							}}
						>
							✦
						</div>
						<span
							style={{
								fontWeight: 700,
								fontSize: "1rem",
								color: "#fff",
							}}
						>
							Prophecy Hub
						</span>
						<span
							style={{
								padding: "0.15rem 0.5rem",
								borderRadius: "6px",
								background: "rgba(168,85,247,0.15)",
								border: "1px solid rgba(168,85,247,0.3)",
								fontSize: "0.65rem",
								fontWeight: 600,
								letterSpacing: "0.1em",
								textTransform: "uppercase",
								color: "#c4b5fd",
							}}
						>
							Admin
						</span>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "1rem",
						}}
					>
						<span style={{ fontSize: "0.85rem", color: "#71717a" }}>
							Logged in as{" "}
							<span style={{ color: "#c4b5fd", fontWeight: 600 }}>
								{user?.username}
							</span>
						</span>
						<button
							onClick={handleLogout}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.4rem",
								padding: "0.4rem 0.85rem",
								borderRadius: "8px",
								border: "1px solid #3f3f46",
								background: "transparent",
								color: "#a1a1aa",
								fontSize: "0.8rem",
								cursor: "pointer",
								fontFamily: "inherit",
								transition: "border-color 0.2s, color 0.2s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = "#ef4444";
								e.currentTarget.style.color = "#ef4444";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = "#3f3f46";
								e.currentTarget.style.color = "#a1a1aa";
							}}
						>
							<IcLogout />
							Logout
						</button>
						<button
							onClick={() => navigate("/")}
							style={{
								padding: "0.4rem 0.85rem",
								borderRadius: "8px",
								border: "none",
								background: "#7c3aed",
								color: "#fff",
								fontSize: "0.8rem",
								fontWeight: 600,
								cursor: "pointer",
								fontFamily: "inherit",
							}}
						>
							View Site →
						</button>
					</div>
				</div>

				{/* Mobile Header */}
				<div className="md:hidden h-15 flex items-center justify-between px-4">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
						}}
					>
						<div
							style={{
								width: "32px",
								height: "32px",
								borderRadius: "8px",
								background:
									"linear-gradient(135deg, #7c3aed, #a855f7)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "0.9rem",
							}}
						>
							✦
						</div>
						<span
							style={{
								fontWeight: 700,
								fontSize: "0.9rem",
								color: "#fff",
							}}
						>
							Hub
						</span>
					</div>

					<button
						onClick={() =>
							setMobileHeaderMenuOpen(!mobileHeaderMenuOpen)
						}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "40px",
							height: "40px",
							borderRadius: "8px",
							border: "1px solid #3f3f46",
							background: "transparent",
							color: "#a1a1aa",
							cursor: "pointer",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							{mobileHeaderMenuOpen ? (
								<>
									<path d="M6 18L18 6M6 6l12 12" />
								</>
							) : (
								<>
									<path d="M4 6h16M4 12h16M4 18h16" />
								</>
							)}
						</svg>
					</button>
				</div>

				{/* Mobile Menu Dropdown */}
				{mobileHeaderMenuOpen && (
					<div className="md:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 space-y-2">
						<div
							style={{
								fontSize: "0.85rem",
								color: "#71717a",
								marginBottom: "0.5rem",
							}}
						>
							Logged in as{" "}
							<span style={{ color: "#c4b5fd", fontWeight: 600 }}>
								{user?.username}
							</span>
						</div>
						<button
							onClick={() => {
								handleLogout();
								setMobileHeaderMenuOpen(false);
							}}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.4rem",
								padding: "0.6rem 1rem",
								width: "100%",
								borderRadius: "8px",
								border: "1px solid #3f3f46",
								background: "transparent",
								color: "#a1a1aa",
								fontSize: "0.85rem",
								cursor: "pointer",
								fontFamily: "inherit",
								justifyContent: "center",
							}}
						>
							<IcLogout />
							Logout
						</button>
						<button
							onClick={() => {
								navigate("/");
								setMobileHeaderMenuOpen(false);
							}}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "0.4rem",
								padding: "0.6rem 1rem",
								width: "100%",
								borderRadius: "8px",
								border: "none",
								background: "#7c3aed",
								color: "#fff",
								fontSize: "0.85rem",
								fontWeight: 600,
								cursor: "pointer",
								fontFamily: "inherit",
							}}
						>
							View Site →
						</button>
					</div>
				)}
			</header>

			<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
				{/* Sidebar */}
				<aside
					style={{
						width: "240px",
						flexShrink: 0,
						borderRight: "1px solid #1c1c1f",
						background: "rgba(9,9,11,0.6)",
						padding: "1.5rem 0.75rem",
						display: "flex",
						flexDirection: "column",
						gap: "0.25rem",
						position: "sticky",
						top: "60px",
						height: "calc(100vh - 60px)",
						overflowY: "auto",
					}}
				>
					<p
						style={{
							margin: "0 0 0.75rem 0.5rem",
							fontSize: "0.65rem",
							letterSpacing: "0.15em",
							textTransform: "uppercase",
							color: "#52525b",
						}}
					>
						Navigation
					</p>

					{NAV_ITEMS.map(({ id, label, Icon: Ic }) => {
						const active = activeTab === id;
						return (
							<button
								key={id}
								onClick={() => {
									if (id === "banners") {
										navigate("/admin/banners");
										return;
									}
									if (id === "carousels") {
										navigate("/admin/carousels");
										return;
									}
									if (id === "trending") {
										navigate("/admin/trending");
										return;
									}
									if (id === "products") {
										navigate("/admin/products");
										return;
									}
									setActiveTab(id);
								}}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									padding: "0.65rem 0.85rem",
									borderRadius: "10px",
									border: "none",
									background: active
										? "rgba(168,85,247,0.15)"
										: "transparent",
									color: active ? "#c4b5fd" : "#71717a",
									fontSize: "0.875rem",
									fontWeight: active ? 600 : 400,
									cursor: "pointer",
									textAlign: "left",
									width: "100%",
									transition: "background 0.15s, color 0.15s",
									fontFamily: "inherit",
									borderLeft: active
										? "2px solid #a855f7"
										: "2px solid transparent",
								}}
								onMouseEnter={(e) => {
									if (!active) {
										e.currentTarget.style.background =
											"rgba(168,85,247,0.06)";
										e.currentTarget.style.color = "#a1a1aa";
									}
								}}
								onMouseLeave={(e) => {
									if (!active) {
										e.currentTarget.style.background =
											"transparent";
										e.currentTarget.style.color = "#71717a";
									}
								}}
							>
								<Ic />
								{label}
							</button>
						);
					})}

					{/* Divider */}
					<div
						style={{
							borderTop: "1px solid #1c1c1f",
							margin: "1rem 0",
						}}
					/>

					{/* Quick stats in sidebar */}
					<div
						style={{
							padding: "0.5rem",
							borderRadius: "10px",
							background: "rgba(24,24,27,0.5)",
							border: "1px solid #1c1c1f",
						}}
					>
						<p
							style={{
								margin: "0 0 0.5rem",
								fontSize: "0.65rem",
								color: "#52525b",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							Quick Stats
						</p>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.4rem",
							}}
						>
							{[
								{ k: "Products", v: analytics?.totalProducts },
								{ k: "Views", v: analytics?.totalViews },
								{ k: "Clicks", v: analytics?.totalClicks },
								{ k: "Subscribers", v: newsletterCount },
							].map(({ k, v }) => (
								<div
									key={k}
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: "0.8rem",
									}}
								>
									<span style={{ color: "#71717a" }}>
										{k}
									</span>
									<span
										style={{
											color: "#c4b5fd",
											fontWeight: 600,
										}}
									>
										{loading && k !== "Subscribers"
											? "…"
											: (v ?? 0)}
									</span>
								</div>
							))}
						</div>
					</div>
				</aside>

				{/* Main content */}
				<main style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
					{/* ── Overview Tab ── */}
					{activeTab === "overview" && (
						<div style={{ maxWidth: "900px" }}>
							<div style={{ marginBottom: "2rem" }}>
								<h2
									style={{
										margin: "0 0 0.25rem",
										fontSize: "1.5rem",
										fontWeight: 800,
										color: "#fff",
									}}
								>
									Dashboard Overview
								</h2>
								<p
									style={{
										margin: 0,
										color: "#71717a",
										fontSize: "0.9rem",
									}}
								>
									Your Prophecy Hub at a glance.
								</p>
							</div>

							{/* Stat cards */}
							<div
								style={{
									display: "grid",
									gridTemplateColumns:
										"repeat(auto-fill, minmax(200px, 1fr))",
									gap: "1rem",
									marginBottom: "2.5rem",
								}}
							>
								<StatCard
									label="Total Products"
									value={
										loading
											? "…"
											: (analytics?.totalProducts ?? 0)
									}
									sub="Active listings"
									accent="linear-gradient(90deg, #a855f7, #7c3aed)"
								/>
								<StatCard
									label="Total Views"
									value={
										loading
											? "…"
											: (analytics?.totalViews ?? 0)
									}
									sub="Page impressions"
									accent="linear-gradient(90deg, #3b82f6, #06b6d4)"
								/>
								<StatCard
									label="Total Clicks"
									value={
										loading
											? "…"
											: (analytics?.totalClicks ?? 0)
									}
									sub="Product card clicks"
									accent="linear-gradient(90deg, #f59e0b, #ef4444)"
								/>
								<StatCard
									label="Buy Now Clicks"
									value={
										loading
											? "…"
											: (analytics?.totalBuyNowClicks ?? 0)
									}
									sub="Affiliate link clicks"
									accent="linear-gradient(90deg, #10b981, #3b82f6)"
								/>
							</div>

							{/* Quick actions */}
							<div style={{ marginBottom: "2.5rem" }}>
								<h3
									style={{
										margin: "0 0 1rem",
										fontSize: "1rem",
										fontWeight: 700,
										color: "#fff",
									}}
								>
									Quick Actions
								</h3>
								<div
									style={{
										display: "grid",
										gridTemplateColumns:
											"repeat(auto-fill, minmax(260px, 1fr))",
										gap: "0.75rem",
									}}
								>
									<ActionCard
										label="Manage Products"
										desc="Add, edit, or remove product listings"
										onClick={() =>
											navigate("/admin/products")
										}
										Icon={IcBox}
									/>
									<ActionCard
										label="Manage Banners"
										desc="Upload and configure banner images"
										onClick={() =>
											navigate("/admin/banners")
										}
										Icon={IcImage}
									/>
									<ActionCard
										label="Manage Carousels"
										desc="Create trending product slideshows"
										onClick={() =>
											navigate("/admin/carousels")
										}
										Icon={IcSlides}
									/>
									<ActionCard
										label="Trending Products"
										desc="Choose products shown in Trending sections"
										onClick={() =>
											navigate("/admin/trending")
										}
										Icon={IcTrending}
									/>
								</div>
							</div>

							{/* Products by Category */}
							{analytics?.productsByCategory?.length > 0 && (
								<div
									style={{
										background: "rgba(24,24,27,0.7)",
										border: "1px solid #27272a",
										borderRadius: "14px",
										padding: "1.5rem",
										marginBottom: "1.5rem",
									}}
								>
									<h3
										style={{
											margin: "0 0 1.25rem",
											fontSize: "1rem",
											fontWeight: 700,
											color: "#fff",
										}}
									>
										Products by Category
									</h3>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "0.75rem",
										}}
									>
										{analytics.productsByCategory.map(
											(cat) => {
												const pct = Math.round(
													(cat.count /
														(analytics.totalProducts ||
															1)) *
														100,
												);
												return (
													<div
														key={cat._id}
														style={{
															display: "flex",
															alignItems:
																"center",
															gap: "1rem",
														}}
													>
														<span
															style={{
																width: "120px",
																fontSize:
																	"0.82rem",
																color: "#a1a1aa",
																flexShrink: 0,
																textOverflow:
																	"ellipsis",
																overflow:
																	"hidden",
																whiteSpace:
																	"nowrap",
															}}
														>
															{cat._id}
														</span>
														<div
															style={{
																flex: 1,
																height: "6px",
																background:
																	"#1c1c1f",
																borderRadius:
																	"999px",
																overflow:
																	"hidden",
															}}
														>
															<div
																style={{
																	width: `${pct}%`,
																	height: "100%",
																	borderRadius:
																		"999px",
																	background:
																		"linear-gradient(90deg, #7c3aed, #a855f7)",
																	transition:
																		"width 0.6s ease",
																}}
															/>
														</div>
														<span
															style={{
																width: "36px",
																textAlign:
																	"right",
																fontSize:
																	"0.82rem",
																color: "#c4b5fd",
																fontWeight: 600,
																flexShrink: 0,
															}}
														>
															{cat.count}
														</span>
													</div>
												);
											},
										)}
									</div>
								</div>
							)}

							{/* Products by Anime */}
							{analytics?.productsByAnime?.length > 0 && (
								<div
									style={{
										background: "rgba(24,24,27,0.7)",
										border: "1px solid #27272a",
										borderRadius: "14px",
										padding: "1.5rem",
									}}
								>
									<h3
										style={{
											margin: "0 0 1.25rem",
											fontSize: "1rem",
											fontWeight: 700,
											color: "#fff",
										}}
									>
										Products by Anime
									</h3>
									<div
										style={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fill, minmax(130px,1fr))",
											gap: "0.75rem",
										}}
									>
										{analytics.productsByAnime.map(
											(anime) => (
												<div
													key={anime._id}
													style={{
														background:
															"rgba(9,9,11,0.6)",
														border: "1px solid #27272a",
														borderRadius: "10px",
														padding: "1rem",
														textAlign: "center",
													}}
												>
													<p
														style={{
															margin: "0 0 0.4rem",
															fontWeight: 700,
															fontSize: "0.82rem",
															color: "#c4b5fd",
														}}
													>
														{anime._id}
													</p>
													<p
														style={{
															margin: 0,
															fontSize: "1.5rem",
															fontWeight: 800,
															color: "#fff",
														}}
													>
														{anime.count}
													</p>
												</div>
											),
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{/* ── Landing Image Tab ── */}
					{activeTab === "landingImage" && <LandingImagePanel />}

					{/* ── Newsletters Tab ── */}
					{activeTab === "newsletters" && <NewsletterPanel />}
				</main>
			</div>
		</div>
	);
};

const inputStyle = {
	width: "100%",
	padding: "0.6rem 1rem",
	borderRadius: "8px",
	border: "1px solid #3f3f46",
	background: "#111113",
	color: "#fff",
	fontSize: "0.875rem",
	fontFamily: "inherit",
	outline: "none",
	boxSizing: "border-box",
};

/* ─── Landing Image Panel ─── */
const LandingImagePanel = () => {
	const fileRef = useRef(null);
	const [currentUrl, setCurrentUrl] = useState("");
	const [previewUrl, setPreviewUrl] = useState(null);
	const [file, setFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [msg, setMsg] = useState({ text: "", type: "" });

	useEffect(() => {
		apiClient
			.get("/settings/landing-image")
			.then((r) => setCurrentUrl(r.data?.data?.url || ""))
			.catch(() => {});
	}, []);

	const flash = (text, type = "success") => {
		setMsg({ text, type });
		setTimeout(() => setMsg({ text: "", type: "" }), 3500);
	};

	const handleFile = (e) => {
		const f = e.target.files[0];
		if (!f) return;
		setFile(f);
		setPreviewUrl(URL.createObjectURL(f));
	};

	const handleUpload = async () => {
		if (!file) return;
		setUploading(true);
		try {
			const form = new FormData();
			form.append("image", file);
			const res = await apiClient.put("/settings/landing-image", form);
			setCurrentUrl(res.data?.data?.url || "");
			setFile(null);
			setPreviewUrl(null);
			flash("Landing image updated! Reload the site to see it.");
		} catch (err) {
			flash(err.response?.data?.message || "Upload failed.", "error");
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async () => {
		if (
			!confirm(
				"Remove the hero background image? The site will use the default GIF.",
			)
		)
			return;
		setDeleting(true);
		try {
			await apiClient.delete("/settings/landing-image");
			setCurrentUrl("");
			setFile(null);
			setPreviewUrl(null);
			flash("Image removed. Default GIF will be used.");
		} catch {
			flash("Delete failed.", "error");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div style={{ maxWidth: "640px" }}>
			<div style={{ marginBottom: "2rem" }}>
				<h2
					style={{
						margin: "0 0 0.25rem",
						fontSize: "1.5rem",
						fontWeight: 800,
						color: "#fff",
					}}
				>
					Landing Hero Image
				</h2>
				<p style={{ margin: 0, color: "#71717a", fontSize: "0.9rem" }}>
					Upload the background image shown on the main landing page
					hero section. Replaces the default animated GIF.
				</p>
			</div>

			{msg.text && (
				<div
					style={{
						padding: "0.75rem 1rem",
						borderRadius: "8px",
						marginBottom: "1.25rem",
						background:
							msg.type === "error"
								? "rgba(239,68,68,0.1)"
								: "rgba(34,197,94,0.1)",
						border: `1px solid ${msg.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
						color: msg.type === "error" ? "#fca5a5" : "#86efac",
						fontSize: "0.875rem",
					}}
				>
					{msg.text}
				</div>
			)}

			<div
				style={{
					background: "rgba(24,24,27,0.7)",
					border: "1px solid #27272a",
					borderRadius: "14px",
					padding: "2rem",
					display: "flex",
					flexDirection: "column",
					gap: "1.5rem",
				}}
			>
				{/* Current image */}
				{(previewUrl || currentUrl) && (
					<div>
						<p
							style={{
								margin: "0 0 0.75rem",
								fontSize: "0.78rem",
								color: "#71717a",
								fontWeight: 600,
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							{previewUrl
								? "New Image Preview"
								: "Current Hero Image"}
						</p>
						<div
							style={{
								position: "relative",
								display: "inline-block",
							}}
						>
							<img
								src={previewUrl || currentUrl}
								alt="Hero preview"
								style={{
									width: "100%",
									maxWidth: "560px",
									height: "220px",
									objectFit: "cover",
									borderRadius: "10px",
									border: "1px solid #3f3f46",
									display: "block",
								}}
							/>
							{!previewUrl && currentUrl && (
								<span
									style={{
										position: "absolute",
										top: "8px",
										right: "8px",
										padding: "0.2rem 0.55rem",
										background: "rgba(34,197,94,0.15)",
										border: "1px solid rgba(34,197,94,0.3)",
										borderRadius: "6px",
										fontSize: "0.7rem",
										color: "#86efac",
										fontWeight: 600,
									}}
								>
									Live
								</span>
							)}
						</div>
					</div>
				)}

				{!previewUrl && !currentUrl && (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							padding: "2rem",
							border: "1px dashed #3f3f46",
							borderRadius: "10px",
							gap: "0.5rem",
							color: "#52525b",
						}}
					>
						<IcLandscape />
						<p style={{ margin: 0, fontSize: "0.85rem" }}>
							No hero image set — site uses the default animated
							GIF
						</p>
					</div>
				)}

				{/* File picker */}
				<div>
					<p
						style={{
							margin: "0 0 0.5rem",
							fontSize: "0.78rem",
							fontWeight: 600,
							color: "#a1a1aa",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						{currentUrl ? "Replace Image" : "Upload Image"}
					</p>
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
							padding: "0.75rem 1rem",
							borderRadius: "8px",
							border: "1px dashed #3f3f46",
							cursor: "pointer",
							background: "rgba(9,9,11,0.5)",
							color: "#71717a",
							fontSize: "0.875rem",
						}}
					>
						<IcImage />
						{file
							? file.name
							: "Click to choose image (JPG, PNG, GIF, WebP)"}
						<input
							ref={fileRef}
							type="file"
							accept="image/*"
							onChange={handleFile}
							style={{ display: "none" }}
						/>
					</label>
				</div>

				{/* Actions */}
				<div
					style={{
						display: "flex",
						gap: "0.75rem",
						flexWrap: "wrap",
					}}
				>
					<button
						onClick={handleUpload}
						disabled={!file || uploading}
						style={{
							padding: "0.6rem 1.5rem",
							borderRadius: "8px",
							border: "none",
							background:
								!file || uploading ? "#3f3f46" : "#7c3aed",
							color: "#fff",
							fontWeight: 600,
							fontSize: "0.875rem",
							cursor:
								!file || uploading ? "not-allowed" : "pointer",
							fontFamily: "inherit",
						}}
					>
						{uploading ? "Uploading…" : "Upload & Save"}
					</button>
					{currentUrl && (
						<button
							onClick={handleDelete}
							disabled={deleting}
							style={{
								padding: "0.6rem 1.5rem",
								borderRadius: "8px",
								border: "1px solid rgba(239,68,68,0.4)",
								background: "rgba(239,68,68,0.08)",
								color: "#fca5a5",
								fontWeight: 600,
								fontSize: "0.875rem",
								cursor: deleting ? "not-allowed" : "pointer",
								fontFamily: "inherit",
							}}
						>
							{deleting ? "Removing…" : "Remove Image"}
						</button>
					)}
					{file && (
						<button
							onClick={() => {
								setFile(null);
								setPreviewUrl(null);
								if (fileRef.current) fileRef.current.value = "";
							}}
							style={{
								padding: "0.6rem 1rem",
								borderRadius: "8px",
								border: "1px solid #3f3f46",
								background: "transparent",
								color: "#a1a1aa",
								fontSize: "0.875rem",
								cursor: "pointer",
								fontFamily: "inherit",
							}}
						>
							Clear
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
