import { useState, useRef, useEffect } from "react";

const SearchableSelect = ({ options, value, onChange, name, placeholder = "Select an option", upwards = false, multiple = false }) => {
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
		if (multiple) {
			const currentValues = Array.isArray(value) ? value : [];
			const newValues = currentValues.includes(option)
				? currentValues.filter(v => v !== option)
				: [...currentValues, option];
			onChange({ target: { name, value: newValues } });
		} else {
			onChange({ target: { name, value: option } });
			setOpen(false);
			setSearch("");
		}
	};

	const handleRemove = (e, optionToRemove) => {
		e.stopPropagation();
		if (multiple && Array.isArray(value)) {
			const newValues = value.filter(v => v !== optionToRemove);
			onChange({ target: { name, value: newValues } });
		}
	};

	return (
		<div ref={wrapperRef} className="relative">
			<div
				className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white cursor-pointer flex justify-between items-center focus-within:ring-2 focus-within:ring-purple-500 min-h-[44px]"
				onClick={() => setOpen(!open)}
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setOpen(!open);
					}
				}}
			>
				<div className="flex flex-wrap gap-1 items-center flex-1 pr-2">
					{multiple ? (
						Array.isArray(value) && value.length > 0 ? (
							value.map(val => (
								<span key={val} className="bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-purple-500/30">
									{val}
									<span
										onClick={(e) => handleRemove(e, val)}
										className="hover:text-white cursor-pointer rounded-full bg-purple-500/20 w-4 h-4 flex items-center justify-center font-bold"
									>
										×
									</span>
								</span>
							))
						) : (
							<span className="text-zinc-400">{placeholder}</span>
						)
					) : (
						<span className={value ? "text-white" : "text-zinc-400"}>
							{value || placeholder}
						</span>
					)}
				</div>
				<span className="text-zinc-400 ml-2">▾</span>
			</div>

			{open && (
				<div className={`absolute z-[200] w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden ${upwards ? "bottom-full mb-1" : "top-full mt-1"}`}>
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
							filteredOptions.map((o) => {
								const isSelected = multiple ? Array.isArray(value) && value.includes(o) : value === o;
								return (
									<div
										key={o}
										className={`px-4 py-2 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? "bg-purple-600/20 text-purple-300" : "hover:bg-zinc-700 text-zinc-200"}`}
										onClick={() => handleSelect(o)}
									>
										<span>{o}</span>
										{isSelected && <span className="text-purple-400 text-sm">✓</span>}
									</div>
								);
							})
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
