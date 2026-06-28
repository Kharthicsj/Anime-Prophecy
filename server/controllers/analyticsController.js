export const getAnalyticsData = async (req, res) => {
    try {
        const projectId = process.env.POSTHOG_PROJECT_ID;
        const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
        const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

        if (!projectId || !apiKey) {
            return res.status(500).json({ 
                success: false, 
                message: "PostHog credentials (POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY) missing on server" 
            });
        }

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        const fetchQuery = async (query) => {
            const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query })
            });
            if (!response.ok) {
                console.error("PostHog API Error:", await response.text());
                return { results: [] };
            }
            return await response.json();
        };

        // 1. Page views over time
        const pageviewsQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview", math: "total" }],
            dateRange: { date_from: "-7d" }
        };

        // 2. Unique visitors over time (DAU)
        const uniqueVisitorsQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview", math: "dau" }],
            dateRange: { date_from: "-7d" }
        };

        // 3. Browsers breakdown
        const browsersQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview" }],
            breakdownFilter: { breakdown: "$browser", breakdown_type: "event" },
            dateRange: { date_from: "-7d" }
        };

        // 4. Referrers breakdown
        const referrersQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview" }],
            breakdownFilter: { breakdown: "$referring_domain", breakdown_type: "event" },
            dateRange: { date_from: "-7d" }
        };

        // 5. Top Paths
        const pathsQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview" }],
            breakdownFilter: { breakdown: "$pathname", breakdown_type: "event" },
            dateRange: { date_from: "-7d" }
        };

        // 6. Top Countries
        const countriesQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview" }],
            breakdownFilter: { breakdown: "$geoip_country_name", breakdown_type: "event" },
            dateRange: { date_from: "-7d" }
        };

        // 7. Devices Type
        const devicesQuery = {
            kind: "TrendsQuery",
            series: [{ kind: "EventsNode", event: "$pageview" }],
            breakdownFilter: { breakdown: "$device_type", breakdown_type: "event" },
            dateRange: { date_from: "-7d" }
        };

        const [pageviews, uniqueVisitors, browsers, referrers, paths, countries, devices] = await Promise.all([
            fetchQuery(pageviewsQuery),
            fetchQuery(uniqueVisitorsQuery),
            fetchQuery(browsersQuery),
            fetchQuery(referrersQuery),
            fetchQuery(pathsQuery),
            fetchQuery(countriesQuery),
            fetchQuery(devicesQuery)
        ]);

        res.status(200).json({
            success: true,
            data: {
                pageviews: pageviews?.results || [],
                uniqueVisitors: uniqueVisitors?.results || [],
                browsers: browsers?.results || [],
                referrers: referrers?.results || [],
                paths: paths?.results || [],
                countries: countries?.results || [],
                devices: devices?.results || []
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
