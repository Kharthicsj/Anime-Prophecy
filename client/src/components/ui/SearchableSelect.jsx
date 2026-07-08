import { useState, useRef, useEffect } from "react";

const SearchableSelect = ({ options, value, onChange, name, placeholder = "Select an option", upwards = false }) => {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

	const handleSelect = (option) => {
		onChange({ target: { name, value: option } });
		setOpen(false);
		setSearch("");
	};

	return (
		<div ref={wrapperRef} className="relative">
			<div
				className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white cursor-pointer flex justify-between items-center focus-within:ring-2 focus-within:ring-purple-500"
				onClick={() => setOpen(!open)}
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setOpen(!open);
					}
				}}
			>
				<span className={value ? "text-white" : "text-zinc-400"}>
					{value || placeholder}
				</span>
				<span className="text-zinc-400 ml-2">▾</span>
			</div>

			{open && (
				<div className={`absolute z-50 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden ${upwards ? "bottom-full mb-1" : "top-full mt-1"}`}>
					<div className="p-2 border-b border-zinc-700">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full px-3 py-1.5 bg-zinc-900 text-white rounded border border-zinc-700 focus:outline-none focus:border-purple-500"
							placeholder="Search..."
							autoFocus
						/>
					</div>
					<div className="max-h-60 overflow-y-auto">
						{filteredOptions.length > 0 ? (
							filteredOptions.map((o) => (
								<div
									key={o}
									className={`px-4 py-2 cursor-pointer transition-colors ${value === o ? "bg-purple-600/30 text-purple-300" : "hover:bg-zinc-700 text-zinc-200"}`}
									onClick={() => handleSelect(o)}
								>
									{o}
								</div>
							))
						) : (
							<div className="px-4 py-3 text-sm text-zinc-500 text-center">
								No results found
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default SearchableSelect;
