/**
 * Flatten items from all active carousels (product-picker + manual items).
 */
export const flattenCarouselItems = (carousels = []) =>
	carousels.flatMap((c) =>
		Array.isArray(c.items) && c.items.length > 0 ? c.items : [],
	);
