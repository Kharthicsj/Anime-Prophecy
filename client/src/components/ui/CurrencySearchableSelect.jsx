import React, { useState, useEffect, useRef } from "react";

const CurrencySearchableSelect = ({ currencies, value, onChange, name }) => {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);
	const searchRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				setOpen(false);
				setSearch("");
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (open && searchRef.current) searchRef.current.focus();
	}, [open]);

	const filtered = currencies.filter(c =>
		c.code.toLowerCase().includes(search.toLowerCase()) ||
		c.name.toLowerCase().includes(search.toLowerCase()) ||
		c.symbol.toLowerCase().includes(search.toLowerCase())
	);

	const selected = currencies.find(c => c.code === value);

	const handleSelect = (code) => {
		onChange({ target: { name, value: code } });
		setOpen(false);
		setSearch("");
	};

	return (
		<div ref={wrapperRef} className="relative">
			{/* Trigger */}
			<div
				className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white cursor-pointer flex justify-between items-center hover:border-zinc-500 focus-within:ring-2 focus-within:ring-purple-500 transition-colors"
				onClick={() => setOpen(o => !o)}
				tabIndex={0}
				onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
			>
				{selected ? (
					<span className="flex items-center gap-2">
						<span className="text-purple-300 font-bold text-base w-6 text-center">{selected.symbol}</span>
						<span className="font-semibold">{selected.code}</span>
						<span className="text-zinc-400 text-xs truncate hidden sm:inline">— {selected.name}</span>
					</span>
				) : (
					<span className="text-zinc-400">Select Currency</span>
				)}
				<span className={`text-zinc-400 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
			</div>

			{/* Dropdown */}
			{open && (
				<div className="absolute z-[200] w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
					{/* Search */}
					<div className="p-2 border-b border-zinc-800 bg-zinc-900 sticky top-0">
						<div className="relative">
							<svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								ref={searchRef}
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg border border-zinc-700 focus:outline-none focus:border-purple-500 placeholder-zinc-500"
								placeholder="Search by code, name or symbol…"
							/>
						</div>
					</div>
					{/* Options list */}
					<div className="max-h-56 overflow-y-auto">
						{filtered.length > 0 ? filtered.map(c => (
							<div
								key={c.code}
								className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-sm ${value === c.code ? "bg-purple-600/20 text-purple-300" : "hover:bg-zinc-800 text-zinc-200"}`}
								onClick={() => handleSelect(c.code)}
							>
								<span className="text-base w-6 text-center font-bold text-purple-400 flex-shrink-0">{c.symbol}</span>
								<span className="font-semibold w-12 flex-shrink-0">{c.code}</span>
								<span className="text-zinc-400 text-xs truncate">{c.name}</span>
								{value === c.code && <span className="ml-auto text-purple-400 text-xs">✓</span>}
							</div>
						)) : (
							<div className="px-4 py-4 text-sm text-zinc-500 text-center">No currencies found</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
export default CurrencySearchableSelect;
