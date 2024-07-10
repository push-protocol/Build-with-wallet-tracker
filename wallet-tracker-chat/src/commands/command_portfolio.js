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
    let walletData, pieChartURI;

    if (params.length == 2) {
      // All chains
      chainIndexFound = -1;
      walletData = await formattedWalletBalance(
        resolvedAddress,
        chainIndexFound
      );

      pieChartURI = await buildChart(walletData);
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
      walletPerformance = `Total Assets Worth: 💲${walletWorth}\n\n\n`;
    }

    if (chainIndexFound != -1) {
      walletPerformance = `Assets Worth: 💲${walletWorth}\n\n\n`;
    }

    walletTokens.map((walletToken, index) => {
      walletPerformance += `• ${walletToken.name}: ${walletToken.balance} ($${walletToken.worth})\n`;
    });

    // ***************************************************************
    // //////////////////// SENDING MESSAGES /////////////////////////
    // ***************************************************************

    await userAlice.chat.send(receiver, {
      type: "Text",
      content: `${walletPerformance}`,
    });

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
