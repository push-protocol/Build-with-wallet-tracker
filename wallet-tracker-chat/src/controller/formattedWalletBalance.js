import { getWalletBalance } from "../apis/getWalletBalance.js";
import { ethers } from "ethers";

export const formattedWalletBalance = async (address, chainIndexFound) => {
  try {
    const data = await getWalletBalance(address, chainIndexFound);
    let totalWorth= 0, totalTokenCount = 0, tokensArray = [], tokenInfo;

    if (data.error) {
      return { error: true, message: data.message }
    }

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
          worth: item.quote.toFixed(4)
        }

        tokensArray.push(tokenInfo);
      }
    });

    // Get tokens worth greater than $1
    let filterTokens = tokensArray.filter((token) => token.worth > 1);

    return { error: false, tokensInfo: filterTokens, totalWorth: totalWorth.toFixed(4), totalTokens: totalTokenCount.toFixed(4)}

  } catch (error) {
    return { error: true, message: "Error while formatting wallet balance!" };
  }
};