import axios from 'axios';

const CJ_GRAPHQL_URL = 'https://ads.api.cj.com/query';

/**
 * Helper to fetch the CJ Affiliate GraphQL schema documentation for a specific node type.
 * Usage: fetchCjSchema('ShoppingProductsQuery').then(console.log)
 */
export const fetchCjSchema = async (nodeName = "Query") => {
    try {
        const query = `
            query {
              __type(name: "${nodeName}") {
                fields {
                  name
                  args {
                    name
                    type {
                      name
                      kind
                      ofType {
                        name
                        kind
                      }
                    }
                  }
                }
              }
            }
        `;
        const response = await axios.post(
            CJ_GRAPHQL_URL,
            { query },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.CJ_PERSONAL_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.data.__type.fields;
    } catch (err) {
        console.error("CJ Schema Fetch Error:", err.message);
        return null;
    }
};
