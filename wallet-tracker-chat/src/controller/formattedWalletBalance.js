// ***************************************************************
// /////////////////// Format Wallet Balance /////////////////////
// ***************************************************************
//  Get token holdings details and format it for chat response

import { getWalletBalance } from "../apis/getWalletBalance.js";
import { ethers } from "ethers";

export const formattedWalletBalance = async (address, chainIndexFound) => {
  try {
    // API call to get token holding
    const data = await getWalletBalance(address, chainIndexFound);

    let totalWorth = 0,
      totalTokenCount = 0,
      tokensArray = [],
      tokenInfo;

    // Return if error
    if (data.error) {
      return { error: true, message: data.message };
    }

    if (chainIndexFound == -1) {
      let chainWiseTokens = data?.data;
      let values = [];

      const keys = Object.keys(chainWiseTokens);

      keys.forEach((key) => {
        const tokenValues = chainWiseTokens[key];

        tokenValues.map((token) => {
          let tokenBalance = Number(
            ethers.formatUnits(token.balance, token.contract_decimals)
          ).toFixed(4);

          if (token.quote) {
            totalWorth += token.quote;
            totalTokenCount += Number(
              ethers.formatUnits(token.balance, token.contract_decimals)
            );

            tokenInfo = {
              name: token.contract_ticker_symbol,
              balance: tokenBalance,
              worth: token.quote.toFixed(4),
            };

            values.push(tokenInfo);
          }
        });

        let filterTokens = values.filter((token) => token.worth > 1);
        chainWiseTokens[key] = filterTokens;
        values = [];
      });

      return {
        error: false,
        tokensInfo: chainWiseTokens,
        totalWorth: totalWorth.toFixed(4),
        totalTokens: totalTokenCount.toFixed(4),
      };
    }

    // Loop through tokens and format it
    data?.data?.map((item) => {
      let tokenBalance = Number(
        ethers.formatUnits(item.balance, item.contract_decimals)
      ).toFixed(4);

      if (item.quote) {
        totalWorth += item.quote;
        totalTokenCount += Number(
          ethers.formatUnits(item.balance, item.contract_decimals)
        );

        tokenInfo = {
          name: item.contract_ticker_symbol,
          balance: tokenBalance,
          worth: item.quote.toFixed(4),
        };

        tokensArray.push(tokenInfo);
      }
    });

    // Get tokens worth greater than $1
    let filterTokens = tokensArray.filter((token) => token.worth > 1);

    return {
      error: false,
      tokensInfo: filterTokens,
      totalWorth: totalWorth.toFixed(4),
      totalTokens: totalTokenCount.toFixed(4),
    };
  } catch (error) {
    return { error: true, message: "Error while formatting wallet balance!" };
  }
};