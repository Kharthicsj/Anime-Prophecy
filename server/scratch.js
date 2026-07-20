import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CJ_GRAPHQL_URL = 'https://ads.api.cj.com/query';

const fetchSchema = async () => {
    try {
        const query = `
            query {
              __type(name: "Query") {
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
        const shoppingProducts = response.data.data.__type.fields.find(f => f.name === 'shoppingProducts');
        console.log(JSON.stringify(shoppingProducts.args, null, 2));
    } catch (err) {
        console.error(err.message);
    }
}
fetchSchema();
