import { formattedTokenApprovals } from "../controller/formattedTokenApprovals.js";

export const command_approvals = async (
  params,
  receiver,
  userAlice,
  resolvedAddress,
  chainIndexFound
) => {
  try {
    let walletData, walletApprovals = "", totalArrovals;

    if (params.length == 2) {
      // All chains
      chainIndexFound = -1;

      walletData = await formattedTokenApprovals(
        resolvedAddress,
        chainIndexFound
      );

      if (walletData.error) {
        throw {
          message: `${walletData.message}`,
        };
      }

      const data = walletData.tokensInfo;
      totalArrovals = walletData.totalApprovals;

      let formattedString = "";

      for (const [key, value] of Object.entries(data)) {
        if (value.length > 0) {
          // Check if the value is not empty
          formattedString += `• ${key}\n${value}\n`; // Append the chain and its balances
        }
      }

      walletApprovals += formattedString.trim();
    }

    if (params.length == 3) {
      walletData = await formattedTokenApprovals(
        resolvedAddress,
        chainIndexFound
      );

      if (walletData.error) {
        throw {
          message: `${walletData.message}`,
        };
      }

      const data = walletData.tokensInfo;
      totalArrovals = walletData.totalApprovals;

      walletApprovals += data;
    }

    // ***************************************************************
    // //////////////////// SENDING MESSAGES /////////////////////////
    // ***************************************************************

    await userAlice.chat.send(receiver, {
      type: "Text",
      content: `Total Active Approvals: ✅ ${totalArrovals}\n\n${walletApprovals}\nRevoke unwanted approvals in https://revoke.cash/`,
    });
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