import { buildChart } from "../utils/buildChart.js";
import { formattedWalletBalance } from "../controller/formattedWalletBalance.js";

export const command_portfolio = async (
  params,
  receiver,
  userAlice,
  resolvedAddress,
  chainIndexFound
) => {
  try {
    let walletData,
      pieChartURI,
      result = [],
      totalTokens;

    if (params.length == 2) {
      // All chains
      chainIndexFound = -1;

      let allTokensObj = {},
        allTokens = [];

      walletData = await formattedWalletBalance(
        resolvedAddress,
        chainIndexFound
      );

      // Merge all the chain tokens
      const keys = Object.keys(walletData.tokensInfo);

      keys.forEach((key) => {
        const tokens = walletData.tokensInfo[key];
        allTokens.push(...tokens);
      });

      totalTokens = allTokens.length;

      allTokensObj = {
        error: false,
        tokensInfo: allTokens,
        totalWorth: walletData.totalWorth,
        totalTokens: walletData.totalTokens,
      };

      pieChartURI = await buildChart(allTokensObj);
    }

    if (params.length == 3) {
      // Specific chain
      walletData = await formattedWalletBalance(
        resolvedAddress,
        chainIndexFound
      );

      pieChartURI = await buildChart(walletData);
    }

    if (walletData.error) {
      throw {
        message: `${walletData.message}`,
      };
    }

    const walletWorth = walletData.totalWorth;
    const walletTokens = walletData.tokensInfo;

    let walletPerformance;

    if (chainIndexFound == -1) {
      const data = walletData.tokensInfo;

      walletPerformance = `Total Assets Worth: 💲${walletWorth}\nTotal Token Holding: 💰 ${totalTokens}\n\n\n`;

      for (const [network, accounts] of Object.entries(data)) {
        if (accounts.length > 0) {
          result.push(`• ${network}`);

          accounts.forEach((account, index) => {
            result.push(
              `${index + 1}. ${account.name} - ${account.balance} ($${
                account.worth
              })`
            );
          });

          result.push(""); // Add an empty line for separation
        }
      }
      const finalResult = result.join("\n");
      walletPerformance += finalResult;
    }

    if (chainIndexFound != -1) {
      walletPerformance = `Assets Worth: 💲${walletWorth}\nTotal Token Holding: 💰 ${walletTokens.length}\n\n\n`;

      walletTokens.map((walletToken, index) => {
        walletPerformance += `• ${walletToken.name}: ${walletToken.balance} ($${walletToken.worth})\n`;
      });
    }

    // ***************************************************************
    // //////////////////// SENDING MESSAGES /////////////////////////
    // ***************************************************************

    await userAlice.chat.send(receiver, {
      type: "Text",
      content: `${walletPerformance}`,
    });

    if (walletTokens.length > 35) {
      await userAlice.chat.send(receiver, {
        type: "Text",
        content: `⚠️You have ${walletTokens.length} tokens, which is too many for a pie chart. Here are the top 35 tokens in your wallet.`,
      });
    }

    await userAlice.chat.send(receiver, {
      type: "Image",
      content: `{"content":"${pieChartURI}"}`,
    });

    // **************************************************************
  } catch (error) {
    await userAlice.chat.send(receiver, {
      type: "Text",
      content: `${
        error.message
          ? error.message
          : "Something went wrong. Try again after some time!"
      }`,
    });
  }
};
