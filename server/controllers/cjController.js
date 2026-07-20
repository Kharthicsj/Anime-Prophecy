import { asyncHandler, AppError } from '../utils/errorHandler.js';
import axios from 'axios';
import csvParser from 'csv-parser';
import fs from 'fs';

const CJ_GRAPHQL_URL = 'https://ads.api.cj.com/query';

const fetchCjProductsByQuery = async (query, variables) => {
    try {
        const response = await axios.post(
            CJ_GRAPHQL_URL,
            { query, variables },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.CJ_PERSONAL_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.errors) {
            console.error('CJ GraphQL (Partial) Errors:', JSON.stringify(response.data.errors, null, 2));
            // Only throw if we didn't get any data back (hard failure)
            if (!response.data.data) {
                throw new Error(response.data.errors[0]?.message || 'GraphQL Error');
            }
        }

        return response.data.data.shoppingProducts?.resultList || [];
    } catch (error) {
        console.error('CJ API Fetch failed:', error.message);
        if (error.response) console.error('CJ Response Data:', JSON.stringify(error.response.data, null, 2));
        throw new AppError('Failed to fetch from CJ Affiliate API', 500);
    }
};

const mapCjProduct = (p, propertyId) => {
    const textToSearch = `${p.title || ''} ${p.description || ''}`.toLowerCase();
    let derivedCategory = 'Uncategorized';
    
    if (textToSearch.match(/\b(figure|figures|statue|nendoroid|funko|action figure|scale figure)\b/)) {
        derivedCategory = 'Figures & Collectibles';
    } else if (textToSearch.match(/\b(shirt|t-shirt|tshirt|tee|hoodie|sweater|jacket|apparel|cosplay|costume|socks|pants)\b/)) {
        derivedCategory = 'Apparel';
    } else if (textToSearch.match(/\b(poster|wall scroll|art|print|canvas)\b/)) {
        derivedCategory = 'Posters & Art';
    } else if (textToSearch.match(/\b(plush|plushie|toy|doll)\b/)) {
        derivedCategory = 'Plushies & Toys';
    } else if (textToSearch.match(/\b(manga|book|comic|novel|volume)\b/)) {
        derivedCategory = 'Manga & Books';
    } else if (textToSearch.match(/\b(mug|cup|bottle|glass|tumbler)\b/)) {
        derivedCategory = 'Drinkware';
    } else if (textToSearch.match(/\b(keychain|lanyard|pin|badge|necklace|ring|jewelry|bracelet)\b/)) {
        derivedCategory = 'Accessories';
    } else if (textToSearch.match(/\b(bag|backpack|wallet|tote|purse|fanny pack)\b/)) {
        derivedCategory = 'Bags & Backpacks';
    } else if (textToSearch.match(/\b(dvd|blu-ray|bluray|movie)\b/)) {
        derivedCategory = 'Media';
    }

    const currencyToCountry = {
        'USD': 'United States',
        'GBP': 'United Kingdom',
        'EUR': 'France', // Generic mapping for European regions
        'CAD': 'Canada',
        'AUD': 'Australia',
        'JPY': 'Japan',
        'CZK': 'Czech Republic',
        'INR': 'India',
        'CNY': 'China'
    };
    
    const productCurrency = p.price?.currency || 'USD';
    const mappedCountry = currencyToCountry[productCurrency] || 'Worldwide';

    let finalAffiliateLink = p.linkCode?.clickUrl || '';
    if (propertyId && p.adId && p.link) {
        finalAffiliateLink = `https://www.jdoqocy.com/click-${propertyId}-${p.adId}?url=${encodeURIComponent(p.link)}`;
    }

    return {
        title: p.title,
        price: p.price?.amount || 0,
        currency: p.price?.currency || 'USD',
        images: p.imageLink ? [p.imageLink] : [],
        affiliateLink: finalAffiliateLink,
        affiliateProductId: p.id,
        affiliatePlatform: 'CJ Affiliate',
        store: p.advertiserName || 'CJ Affiliate',
        category: derivedCategory,
        countries: [mappedCountry],
        description: p.description || p.title,
        inStock: true
    };
};

export const fetchCjProductsByKeyword = asyncHandler(async (req, res) => {
    const { keywords, targetCurrency } = req.body;
    
    if (!process.env.CJ_PERSONAL_ACCESS_TOKEN || !process.env.CJ_PUBLISHER_ID) {
        throw new AppError('CJ Affiliate credentials are not configured on the server.', 500);
    }

    if (!keywords) throw new AppError('Keywords are required', 400);

    const query = `
        query SearchProducts($companyId: ID!, $propertyId: ID!, $keywords: [String!], $currency: String) {
            shoppingProducts(companyId: $companyId, keywords: $keywords, currency: $currency, partnerStatus: JOINED) {
                resultList {
                    id
                    title
                    price { amount currency }
                    imageLink
                    description
                    advertiserName
                    link
                    adId
                    linkCode(pid: $propertyId) { clickUrl }
                }
            }
        }
    `;

    const propertyId = process.env.CJ_PROPERTY_ID || process.env.CJ_PUBLISHER_ID;

    const variables = {
        companyId: process.env.CJ_PUBLISHER_ID,
        propertyId: propertyId,
        keywords: [keywords]
    };
    if (targetCurrency) variables.currency = targetCurrency;

    const cjProducts = await fetchCjProductsByQuery(query, variables);
    const normalizedProducts = cjProducts.map(p => mapCjProduct(p, propertyId));

    res.json({
        success: true,
        data: {
            products: normalizedProducts
        }
    });
});

export const fetchCjProductsByIds = asyncHandler(async (req, res) => {
    const { ids, targetCurrency } = req.body;

    if (!process.env.CJ_PERSONAL_ACCESS_TOKEN || !process.env.CJ_PUBLISHER_ID) {
        throw new AppError('CJ Affiliate credentials are not configured on the server.', 500);
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('Product IDs are required', 400);
    }

    const query = `
        query FetchProductsByIds($companyId: ID!, $propertyId: ID!, $productIds: [ID!], $currency: String) {
            shoppingProducts(companyId: $companyId, productIds: $productIds, currency: $currency) {
                resultList {
                    id
                    title
                    price { amount currency }
                    imageLink
                    description
                    advertiserName
                    link
                    adId
                    linkCode(pid: $propertyId) { clickUrl }
                }
            }
        }
    `;

    const propertyId = process.env.CJ_PROPERTY_ID || process.env.CJ_PUBLISHER_ID;

    const variables = {
        companyId: process.env.CJ_PUBLISHER_ID,
        propertyId: propertyId,
        productIds: ids.map(id => String(id))
    };
    if (targetCurrency) variables.currency = targetCurrency;

    const cjProducts = await fetchCjProductsByQuery(query, variables);
    const normalizedProducts = cjProducts.map(p => mapCjProduct(p, propertyId));

    res.json({
        success: true,
        data: {
            products: normalizedProducts
        }
    });
});

export const getCjProductDetails = async (productIds) => {
    if (!process.env.CJ_PERSONAL_ACCESS_TOKEN || !process.env.CJ_PUBLISHER_ID) {
        return [];
    }

    const query = `
        query FetchProductsByIds($companyId: ID!, $propertyId: ID!, $productIds: [ID!]) {
            shoppingProducts(companyId: $companyId, productIds: $productIds) {
                resultList {
                    id
                    title
                    price { amount currency }
                    imageLink
                    description
                    advertiserName
                    link
                    adId
                    linkCode(pid: $propertyId) { clickUrl }
                }
            }
        }
    `;

    const propertyId = process.env.CJ_PROPERTY_ID || process.env.CJ_PUBLISHER_ID;

    const variables = {
        companyId: process.env.CJ_PUBLISHER_ID,
        propertyId: propertyId,
        productIds: productIds.map(id => String(id))
    };

    try {
        const cjProducts = await fetchCjProductsByQuery(query, variables);
        return cjProducts.map(p => mapCjProduct(p, propertyId));
    } catch (error) {
        console.error("Error fetching CJ Products for sync:", error.message);
        return [];
    }
};
