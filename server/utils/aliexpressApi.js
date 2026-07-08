import crypto from 'crypto';
import axios from 'axios';

const API_GATEWAY = 'https://api-sg.aliexpress.com/sync';

/**
 * Generates the signature for AliExpress API request
 */
function generateSign(appSecret, params) {
    const sortedKeys = Object.keys(params).sort();
    let baseString = '';
    sortedKeys.forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            baseString += key + params[key];
        }
    });
    // For TopClient signature format
    baseString = appSecret + baseString + appSecret;
    return crypto.createHash('md5').update(baseString, 'utf8').digest('hex').toUpperCase();
}

/**
 * Executes a request to AliExpress Open Platform
 */
export async function executeAliExpressRequest(method, bizParams = {}) {
    const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
    const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("AliExpress App Key or Secret not configured in environment variables.");
    }

    // Build system parameters
    const systemParams = {
        app_key: APP_KEY,
        timestamp: Date.now().toString(),
        sign_method: 'md5',
        v: '2.0',
        format: 'json',
        method: method,
    };

    // Combine system and business parameters
    const allParams = { ...systemParams, ...bizParams };

    // Generate Signature
    allParams.sign = generateSign(APP_SECRET, allParams);

    // Make the request using URLSearchParams to properly format application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    for (const key in allParams) {
        if (allParams[key] !== undefined && allParams[key] !== null) {
            formData.append(key, allParams[key]);
        }
    }

    try {
        const response = await axios.post(API_GATEWAY, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            }
        });

        const rootNode = response.data[method.replace(/\./g, '_') + '_response'];
        if (rootNode) {
            return rootNode;
        } else if (response.data.error_response) {
            throw new Error(`AliExpress API Error: ${response.data.error_response.msg} (${response.data.error_response.sub_msg || ''})`);
        }
        
        return response.data;
    } catch (error) {
        console.error('AliExpress API Request Failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Fetch product details by IDs
 * @param {string[]} productIds - Array of product IDs (Max 50)
 * @param {string} targetCurrency - Target currency (e.g., 'USD', 'INR', 'JPY')
 * @param {string} targetLanguage - Target language (e.g., 'EN', 'RU')
 */
export async function getAliExpressProductDetails(productIds, targetCurrency = 'USD', targetLanguage = 'EN') {
    const trackingId = process.env.ALIEXPRESS_TRACKING_ID || 'default_tracking_id';
    
    const bizParams = {
        app_signature: trackingId,
        fields: 'product_id,product_title,product_main_image_url,product_small_image_urls,target_sale_price,target_original_price,target_sale_price_currency,promotion_link,evaluate_rate,first_level_category_name,second_level_category_name',
        product_ids: productIds.join(','),
        tracking_id: trackingId,
        target_currency: targetCurrency,
        target_language: targetLanguage
    };
    
    return await executeAliExpressRequest('aliexpress.affiliate.productdetail.get', bizParams);
}
