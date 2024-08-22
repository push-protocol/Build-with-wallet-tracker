import { getYields } from "../apis/getYields.js";
import { getWalletBalance } from "../apis/getWalletBalance.js";
import { getDomainName } from "../utils/getDomainName.js";
import { urlShortener } from "../utils/urlShortener.js";

const FARM_CATEGORIES = ["Liquidity Pool", "Staking/Lending"];

export const formattedYields = async (address, chainIndexFound) => {
  try {
    let allTokens = [];
    let result = {};

    const yieldsData = await getYields();
    const userTokensData = await getWalletBalance(address, chainIndexFound);

    if (yieldsData.error) {
      return { error: true, message: yieldsData.message };
    }

    const yields = yieldsData?.data;
    const userTokens = userTokensData?.data;

    if (yields.length === 0) {
      return { error: true, message: "No yields found" };
    }

    // Get a single array of all tokens
    if (chainIndexFound == -1) {
      allTokens = Object.values(userTokens).flat();
    } else {
      allTokens = userTokens;
    }

    // Fetch yields for more than 2%
    for (let i = 0; i < yields.length; i++) {
      const element = yields[i];
      const tokenSymbol = element.tokens.deposits[0].symbol;
      const categories = element.categories;

      let found = allTokens.find(
        (token) => token.contract_ticker_symbol === tokenSymbol
      );

      if (found !== undefined) {
        const isEligible = allTokens.some(
          (token) =>
            token.contract_ticker_symbol == found.contract_ticker_symbol &&
            token.quote_24h > 0
        );

        if (isEligible) {
          let category = FARM_CATEGORIES[1];
          let pair = null;

          if (categories.includes("liquidity-pool")) {
            category = FARM_CATEGORIES[0];

            if (element.tokens.deposits.length != 2) {
              continue;
            }

            pair = element.tokens.deposits[1].symbol;
          }

          // Check if object "key" already exists
          const tokenKeyExists = result.hasOwnProperty(tokenSymbol);

          if (tokenKeyExists) {
            const oldApr = result[tokenSymbol].apr;
            const newApr = element.apr * 100;

            const link = element.investmentUrl || element.farm.url;
            const shortenedUrl = await urlShortener(link);

            if (newApr > oldApr) {
              result[tokenSymbol].apr = newApr;
              result[tokenSymbol].platform = getDomainName(element.farm.url);
              result[tokenSymbol].link = shortenedUrl;
              result[tokenSymbol].category = category;
              result[tokenSymbol].pair = pair;
            }
          } else {
            const link = element.investmentUrl || element.farm.url;
            const shortenedUrl = await urlShortener(link);

            if (element.apr * 100 > 1) {
              result[tokenSymbol] = {
                apr: element.apr * 100,
                platform: getDomainName(element.farm.url),
                link: shortenedUrl,
                category: category,
                pair: pair,
              };
            }
          }
        }
      } else {
        continue;
      }
    }

    return {
      error: false,
      totalYields: Object.keys(result).length,
      yields: result,
    };
  } catch (error) {
    console.log("Error while formatting token approvals: ", error);
    return {
      error: true,
      message:
        "Something went wrong while formatting your token approvals! Try again or contact owner!",
    };
  }
};
