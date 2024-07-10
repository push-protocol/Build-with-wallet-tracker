import { getTopNfts } from "../controller/getTopNfts.js";

export const command_topNfts = async (
  receiver,
  userAlice,
  resolvedAddress,
  chainIndexFound,
  noOfNfts
) => {
    
  // Checks ends here
  await userAlice.chat.send(receiver, {
    type: "Text",
    content: `Please wait as this command might take some time!\nTill then did you do the laundry your mom asked you to?`,
  });

  // Main logic
  const response = await getTopNfts(resolvedAddress, chainIndexFound, noOfNfts);

  // ***************************************************************
  // //////////////////// SENDING MESSAGES /////////////////////////
  // ***************************************************************

  // Send NFTs and name
  for (let i = 0; i < response.length; i++) {
    const nft = response[i];

    await userAlice.chat.send(receiver, {
      type: "Text",
      content: `🖼️NFT Name: ${nft.name}`,
    });

    await userAlice.chat.send(receiver, {
      type: "Image",
      content: `{"content":"${nft.imageBase64}"}`,
    });

    console.log("Text & Image sent successfully");
  }

  // **************************************************************
};
