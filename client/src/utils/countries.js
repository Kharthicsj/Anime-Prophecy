export const countries = [
    {
        value: "Japan",
        slug: "japan",
        label: "Japan",
        currency: "JPY",
        isoCode: "JP",
        description: "Premium drops inspired by the home of anime culture.",
    },
    {
        value: "US",
        slug: "united-states",
        label: "United States",
        currency: "USD",
        isoCode: "US",
        description: "Fast-moving releases and popular anime collaborations.",
    },
    {
        value: "India",
        slug: "india",
        label: "India",
        currency: "INR",
        isoCode: "IN",
        description: "Local pricing and broad access to fan-favorite merch.",
    },
    {
        value: "UK",
        slug: "united-kingdom",
        label: "United Kingdom",
        currency: "GBP",
        isoCode: "GB",
        description: "Curated collections with a clean storefront feel.",
    },
    {
        value: "South Korea",
        slug: "south-korea",
        label: "South Korea",
        currency: "KRW",
        isoCode: "KR",
        description: "Streetwear-led anime pieces with a sharp visual edge.",
    },
    {
        value: "Worldwide",
        slug: "worldwide",
        label: "Worldwide",
        currency: "Multiple",
        isoCode: "ALL",
        description: "Browse the full global catalog with regional coverage.",
    },
];

const countryAliases = new Map([
    ["us", "US"],
    ["united states", "US"],
    ["japan", "Japan"],
    ["jp", "Japan"],
    ["uk", "UK"],
    ["united kingdom", "UK"],
    ["south korea", "South Korea"],
    ["korea", "South Korea"],
    ["kr", "South Korea"],
    ["india", "India"],
    ["in", "India"],
    ["worldwide", "Worldwide"],
    ["global", "Worldwide"],
]);

export const getCountryByValue = (value) =>
    countries.find((country) => country.value === value) || countries[0];

export const getCountryBySlug = (slug) =>
    countries.find((country) => country.slug === slug) || null;

export const normalizeCountryValue = (value) => {
    if (!value) return "US";
    const normalizedValue = value.toString().toLowerCase();
    if (countryAliases.has(normalizedValue)) {
        return countryAliases.get(normalizedValue);
    }
    if (countries.some((country) => country.value === value)) {
        return value;
    }
    const slugMatch = getCountryBySlug(normalizedValue);
    return slugMatch?.value || "US";
};

export const getCountrySlug = (value) => getCountryByValue(value).slug;
export const getCountryLabel = (value) => getCountryByValue(value).label;

/**
 * Returns the ISO code used by the Banner/Carousel backend enum.
 * e.g. "Japan" → "JP", "UK" → "GB", "India" → "IN", "US" → "US"
 */
export const getCountryISOCode = (value) => getCountryByValue(value).isoCode || "ALL";
