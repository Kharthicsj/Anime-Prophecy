import loadingGif from "../../assets/loading.gif";

const SIZES = {
	sm: { gif: 72, gap: "0.75rem", title: "0.85rem", sub: "0.72rem" },
	md: { gif: 120, gap: "1rem", title: "0.95rem", sub: "0.78rem" },
	lg: { gif: 220, gap: "1.5rem", title: "1.1rem", sub: "0.82rem" },
};

/**
 * Loading UI using loading.gif — fullscreen, modal overlay, or inline.
 *
 * @param {'fullscreen'|'overlay'|'inline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {string} message — primary status line
 * @param {string} [submessage]
 */
const LoadingAnimation = ({
	variant = "fullscreen",
	size = "lg",
	message = "Loading your anime adventure…",
	submessage = "Prophecy Hub",
	className = "",
}) => {
	const s = SIZES[size] || SIZES.lg;

	const content = (
		<>
			<img
				src={loadingGif}
				alt="Loading…"
				style={{
					width: s.gif,
					height: s.gif,
					objectFit: "contain",
					borderRadius: size === "lg" ? 16 : 10,
				}}
			/>
			<div style={{ textAlign: "center" }}>
				{submessage && variant === "fullscreen" && (
					<p
						style={{
							margin: "0 0 0.35rem",
							fontSize: s.title,
							fontWeight: 700,
							color: variant === "overlay" ? "#fff" : "#fff",
							letterSpacing: "0.04em",
						}}
					>
						{submessage}
					</p>
				)}
				<p
					style={{
						margin: 0,
						fontSize: s.sub,
						color: variant === "overlay" ? "#a1a1aa" : "#71717a",
					}}
				>
					{message}
				</p>
			</div>
			<div style={{ display: "flex", gap: "8px" }}>
				{[0, 1, 2].map((i) => (
					<span
						key={i}
						className="loading-dot-bounce"
						style={{
							width: size === "sm" ? 6 : 8,
							height: size === "sm" ? 6 : 8,
							borderRadius: "50%",
							background: "#a855f7",
							display: "inline-block",
							animation: "dotBounce 1.2s ease-in-out infinite",
							animationDelay: `${i * 0.2}s`,
						}}
					/>
				))}
			</div>
			<style>{`
				@keyframes dotBounce {
					0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
					40%           { transform: translateY(-10px); opacity: 1; }
				}
			`}</style>
		</>
	);

	if (variant === "fullscreen") {
		return (
			<div
				className={className}
				style={{
					position: "fixed",
					inset: 0,
					zIndex: 9999,
					background: "#000",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: s.gap,
					fontFamily: "Inter, system-ui, sans-serif",
				}}
			>
				{content}
			</div>
		);
	}

	if (variant === "overlay") {
		return (
			<div
				className={className}
				role="status"
				aria-live="polite"
				aria-busy="true"
				style={{
					position: "absolute",
					inset: 0,
					zIndex: 20,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: s.gap,
					background: "rgba(9, 9, 11, 0.88)",
					backdropFilter: "blur(4px)",
					fontFamily: "Inter, system-ui, sans-serif",
				}}
			>
				{content}
			</div>
		);
	}

	return (
		<div
			className={className}
			role="status"
			aria-live="polite"
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: s.gap,
				padding: "2rem 1rem",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			{content}
		</div>
	);
};

export default LoadingAnimation;
