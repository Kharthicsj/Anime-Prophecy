/**
 * Primary Call-to-Action Button Component
 * Tailwind CSS: Dark theme with purple accent
 */
const Button = ({
	children,
	onClick,
	variant = "primary",
	size = "md",
	disabled = false,
	className = "",
	type = "button",
	...props
}) => {
	const baseStyles =
		"font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

	const variants = {
		primary:
			"bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500",
		secondary:
			"bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 focus:ring-zinc-600",
		danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
		outline:
			"border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 focus:ring-purple-500",
	};

	const sizes = {
		sm: "px-3 py-1.5 text-sm",
		md: "px-4 py-2.5 text-base",
		lg: "px-6 py-3 text-lg",
		xl: "px-8 py-4 text-xl",
	};

	const disabledStyles = disabled
		? "opacity-50 cursor-not-allowed"
		: "cursor-pointer";

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};

export default Button;
