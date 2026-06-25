import {
	TOOLTIP_BG,
	TOOLTIP_BORDER,
	TOOLTIP_LABEL,
	TOOLTIP_VALUE,
} from "./chartTheme";

const ChartTooltip = ({ active, payload, valueLabel }) => {
	if (!active || !payload?.length) return null;
	const { name, value, fullTitle } = payload[0].payload;
	return (
		<div
			className="rounded-lg px-3 py-2 shadow-xl"
			style={{
				background: TOOLTIP_BG,
				border: `1px solid ${TOOLTIP_BORDER}`,
			}}
		>
			<p
				className="max-w-[220px] truncate text-xs font-medium"
				style={{ color: TOOLTIP_LABEL }}
			>
				{fullTitle || name}
			</p>
			<p className="text-sm font-semibold" style={{ color: TOOLTIP_VALUE }}>
				{typeof value === "number" ? value.toLocaleString() : value}
				{valueLabel && (
					<span className="font-normal" style={{ color: TOOLTIP_LABEL }}>
						{" "}
						{valueLabel}
					</span>
				)}
			</p>
		</div>
	);
};

export default ChartTooltip;
