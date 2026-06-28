import { useMemo } from "react";
import {
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { ChevronLeft, MousePointerClick } from "lucide-react";
import ChartTooltip from "./ChartTooltip";
import {
	CHART_COLORS,
	CHART_GRID,
	CHART_AXIS,
	CHART_AXIS_LINE,
	CHART_CURSOR,
	PIE_STROKE,
	BRAND_PURPLE,
} from "./chartTheme";

const DrillDownChart = ({
	title,
	subtitle,
	breadcrumbs,
	data,
	onSegmentClick,
	onBack,
	canDrill,
	chartType = "bar",
	valueLabel = "products",
	totalLabel = "Total",
	showTotal = true,
	getSegmentColor,
}) => {
	const hasData = data.length > 0;
	const isHorizontal = chartType === "horizontal-bar";

	const total = useMemo(
		() => data.reduce((sum, d) => sum + (d.value || 0), 0),
		[data],
	);

	const barChart = (
		<ResponsiveContainer
			width="100%"
			height={isHorizontal ? Math.max(260, data.length * 34 + 20) : 260}
		>
			<BarChart
				data={data}
				layout={isHorizontal ? "vertical" : "horizontal"}
				margin={
					isHorizontal
						? { top: 4, right: 16, left: 0, bottom: 4 }
						: { top: 4, right: 8, left: 0, bottom: data.length > 5 ? 8 : 0 }
				}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke={CHART_GRID}
					vertical={!isHorizontal}
					horizontal={isHorizontal}
				/>
				{isHorizontal ? (
					<>
						<XAxis type="number" hide />
						<YAxis
							type="category"
							dataKey="name"
							width={128}
							tick={{ fill: CHART_AXIS, fontSize: 10 }}
							axisLine={false}
							tickLine={false}
						/>
					</>
				) : (
					<>
						<XAxis
							dataKey="name"
							tick={{ fill: CHART_AXIS, fontSize: 11 }}
							axisLine={{ stroke: CHART_AXIS_LINE }}
							tickLine={false}
							interval={0}
							angle={data.length > 5 ? -22 : 0}
							textAnchor={data.length > 5 ? "end" : "middle"}
							height={data.length > 5 ? 52 : 28}
						/>
						<YAxis
							allowDecimals={false}
							tick={{ fill: CHART_AXIS, fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							width={36}
						/>
					</>
				)}
				<Tooltip
					content={<ChartTooltip valueLabel={valueLabel} />}
					cursor={{ fill: CHART_CURSOR }}
				/>
				<Bar
					dataKey="value"
					radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
					maxBarSize={isHorizontal ? 16 : 44}
					className={canDrill ? "cursor-pointer" : ""}
					onClick={(entry) => {
						if (canDrill && entry?.name) onSegmentClick(entry.name);
					}}
				>
					{data.map((entry, i) => (
						<Cell
							key={`cell-${i}`}
							fill={(getSegmentColor && getSegmentColor(entry.name, i)) || CHART_COLORS[i % CHART_COLORS.length]}
							className="transition-opacity duration-200 hover:opacity-75"
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);

	const pieChart = (
		<ResponsiveContainer width="100%" height={260}>
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius={52}
					outerRadius={88}
					paddingAngle={2}
					stroke={PIE_STROKE}
					strokeWidth={2}
					className={canDrill ? "cursor-pointer" : ""}
					onClick={(_, index) => {
						if (canDrill && data[index]?.name)
							onSegmentClick(data[index].name);
					}}
				>
					{data.map((entry, i) => (
						<Cell
							key={`slice-${i}`}
							fill={(getSegmentColor && getSegmentColor(entry.name, i)) || CHART_COLORS[i % CHART_COLORS.length]}
							className="transition-opacity duration-200 hover:opacity-75"
						/>
					))}
				</Pie>
				<Tooltip content={<ChartTooltip valueLabel={valueLabel} />} />
			</PieChart>
		</ResponsiveContainer>
	);

	return (
		<div className="flex h-full min-h-[380px] flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
			{/* Header row */}
			<div className="mb-3 flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
					{subtitle && (
						<p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
							{subtitle}
						</p>
					)}
				</div>

				<div className="flex shrink-0 items-start gap-2">
					{showTotal && hasData && (
						<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-1.5 text-right">
							<p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
								{totalLabel}
							</p>
							<p className="text-base font-bold tabular-nums text-zinc-200">
								{total.toLocaleString()}
							</p>
						</div>
					)}
					{breadcrumbs.length > 1 && (
						<button
							type="button"
							onClick={onBack}
							className="flex items-center gap-1 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
						>
							<ChevronLeft className="h-3.5 w-3.5" />
							Back
						</button>
					)}
				</div>
			</div>

			{/* Breadcrumbs */}
			{breadcrumbs.length > 0 && (
				<div className="mb-3 flex flex-wrap items-center gap-1 border-b border-zinc-800/60 pb-3 text-xs">
					{breadcrumbs.map((crumb, i) => (
						<span key={`${crumb}-${i}`} className="flex items-center gap-1">
							{i > 0 && <span className="text-zinc-700">›</span>}
							<span
								className={
									i === breadcrumbs.length - 1
										? "font-medium"
										: "text-zinc-500"
								}
								style={
									i === breadcrumbs.length - 1
										? { color: BRAND_PURPLE }
										: undefined
								}
							>
								{crumb}
							</span>
						</span>
					))}
				</div>
			)}

			{/* Chart area */}
			<div
				className={`flex flex-1 items-center transition-opacity duration-300 ${hasData ? "opacity-100" : "opacity-40"}`}
			>
				<div className="w-full">
					{hasData ? (
						chartType === "pie" ? pieChart : barChart
					) : (
						<div className="flex h-[260px] items-center justify-center text-sm text-zinc-500">
							No data at this level
						</div>
					)}
				</div>
			</div>

			{canDrill && hasData && (
				<p className="mt-2 flex items-center gap-1.5 border-t border-zinc-800/40 pt-2.5 text-[11px] text-zinc-600">
					<MousePointerClick className="h-3 w-3 shrink-0" />
					Click a segment to drill deeper
				</p>
			)}

			{/* Custom Legend */}
			{hasData && (
				<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] justify-center pt-3 border-t border-zinc-800/40">
					{data.map((d, i) => {
						const color = (getSegmentColor && getSegmentColor(d.name, i)) || CHART_COLORS[i % CHART_COLORS.length];
						return (
							<div key={`legend-${i}`} className="flex items-center gap-1.5">
								<span 
									className="w-2.5 h-2.5 rounded-sm inline-block shadow-sm" 
									style={{ backgroundColor: color }}
								/>
								<span className="text-zinc-400">{d.name}</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default DrillDownChart;
