/**
 * Input Component - Reusable form input with validation styling
 * Tailwind CSS: Dark theme optimized
 */
const Input = ({
	label,
	type = "text",
	placeholder = "",
	value,
	onChange,
	error = "",
	disabled = false,
	required = false,
	className = "",
	...props
}) => {
	return (
		<div className="w-full">
			{label && (
				<label className="block text-sm font-medium text-zinc-200 mb-2">
					{label}{" "}
					{required && <span className="text-red-500">*</span>}
				</label>
			)}
			<input
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				disabled={disabled}
				className={`
          w-full px-4 py-2.5 rounded-lg
          bg-zinc-900 border border-zinc-800
          text-white placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-300
          ${error ? "border-red-500 focus:ring-red-500" : ""}
          ${className}
        `}
				{...props}
			/>
			{error && <p className="text-red-500 text-xs mt-1">{error}</p>}
		</div>
	);
};

export default Input;
