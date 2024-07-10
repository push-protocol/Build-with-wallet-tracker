import { walletPerformance } from "../controller/walletPerformance.js";

export const command_performance = async (noOfDays, receiver, userAlice, resolvedAddress, chainIndexFound) => {
  const { imageURI } = await walletPerformance(
    resolvedAddress,
    chainIndexFound,
    noOfDays
  );

  // ***************************************************************
  // //////////////////// SENDING MESSAGES /////////////////////////
  // ***************************************************************

  await userAlice.chat.send(receiver, {
    type: "Image",
    content: `{"content":"${imageURI}"}`,
  });

  // **************************************************************
};
