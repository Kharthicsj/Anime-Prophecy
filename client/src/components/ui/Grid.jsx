/**
 * Grid Component - Responsive product grid layout
 */
const Grid = ({
	items,
	renderItem,
	columns = { sm: 1, md: 2, lg: 3, xl: 4 },
	gap = "gap-6",
	className = "",
}) => {
	return (
		<div
			className={`
        grid
        grid-cols-${columns.sm}
        md:grid-cols-${columns.md}
        lg:grid-cols-${columns.lg}
        xl:grid-cols-${columns.xl}
        ${gap}
        ${className}
      `}
		>
			{items.map((item, index) => (
				<div key={index}>{renderItem(item, index)}</div>
			))}
		</div>
	);
};

export default Grid;
