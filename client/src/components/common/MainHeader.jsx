import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mainLogo from "../../assets/main_logo.jpeg";
import { getCountryByValue } from "../../utils/countries";
import CountryFlag from "./CountryFlag";
import SearchHeader from "./SearchHeader";
import { FaUserShield } from "react-icons/fa";
import { FiMap } from "react-icons/fi";
import { useAppContext } from "../../hooks/useAppContext";

const hdrBtn = (primary, mobile = false) => ({
	display: "flex",
	alignItems: "center",
	gap: "0.4rem",
	padding: mobile ? "0.6rem 0.85rem" : "0.4rem 0.85rem",
	width: mobile ? "100%" : "auto",
	justifyContent: mobile ? "center" : "flex-start",
	borderRadius: "8px",
	border: primary ? "none" : "1px solid #3f3f46",
	background: primary ? "#7c3aed" : "transparent",
	color: primary ? "#fff" : "#a1a1aa",
	fontSize: "0.8rem",
	fontWeight: primary ? 600 : 400,
	cursor: "pointer",
	whiteSpace: "nowrap",
	transition: "background 0.2s, border-color 0.2s, color 0.2s",
	fontFamily: "inherit",
});

const MainHeader = ({ onSearch, hideSearch = false }) => {
	const navigate = useNavigate();
	const { selectedCountry } = useAppContext();
	const activeCountry = getCountryByValue(selectedCountry);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleSearch = (searchQuery) => {
		if (onSearch) {
			onSearch(searchQuery);
		} else {
			// If no specific handler, navigate to homepage with search param
			navigate(`/?search=${encodeURIComponent(searchQuery)}`);
		}
	};

	return (
		<header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
			{/* Desktop Header */}
			<div className="mx-auto hidden h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:flex">
				{/* Logo */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.6rem",
						flexShrink: 0,
						cursor: "pointer",
					}}
					onClick={() => navigate("/")}
				>
					<img src={mainLogo} alt="Prophecy Hub" style={{ width:"36px", height:"36px", borderRadius:"9px", objectFit:"cover", border:"1px solid rgba(168,85,247,0.35)", flexShrink:0 }} />
					<div style={{ display:"flex", flexDirection:"column", lineHeight:1.15 }}>
						<span style={{ fontWeight:800, fontSize:"0.95rem", color:"#fff", whiteSpace:"nowrap" }}>Prophecy Hub</span>
						<span style={{ fontSize:"0.55rem", color:"#a855f7", letterSpacing:"0.12em", textTransform:"uppercase" }}>Anime Merchandise Hub</span>
					</div>
				</div>

				{/* Country pill */}
				<div className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-700 bg-purple-500/10 px-3 py-1">
					<CountryFlag
						value={activeCountry?.value || 'Worldwide'}
						size="sm"
						mode="image"
					/>
					<span className="text-xs font-semibold text-violet-300 sm:text-[0.8rem]">
						{activeCountry?.label || 'Worldwide'}
					</span>
					<span className="hidden text-[0.7rem] text-zinc-600 lg:inline">
						·
					</span>
					<span className="hidden text-xs text-zinc-500 lg:inline">
						{activeCountry?.currency || 'USD'}
					</span>
				</div>

				{/* Search */}
				<div className="flex min-w-0 flex-1 justify-center px-1">
					{!hideSearch && <SearchHeader onSearch={handleSearch} />}
				</div>

				{/* Buttons */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						flexShrink: 0,
					}}
				>
					<button
						onClick={() => navigate("/")}
						style={hdrBtn(false)}
					>
						<FiMap size={13} />
						<span className="hidden lg:inline">Switch Region</span>
						<span className="lg:hidden">Regions</span>
					</button>
				</div>
			</div>

			{/* Mobile Header */}
			<div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 md:hidden">
				{/* Mobile Logo */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						cursor: "pointer",
					}}
					onClick={() => navigate("/")}
				>
					<img src={mainLogo} alt="Prophecy Hub" style={{ width:"28px", height:"28px", borderRadius:"6px", objectFit:"cover", border:"1px solid rgba(168,85,247,0.3)", flexShrink:0 }} />
					<span style={{ fontWeight:700, fontSize:"0.85rem", color:"#fff" }}>Prophecy Hub</span>
				</div>

				{/* Mobile Country Pill */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.3rem",
						padding: "0.25rem 0.5rem",
						borderRadius: "999px",
						border: "1px solid #3f3f46",
						background: "rgba(168,85,247,0.08)",
					}}
				>
					<CountryFlag
						value={activeCountry?.value || 'Worldwide'}
						size="xs"
						mode="image"
					/>
					<span
						style={{
							fontSize: "0.7rem",
							color: "#c4b5fd",
							fontWeight: 600,
						}}
					>
						{activeCountry?.label || 'Worldwide'}
					</span>
				</div>

				{/* Mobile Menu Toggle */}
				<button
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "36px",
						height: "36px",
						borderRadius: "6px",
						border: "1px solid #3f3f46",
						background: "transparent",
						color: "#a1a1aa",
						cursor: "pointer",
						padding: 0,
					}}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						{mobileMenuOpen ? (
							<path d="M6 18L18 6M6 6l12 12" />
						) : (
							<path d="M4 6h16M4 12h16M4 18h16" />
						)}
					</svg>
				</button>
			</div>

			{/* Mobile Expanded Menu */}
			{mobileMenuOpen && (
				<div className="border-t border-zinc-800 bg-zinc-950 p-4 md:hidden">
					{!hideSearch && (
						<div className="mb-4">
							<SearchHeader onSearch={handleSearch} />
						</div>
					)}
					<div className="flex flex-col gap-2">
						<button
							onClick={() => {
								navigate("/");
								setMobileMenuOpen(false);
							}}
							style={hdrBtn(false, true)}
						>
							<FiMap size={13} /> Switch Region
						</button>
					</div>
				</div>
			)}
		</header>
	);
};

export default MainHeader;
