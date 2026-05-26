/**
 * Flatten items from all active carousels (product-picker + manual items).
 * Preserves productId and country fields so ProductCarousel can:
 *  - navigate to /product/:id instead of opening the affiliate link
 *  - display the country tag badge on each slide
 */
export const flattenCarouselItems = (carousels = []) =>
	carousels.flatMap((carousel) => {
		if (!Array.isArray(carousel.items) || carousel.items.length === 0) return [];
		// Attach the carousel's target country to each item so slides can show it
		const carouselCountry = carousel.country || carousel.targetCountry || null;
		return carousel.items.map((item) => ({
			...item,
			// Preserve the product's actual countries array, or fallback
			countries: item.countries || [],
			country: item.country || carouselCountry || null,
		}));
	});
