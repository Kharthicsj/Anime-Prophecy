import { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiX } from "react-icons/fi";

/**
 * Advanced SearchHeader with:
 * - 350ms debounce (avoids hammering the API on every keystroke)
 * - Clear button
 * - Recent searches stored in localStorage
 * - Keyboard shortcut: Escape clears, Enter submits immediately
 */
const SearchHeader = ({ onSearch = () => {} }) => {
	const [focused, setFocused] = useState(false);
	const [value, setValue] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [recentSearches, setRecentSearches] = useState([]);
	const debounceRef = useRef(null);
	const inputRef = useRef(null);

	// Load recent searches from localStorage
	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem("phub_recent_searches") || "[]");
			setRecentSearches(Array.isArray(saved) ? saved.slice(0, 5) : []);
		} catch (_) {}
	}, []);

	const saveRecentSearch = useCallback((query) => {
		if (!query.trim()) return;
		try {
			const prev = JSON.parse(localStorage.getItem("phub_recent_searches") || "[]");
			const updated = [query.trim(), ...prev.filter((q) => q !== query.trim())].slice(0, 5);
			localStorage.setItem("phub_recent_searches", JSON.stringify(updated));
			setRecentSearches(updated);
		} catch (_) {}
	}, []);

	const fireSearch = useCallback(
		(query) => {
			onSearch(query);
			if (query.trim()) saveRecentSearch(query.trim());
		},
		[onSearch, saveRecentSearch],
	);

	const handleChange = (e) => {
		const q = e.target.value;
		setValue(q);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Escape") {
			setValue("");
			fireSearch("");
			setShowSuggestions(false);
			inputRef.current?.blur();
		}
		if (e.key === "Enter") {
			fireSearch(value);
			setShowSuggestions(false);
			inputRef.current?.blur();
		}
	};

	const handleClear = () => {
		setValue("");
		fireSearch("");
		inputRef.current?.focus();
	};

	const removeRecentSearch = useCallback((e, query) => {
		e.stopPropagation();
		e.preventDefault();
		try {
			const prev = JSON.parse(localStorage.getItem("phub_recent_searches") || "[]");
			const updated = prev.filter((q) => q !== query);
			localStorage.setItem("phub_recent_searches", JSON.stringify(updated));
			setRecentSearches(updated);
		} catch (_) {}
	}, []);

	const clearAllRecentSearches = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		localStorage.setItem("phub_recent_searches", JSON.stringify([]));
		setRecentSearches([]);
	}, []);

	const handleRecentClick = (query) => {
		setValue(query);
		fireSearch(query);
		setShowSuggestions(false);
	};

	const handleFocus = () => {
		setFocused(true);
		if (recentSearches.length > 0) setShowSuggestions(true);
	};

	const handleBlur = () => {
		setFocused(false);
		// Delay so click on suggestion registers
		setTimeout(() => setShowSuggestions(false), 150);
	};

	return (
		<div
			style={{
				position: "relative",
				display: "flex",
				alignItems: "center",
				width: "100%",
				maxWidth: "440px",
			}}
			className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
		>
			{/* Search icon */}
			<FiSearch
				size={15}
				onClick={() => fireSearch(value)}
				style={{
					position: "absolute",
					left: "12px",
					color: focused ? "#a855f7" : "#71717a",
					transition: "color 0.2s",
					pointerEvents: "auto",
					cursor: "pointer",
					flexShrink: 0,
					zIndex: 1,
				}}
			/>

			<input
				ref={inputRef}
				type="text"
				value={value}
				placeholder="Search anime, merch, store…"
				onChange={handleChange}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				style={{
					width: "100%",
					height: "36px",
					padding: value ? "0 34px 0 34px" : "0 12px 0 34px",
					borderRadius: "10px",
					border: focused
						? "1px solid rgba(168,85,247,0.7)"
						: "1px solid rgba(255,255,255,0.18)",
					background: focused
						? "rgba(9,9,11,0.95)"
						: "rgba(24,24,27,0.8)",
					color: "#fff",
					fontSize: "0.82rem",
					outline: "none",
					transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
					boxShadow: focused
						? "0 0 0 3px rgba(168,85,247,0.15)"
						: "none",
					fontFamily: "inherit",
				}}
			/>

			{/* Clear button */}
			{value && (
				<button
					onClick={handleClear}
					style={{
						position: "absolute",
						right: "10px",
						background: "none",
						border: "none",
						color: "#71717a",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						padding: 0,
					}}
					aria-label="Clear search"
				>
					<FiX size={14} />
				</button>
			)}

			{/* Recent searches dropdown */}
			{showSuggestions && recentSearches.length > 0 && !value && (
				<div
					style={{
						position: "absolute",
						top: "calc(100% + 6px)",
						left: 0,
						right: 0,
						background: "rgba(18,18,20,0.98)",
						border: "1px solid rgba(168,85,247,0.25)",
						borderRadius: "10px",
						boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
						zIndex: 100,
						overflow: "hidden",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "6px 12px",
							borderBottom: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						<p
							style={{
								margin: 0,
								fontSize: "0.68rem",
								color: "#71717a",
								letterSpacing: "0.1em",
								textTransform: "uppercase",
							}}
						>
							Recent Searches
						</p>
						<button
							onMouseDown={clearAllRecentSearches}
							style={{
								margin: 0,
								padding: 0,
								background: "none",
								border: "none",
								fontSize: "0.68rem",
								color: "#a855f7",
								cursor: "pointer",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							Clear All
						</button>
					</div>
					{recentSearches.map((q) => (
						<div
							key={q}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								width: "100%",
								padding: "8px 12px",
								transition: "background 0.15s",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.background = "rgba(168,85,247,0.1)")
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.background = "none")
							}
						>
							<button
								onMouseDown={() => handleRecentClick(q)}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									background: "none",
									border: "none",
									color: "#d4d4d8",
									fontSize: "0.82rem",
									cursor: "pointer",
									fontFamily: "inherit",
									textAlign: "left",
									flex: 1,
								}}
							>
								<FiSearch size={12} style={{ color: "#71717a", flexShrink: 0 }} />
								{q}
							</button>
							<button
								onMouseDown={(e) => removeRecentSearch(e, q)}
								style={{
									background: "none",
									border: "none",
									color: "#71717a",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									padding: "4px",
								}}
								aria-label="Remove search"
							>
								<FiX size={12} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default SearchHeader;
