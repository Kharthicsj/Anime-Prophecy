import cron from 'node-cron';
import Product from '../models/Product.js';
import { getAliExpressProductDetails } from '../utils/aliexpressApi.js';
import { getCjProductDetails } from '../controllers/cjController.js';
import CronLog from '../models/CronLog.js';

/**
 * Syncs products from affiliate platforms.
 * Currently supports AliExpress. Amazon and Flipkart can be added here later.
 */
let isSyncing = false;
export const syncProgress = {
    total: 0,
    current: 0,
    platform: ''
};

const syncAffiliateProducts = async () => {
    if (isSyncing) {
        console.log(`[CRON] Sync already in progress, skipping...`);
        return { skipped: true };
    }
    isSyncing = true;
    syncProgress.total = 0;
    syncProgress.current = 0;
    syncProgress.platform = '';
    
    console.log(`\n[CRON] Starting affiliate price sync at ${new Date().toLocaleString()}`);

    try {
        // 1. Fetch all active AliExpress products that have a valid affiliateProductId
        const aliExpressProducts = await Product.find({
            affiliatePlatform: 'AliExpress',
            affiliateProductId: { $exists: true, $ne: null }
        });

        syncProgress.platform = 'AliExpress';
        syncProgress.total = aliExpressProducts.length;
        syncProgress.current = 0;

        console.log(`[CRON] Found ${aliExpressProducts.length} AliExpress products to sync.`);

        if (aliExpressProducts.length > 0) {
            let aliExpressLog = new CronLog({ platform: 'AliExpress', events: [] });
            let updatedCount = 0;
            let failedCount = 0;
            const chunkSize = 50;
            const targetCurrency = 'USD';
            const targetLanguage = 'EN';

            for (let i = 0; i < aliExpressProducts.length; i += chunkSize) {
                const chunk = aliExpressProducts.slice(i, i + chunkSize);
                const chunkIds = chunk.map(p => p.affiliateProductId);
                let retryCount = 0;
                let apiRes = null;
                let chunkError = null;

                while (retryCount < 3) {
                    try {
                        apiRes = await getAliExpressProductDetails(chunkIds, targetCurrency, targetLanguage);
                        break; // Success
                    } catch (err) {
                        if (err.message && (err.message.includes('limit') || err.message.includes('frequency') || err.message.includes('second'))) {
                            retryCount++;
                            console.log(`[CRON] AliExpress rate limited on chunk ${i}. Retrying in 10s... (Attempt ${retryCount}/3)`);
                            await new Promise(res => setTimeout(res, 10000));
                        } else {
                            chunkError = err;
                            break;
                        }
                    }
                }

                if (!apiRes) {
                    const errorMsg = chunkError ? chunkError.message : "Rate limit retries exhausted.";
                    console.error(`[CRON] Error syncing chunk ${i}:`, errorMsg);
                    failedCount += chunk.length;

                    chunk.forEach(dbProduct => {
                        aliExpressLog.events.push({
                            eventType: 'Failed',
                            productTitle: dbProduct.title,
                            productId: dbProduct._id,
                            details: `API Error: ${errorMsg}`
                        });
                    });

                    if (i + chunkSize < aliExpressProducts.length) {
                        await new Promise(res => setTimeout(res, 15000)); // 15 second delay to avoid bans
                    }
                    syncProgress.current += chunk.length;
                    continue; // Skip to next chunk
                }

                try {
                    if (apiRes?.resp_result?.result?.current_record_count > 0) {
                        const fetchedProducts = apiRes.resp_result.result.products.product || [];
                        const fetchedMap = new Map();
                        fetchedProducts.forEach(fp => {
                            fetchedMap.set(fp.product_id.toString(), fp);
                        });

                        for (const dbProduct of chunk) {
                            const updatedData = fetchedMap.get(dbProduct.affiliateProductId);

                            if (updatedData) {
                                let hasChanges = false;
                                let changes = [];

                                const newPrice = Number(updatedData.target_sale_price || updatedData.target_original_price);
                                if (newPrice > 0 && newPrice !== dbProduct.price) {
                                    changes.push(`Price: ${dbProduct.price} -> ${newPrice}`);
                                    dbProduct.price = newPrice;
                                    hasChanges = true;
                                }

                                const evaluateRate = updatedData.evaluate_rate;
                                const newRating = typeof evaluateRate === 'string' && evaluateRate.includes('%')
                                    ? Math.round((parseFloat(evaluateRate) / 20) * 10) / 10
                                    : Number(evaluateRate) || dbProduct.rating;

                                if (newRating !== dbProduct.rating) {
                                    changes.push(`Rating updated`);
                                    dbProduct.rating = newRating;
                                    hasChanges = true;
                                }

                                if (!dbProduct.inStock || !dbProduct.isActive) {
                                    changes.push(`Back in stock / Reactivated`);
                                    dbProduct.inStock = true;
                                    dbProduct.isActive = true;
                                    hasChanges = true;
                                }

                                if (updatedData.product_title && updatedData.product_title !== dbProduct.title) {
                                    changes.push(`Title updated`);
                                    dbProduct.title = updatedData.product_title;
                                    hasChanges = true;
                                }

                                if (updatedData.first_level_category_name && updatedData.first_level_category_name !== dbProduct.category) {
                                    dbProduct.category = updatedData.first_level_category_name;
                                    hasChanges = true;
                                }

                                if (updatedData.second_level_category_name && updatedData.second_level_category_name !== dbProduct.subCategory) {
                                    dbProduct.subCategory = updatedData.second_level_category_name;
                                    hasChanges = true;
                                }

                                if (updatedData.promotion_link && updatedData.promotion_link !== dbProduct.affiliateLink) {
                                    dbProduct.affiliateLink = updatedData.promotion_link;
                                    hasChanges = true;
                                }

                                if (hasChanges) {
                                    await dbProduct.save();
                                    updatedCount++;
                                    aliExpressLog.events.push({
                                        eventType: 'Updated',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: changes.join(', ')
                                    });
                                } else {
                                    aliExpressLog.events.push({
                                        eventType: 'Unchanged',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: 'No changes detected.'
                                    });
                                }
                            } else {
                                if (dbProduct.inStock || dbProduct.isActive) {
                                    dbProduct.inStock = false;
                                    dbProduct.isActive = false;
                                    await dbProduct.save();
                                    updatedCount++;
                                    aliExpressLog.events.push({
                                        eventType: 'Private',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: 'Not found on AliExpress, marked private/out-of-stock.'
                                    });
                                } else {
                                    aliExpressLog.events.push({
                                        eventType: 'Unchanged',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: 'Remains private/out-of-stock.'
                                    });
                                }
                            }
                        }
                    } else {
                        failedCount += chunk.length;
                        chunk.forEach(dbProduct => {
                            aliExpressLog.events.push({
                                eventType: 'Failed',
                                productTitle: dbProduct.title,
                                productId: dbProduct._id,
                                details: `No data returned from AliExpress API.`
                            });
                        });
                    }
                } catch (err) {
                    console.error(`[CRON] Error syncing chunk ${i}:`, err.message);
                    failedCount += chunk.length;
                    chunk.forEach(dbProduct => {
                        aliExpressLog.events.push({
                            eventType: 'Failed',
                            productTitle: dbProduct.title,
                            productId: dbProduct._id,
                            details: `Processing Error: ${err.message}`
                        });
                    });
                }

                if (i + chunkSize < aliExpressProducts.length) {
                    await new Promise(res => setTimeout(res, 15000)); // 15 second base delay for large volumes
                }
                syncProgress.current += chunk.length;
            }

            aliExpressLog.summary = `AliExpress Sync: Checked ${aliExpressProducts.length}, ${updatedCount} updated, ${failedCount} failed.`;
            if (failedCount > 0) aliExpressLog.status = 'Partial';
            await aliExpressLog.save();
        }

        // 2. CJ Affiliate Sync
        const cjProducts = await Product.find({
            affiliatePlatform: 'CJ Affiliate',
            affiliateProductId: { $exists: true, $ne: null }
        });

        syncProgress.platform = 'CJ Affiliate';
        syncProgress.total = cjProducts.length;
        syncProgress.current = 0;

        console.log(`[CRON] Found ${cjProducts.length} CJ Affiliate products to sync.`);

        if (cjProducts.length > 0) {
            let cjLog = new CronLog({ platform: 'CJ Affiliate', events: [] });
            let updatedCount = 0;
            let failedCount = 0;
            const chunkSize = 50;

            for (let i = 0; i < cjProducts.length; i += chunkSize) {
                const chunk = cjProducts.slice(i, i + chunkSize);
                const chunkIds = chunk.map(p => p.affiliateProductId);

                try {
                    const fetchedProducts = await getCjProductDetails(chunkIds);

                    if (fetchedProducts && fetchedProducts.length > 0) {
                        const fetchedMap = new Map();
                        fetchedProducts.forEach(fp => {
                            fetchedMap.set(fp.affiliateProductId.toString(), fp);
                        });

                        for (const dbProduct of chunk) {
                            const updatedData = fetchedMap.get(dbProduct.affiliateProductId);

                            if (updatedData) {
                                let hasChanges = false;
                                let changes = [];

                                if (updatedData.price > 0 && updatedData.price !== dbProduct.price) {
                                    changes.push(`Price: ${dbProduct.price} -> ${updatedData.price}`);
                                    dbProduct.price = updatedData.price;
                                    hasChanges = true;
                                }

                                if (updatedData.title && updatedData.title !== dbProduct.title) {
                                    changes.push(`Title updated`);
                                    dbProduct.title = updatedData.title;
                                    hasChanges = true;
                                }

                                if (updatedData.affiliateLink && updatedData.affiliateLink !== dbProduct.affiliateLink) {
                                    dbProduct.affiliateLink = updatedData.affiliateLink;
                                    hasChanges = true;
                                }

                                if (!dbProduct.inStock || !dbProduct.isActive) {
                                    changes.push(`Back in stock / Reactivated`);
                                    dbProduct.inStock = true;
                                    dbProduct.isActive = true;
                                    hasChanges = true;
                                }

                                if (hasChanges) {
                                    await dbProduct.save();
                                    updatedCount++;
                                    cjLog.events.push({
                                        eventType: 'Updated',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: changes.join(', ')
                                    });
                                } else {
                                    cjLog.events.push({
                                        eventType: 'Unchanged',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: 'No changes detected.'
                                    });
                                }
                            } else {
                                if (dbProduct.isActive || dbProduct.inStock) {
                                    dbProduct.isActive = false;
                                    dbProduct.inStock = false;
                                    await dbProduct.save();
                                    updatedCount++;
                                    cjLog.events.push({
                                        eventType: 'Private',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: 'Not found on CJ Affiliate, marked private/out-of-stock.'
                                    });
                                } else {
                                    cjLog.events.push({
                                        eventType: 'Unchanged',
                                        productTitle: dbProduct.title,
                                        productId: dbProduct._id,
                                        details: 'Remains private/out-of-stock.'
                                    });
                                }
                            }
                        }
                    } else {
                        for (const dbProduct of chunk) {
                            if (dbProduct.isActive || dbProduct.inStock) {
                                dbProduct.isActive = false;
                                dbProduct.inStock = false;
                                await dbProduct.save();
                                updatedCount++;
                                cjLog.events.push({
                                    eventType: 'Private',
                                    productTitle: dbProduct.title,
                                    productId: dbProduct._id,
                                    details: 'CJ returned no products, marked private/out-of-stock.'
                                });
                            }
                        }
                    }
                } catch (err) {
                    failedCount += chunk.length;
                }

                if (i + chunkSize < cjProducts.length) {
                    await new Promise(res => setTimeout(res, 2000));
                }
                syncProgress.current += chunk.length;
            }

            cjLog.summary = `CJ Affiliate Sync: Checked ${cjProducts.length}, ${updatedCount} updated, ${failedCount} failed.`;
            if (failedCount > 0) cjLog.status = 'Partial';
            await cjLog.save();
        }

        // 3. Placeholder for Amazon Sync
        // const amazonProducts = await Product.find({ affiliatePlatform: 'Amazon', isActive: true });

        // 3. Placeholder for Flipkart Sync
        // const flipkartProducts = await Product.find({ affiliatePlatform: 'Flipkart', isActive: true });
        // if (flipkartProducts.length > 0) {
        //      syncFlipkartProducts(flipkartProducts);
        // }

    } catch (error) {
        console.error(`[CRON] Critical Error during Affiliate Sync:`, error);
        return { error: true };
    } finally {
        isSyncing = false;
        syncProgress.total = 0;
        syncProgress.current = 0;
    }
    
    return { success: true };
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

    console.log("⏱️  Cron Jobs Initialized (Price Sync scheduled for 1:00 AM SG Time)");

    // Catch-up logic: Run on startup if the last run was missed
    setTimeout(async () => {
        try {
            const lastLog = await CronLog.findOne().sort({ runDate: -1 });
            if (!lastLog) {
                console.log("[CRON] No previous logs found. Running initial sync...");
                syncAffiliateProducts();
                return;
            }

            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (Date.now() - new Date(lastLog.runDate).getTime() > ONE_DAY) {
                console.log("[CRON] Last sync was over 24 hours ago. Running catch-up sync...");
                syncAffiliateProducts();
            } else {
                console.log("[CRON] Sync is up to date (ran within the last 24 hours).");
            }
        } catch (error) {
            console.error("[CRON] Failed to check last log on startup:", error);
        }
    }, 10000); // Check 10 seconds after server startup
};

export const manualSyncAffiliateProducts = syncAffiliateProducts;
export const getIsSyncing = () => isSyncing;
export const getSyncProgressData = () => syncProgress;
