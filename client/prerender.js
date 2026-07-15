import { run } from 'react-snap';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function generatePrerender() {
    try {
        console.log(`Fetching unique anime tags for SEO prerendering from ${API_URL}...`);
        
        const res = await fetch(`${API_URL}/products/meta/filters?country=Worldwide`);
        const json = await res.json();
        
        let animeRoutes = [];
        if (json.success && json.data && json.data.animeTags) {
            const animeTags = json.data.animeTags;
            console.log(`Found ${animeTags.length} anime tags.`);
            
            animeRoutes = animeTags
                .filter(tag => tag && tag.toLowerCase() !== "all anime")
                .map(tag => {
                    const slug = tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    return `/country/worldwide/anime/${slug}`;
                });
        } else {
            console.warn('Could not fetch anime tags. Proceeding with default routes.');
        }

        const includeRoutes = ['/', '/country/worldwide', ...animeRoutes];
        
        // Let's cap the maximum number of routes prerendered if there are too many (e.g., > 100) to prevent timeouts,
        // although 100 routes with crawl:false should take about 1-2 minutes.
        console.log(`Starting react-snap for ${includeRoutes.length} routes...`);

        await run({
            source: 'dist',
            include: includeRoutes,
            crawl: false,
            puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('Prerendering completed successfully!');
    } catch (err) {
        console.error('Prerender script failed:', err);
        process.exit(1);
    }
}

generatePrerender();
