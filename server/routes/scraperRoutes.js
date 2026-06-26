import express from 'express';
import axios from 'axios';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route POST /api/scraper/fetch-product
 * @desc Fetch product details from a URL using Diffbot
 * @access Private/Admin
 */
router.post('/fetch-product', verifyToken, isAdmin, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        const apiKey = process.env.DIFFBOT_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Diffbot API key is not configured' });
        }

        let extractedData = null;
        let diffbotError = null;

        try {
            const diffbotUrl = `https://api.diffbot.com/v3/product?url=${encodeURIComponent(url)}&token=${apiKey}`;
            const response = await axios.get(diffbotUrl);
            const data = response.data;
            
            if (!data.error && data.objects && data.objects.length > 0) {
                const product = data.objects[0];
                extractedData = {
                    title: product.title || '',
                    description: product.text || '',
                    price: product.offerPrice || product.regularPrice || '',
                    imageUrl: (product.images && product.images.length > 0) ? product.images[0].url : ''
                };
            } else {
                diffbotError = data.error || 'No product data found';
            }
        } catch (err) {
            diffbotError = err.message;
        }

        // Fallback to Microlink API if Diffbot fails
        if (!extractedData) {
            console.log(`Diffbot failed (${diffbotError}), attempting fallback to Microlink...`);
            try {
                const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
                const mlResponse = await axios.get(microlinkUrl);
                const mlData = mlResponse.data;

                if (mlData.status === 'success' && mlData.data) {
                    extractedData = {
                        title: mlData.data.title || '',
                        description: mlData.data.description || '',
                        price: '', // Microlink does not extract price reliably
                        imageUrl: mlData.data.image?.url || mlData.data.logo?.url || ''
                    };
                }
            } catch (mlErr) {
                console.error('Microlink fallback error:', mlErr.message);
            }
        }

        if (!extractedData) {
            return res.status(400).json({ 
                success: false, 
                message: `Failed to extract data. Both Diffbot and Fallback failed. This usually happens if the link is a tracking link or if the site (like Amazon) blocks bots. Try a clean, direct product URL.`
            });
        }

        res.json({ success: true, data: extractedData });
    } catch (error) {
        console.error('Scraper route error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error while fetching product data' });
    }
});

export default router;
