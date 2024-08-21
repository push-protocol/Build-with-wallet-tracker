import { getCryptoEvents } from "../apis/getCryptoEvents.js";
import { formattedWalletBalance } from "../controller/formattedWalletBalance.js";

export const command_calendar = async (receiver, userAlice, noOfDays) => {
  try {
    // Error from covalent
    const walletData = await formattedWalletBalance(receiver.slice(7), -1);
    console.log("Receiver: ", receiver);

    if (walletData.error) {
      throw {
        message: `${walletData.message}`,
      };
    }

    let allTokensObj = {}, allTokens = [];

    // Merge all the chain tokens
    const keys = Object.keys(walletData.tokensInfo);

    keys.forEach((key) => {
      const tokens = walletData.tokensInfo[key];
      allTokens.push(...tokens);
    });

    allTokensObj = {
      error: false,
      tokensInfo: allTokens,
      totalWorth: walletData.totalWorth,
      totalTokens: walletData.totalTokens,
    };

    if (allTokensObj.tokensInfo.length == 0) {
      throw {
        message: "There are no tokens in your wallet. Try a different wallet!!",
      };
    }

    const walletTokens = allTokensObj.tokensInfo;
    let tokenSymbols = [];

    walletTokens.map((walletToken, index) => {
      tokenSymbols.push(walletToken.name);
    });

    // Get events here
    const { cryptoEvents } = await getCryptoEvents(tokenSymbols, noOfDays);

    if (cryptoEvents.length == 0) {
      throw { message: "No crypto events within the specified days!" };
    }

    const eventsMessage =
      "Here, is the list of events organized📅: \n• " +
      cryptoEvents.join("\n• ");

    // ***************************************************************
    // //////////////////// SENDING MESSAGES /////////////////////////
    // ***************************************************************

    await userAlice.chat.send(receiver, {
      type: "Text",
      content: `${eventsMessage}`,
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
