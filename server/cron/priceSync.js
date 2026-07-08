import cron from 'node-cron';
import Product from '../models/Product.js';
import { getAliExpressProductDetails } from '../utils/aliexpressApi.js';

/**
 * Syncs products from affiliate platforms.
 * Currently supports AliExpress. Amazon and Flipkart can be added here later.
 */
const syncAffiliateProducts = async () => {
    console.log(`\n[CRON] Starting affiliate price sync at ${new Date().toLocaleString()}`);
    
    try {
        // 1. Fetch all active AliExpress products that have a valid affiliateProductId
        const aliExpressProducts = await Product.find({ 
            affiliatePlatform: 'AliExpress',
            affiliateProductId: { $exists: true, $ne: null },
            isActive: true 
        });

        console.log(`[CRON] Found ${aliExpressProducts.length} AliExpress products to sync.`);

        if (aliExpressProducts.length > 0) {
            let updatedCount = 0;
            let failedCount = 0;
            const chunkSize = 50; // AliExpress API limit per request

            // Group products by targetCurrency if needed. For now, assume USD for global sync, 
            // or dynamically extract if your platform uses mixed currencies. 
            // We'll use 'USD' as the standard baseline for updates.
            const targetCurrency = 'USD';
            const targetLanguage = 'EN';

            for (let i = 0; i < aliExpressProducts.length; i += chunkSize) {
                const chunk = aliExpressProducts.slice(i, i + chunkSize);
                const chunkIds = chunk.map(p => p.affiliateProductId);
                
                try {
                    const apiRes = await getAliExpressProductDetails(chunkIds, targetCurrency, targetLanguage);
                    
                    if (apiRes?.resp_result?.result?.current_record_count > 0) {
                        const fetchedProducts = apiRes.resp_result.result.products.product || [];
                        
                        // Create a map for quick lookup
                        const fetchedMap = new Map();
                        fetchedProducts.forEach(fp => {
                            fetchedMap.set(fp.product_id.toString(), fp);
                        });

                        // Compare and update DB
                        for (const dbProduct of chunk) {
                            const updatedData = fetchedMap.get(dbProduct.affiliateProductId);
                            
                            if (updatedData) {
                                let hasChanges = false;
                                
                                // Price check
                                const newPrice = Number(updatedData.target_sale_price || updatedData.target_original_price);
                                if (newPrice > 0 && newPrice !== dbProduct.price) {
                                    dbProduct.price = newPrice;
                                    hasChanges = true;
                                }

                                // Rating check
                                const evaluateRate = updatedData.evaluate_rate;
                                const newRating = typeof evaluateRate === 'string' && evaluateRate.includes('%')
                                    ? Math.round((parseFloat(evaluateRate) / 20) * 10) / 10
                                    : Number(evaluateRate) || dbProduct.rating;
                                    
                                if (newRating !== dbProduct.rating) {
                                    dbProduct.rating = newRating;
                                    hasChanges = true;
                                }
                                
                                // InStock check
                                if (!dbProduct.inStock) {
                                    dbProduct.inStock = true;
                                    hasChanges = true;
                                }

                                // Title check
                                if (updatedData.product_title && updatedData.product_title !== dbProduct.title) {
                                    dbProduct.title = updatedData.product_title;
                                    hasChanges = true;
                                }

                                // Category check
                                if (updatedData.first_level_category_name && updatedData.first_level_category_name !== dbProduct.category) {
                                    dbProduct.category = updatedData.first_level_category_name;
                                    hasChanges = true;
                                }
                                
                                // SubCategory check
                                if (updatedData.second_level_category_name && updatedData.second_level_category_name !== dbProduct.subCategory) {
                                    dbProduct.subCategory = updatedData.second_level_category_name;
                                    hasChanges = true;
                                }

                                // Affiliate Link check (Dynamic promotion link updates)
                                if (updatedData.promotion_link && updatedData.promotion_link !== dbProduct.affiliateLink) {
                                    dbProduct.affiliateLink = updatedData.promotion_link;
                                    hasChanges = true;
                                }

                                if (hasChanges) {
                                    await dbProduct.save();
                                    updatedCount++;
                                }
                            } else {
                                // Product wasn't returned by AliExpress. It might be out of stock or removed.
                                if (dbProduct.inStock) {
                                    dbProduct.inStock = false;
                                    await dbProduct.save();
                                    updatedCount++;
                                    console.log(`[CRON] Product ${dbProduct.title} marked out of stock (not found on AliExpress).`);
                                }
                            }
                        }
                    } else {
                        console.error(`[CRON] AliExpress chunk ${i} returned no valid products.`);
                        failedCount += chunk.length;
                    }
                } catch (err) {
                    console.error(`[CRON] Error syncing chunk ${i}:`, err.message);
                    failedCount += chunk.length;
                }

                // Wait 2000ms between chunks to respect API rate limits
                if (i + chunkSize < aliExpressProducts.length) {
                    await new Promise(res => setTimeout(res, 2000));
                }
            }

            console.log(`[CRON] AliExpress Sync Complete. Updated: ${updatedCount}, Failed: ${failedCount}`);
        }

        // 2. Placeholder for Amazon Sync
        // const amazonProducts = await Product.find({ affiliatePlatform: 'Amazon', isActive: true });
        // if (amazonProducts.length > 0) {
        //      syncAmazonProducts(amazonProducts);
        // }

        // 3. Placeholder for Flipkart Sync
        // const flipkartProducts = await Product.find({ affiliatePlatform: 'Flipkart', isActive: true });
        // if (flipkartProducts.length > 0) {
        //      syncFlipkartProducts(flipkartProducts);
        // }

    } catch (error) {
        console.error(`[CRON] Critical Error during Affiliate Sync:`, error);
    }
};

/**
 * Initializes all cron jobs for the application.
 */
export const initCronJobs = () => {
    // Run at 01:00 AM every day
    cron.schedule('0 1 * * *', () => {
        syncAffiliateProducts();
    }, {
        scheduled: true,
        timezone: "Asia/Singapore" // Matches the SG API timezone or can be customized
    });
    
    console.log("⏱️  Cron Jobs Initialized (Price Sync scheduled for 1:00 AM)");
};

export const testSync = syncAffiliateProducts;
