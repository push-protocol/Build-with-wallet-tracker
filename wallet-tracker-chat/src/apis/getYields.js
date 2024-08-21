import { GraphQLClient, gql } from "graphql-request";
import "dotenv/config";

const DEFI_API_KEY = process.env.DEFI_API_KEY;
const DEFI_API_ENDPOINT = "https://public-api.de.fi/graphql/rekts";

export const getYields = async () => {
  try {
    const query = gql`
      query {
        opportunities(orderBy: TVL, orderDirection: desc) {
          id
          chainId
          apr
          totalValueLocked
          categories
          investmentUrl
          isNew
          status
          farm {
            id
            url
            slug
            logo
            categories
          }
          tokens {
            borrowRewards {
              displayName
              icon
              symbol
              name
            }
            deposits {
              displayName
              icon
              symbol
              name
            }
            rewards {
              displayName
              icon
              symbol
              name
            }
          }
        }
      }
    `;
    // Create a GraphQL client with the X-Api-Key header
    const client = new GraphQLClient(DEFI_API_ENDPOINT, {
      headers: {
        "X-Api-Key": DEFI_API_KEY,
      },
    });

    const data = await client.request(query);

    return { error: false, data: data.opportunities };
  } catch (error) {
    return {
      error: true,
      message: "Error getting yield oppurtunities!",
    };
  }
};
