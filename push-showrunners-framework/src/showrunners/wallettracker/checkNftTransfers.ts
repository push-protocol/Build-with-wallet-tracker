import { ethers } from "ethers";
import { CovalentClient } from "@covalenthq/client-sdk";
import { CONSTANTS, payloads, PushAPI } from "@pushprotocol/restapi";
import { keys } from "./wallettrackerKeys";
import { settings } from "./wallettrackerSettings";
import wtChannel from "./wallettrackerChannel";
import { Container } from "typedi";
import client from "@covalenthq/client-sdk";
import { userNftTimestampModel } from "./wallettrackerModel";
import axios from "axios";
import { ConnectionStates } from "mongoose";
const channelAddress = settings.channelAddress;

//Update Data
const channel = Container.get(wtChannel);

export async function checkNftTransfers() {
  try {
    const client = new CovalentClient(settings.covalentApiKey);
    //  channel.logInfo("Key:",settings.covalentApiKey);
    const title = `Daily Nft Transfers`;
    const message = `Here comes your Nft transaction history for today`;
    let cta;
    channel.logInfo("7---Fetching NFT Transfers----7");
    // Initializing userAlice
    const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);

    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
    });

    const userAliceSubscribers = await PushAPI.initialize(null, {
      env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
      account: settings.channelAddress,
    });

    let hasMoreSubscribers = true;
    let currenttDate = new Date();
    let currentTimestamp = new Date().getTime(); // Convert to timestamp
    // let currentTimestamp = 1612577630; // Convert to timestamp

    let page = 1;
    let lastTimestamp = await userNftTimestampModel.find({ _id: "Transfers" });
    let timeStampToCompare;
    if (lastTimestamp.length === 0) {
      await userNftTimestampModel.create({
        _id: "Transfers",
        lastTimestamp: currentTimestamp,
      });
      timeStampToCompare = currentTimestamp;
    } else {
      timeStampToCompare = lastTimestamp[0].lastTimestamp.getTime();
    }
    // const timeStampToCompare = 1712577630;
    console.log("Current Timestamp :", currentTimestamp);
    console.log("timeStampToCompare : ", timeStampToCompare);

    while (hasMoreSubscribers) {
      console.log("Entering While Loop");
      const userData: any = await userAliceSubscribers.channel.subscribers({
        page: page,
        limit: 30,
        setting: true,
        channel: settings.channelAddress,
      });

      if (userData.itemcount > 0) {
        const subscribers = userData.subscribers;
        for (let j = 0; j < subscribers.length; j++) {
          if (subscribers[j].settings !== null) {
            // change 1 to 3 on prod
            const chSettings = JSON.parse(subscribers[j].settings)[1];
            if (chSettings.user === true) {
              let userToCheck = subscribers[j].subscriber;
              let balance = await axios.get(
                `https://api.etherscan.io/api?module=account&action=tokennfttx&address=${userToCheck}&page=1&offset=100&sort=asc&apikey=${settings.etherscanApiKey}`
              );

              // Function to create a delay
              const delay = (ms: number) =>
                new Promise((resolve) => setTimeout(resolve, ms));

              // Iterate through each transaction
              for (const transaction of balance.data.result) {
                // Compare timeStamp with currentTimestamp
                if (parseInt(transaction.timeStamp) > timeStampToCompare) {
                  // Log the tokenSymbol, value, from, to address, and timestamp

                  let payload;
                  if (transaction.from == userToCheck) {
                    let date = new Date(
                      transaction.timeStamp * 1000
                    ).toDateString();
                    payload = `You have sent [s:${transaction.tokenName}(${
                      transaction.tokenSymbol
                    })] to ${transaction.to.substring(
                      0,
                      4
                    )}...${transaction.to.substring(
                      transaction.to.length - 4
                    )} on ${date}\n\n<span color="red">Disclamer : NFTs displayed here are fetched from an external API and some names may be misleading</span> [timestamp: ${Math.floor(
                      Date.now() / 1000
                    )}]`;
                  } else {
                    let date = new Date(
                      transaction.timeStamp * 1000
                    ).toDateString();
                    payload = `You have received [s:${transaction.tokenName}(${
                      transaction.tokenSymbol
                    })] from ${transaction.from.substring(
                      0,
                      4
                    )}...${transaction.from.substring(
                      transaction.from.length - 4
                    )} on ${date}\n\n<span color="red">Disclamer : NFTs displayed here are fetched from an external API and some names may be misleading</span> [timestamp: ${Math.floor(
                      Date.now() / 1000
                    )}]`;
                  }
                  let tx = transaction.hash;
                  let cta = `https://etherscan.io/tx/${tx}`;
                  console.log(
                    "Sending payload to ",
                    userToCheck,
                    "Payload length ",
                    payload.length
                  );
                  await userAlice.channel.send([`${userToCheck}`], {
                    notification: { title: title, body: message },
                    payload: {
                      title: title,
                      body: payload,
                      cta: cta,
                    },
                    channel: `eip155:1:${settings.channelAddress}`,
                  });

                  // Delay to respect the rate limit
                  await delay(200); // 200 ms delay to allow 5 requests per second
                }
              }
            }
          }
        }
        page++; // Increment the page number
      } else {
        await userNftTimestampModel.updateOne(
          { _id: "Transfers" },
          { lastTimestamp: currentTimestamp }
        );
        hasMoreSubscribers = false; // Exit the loop when there are no more subscribers
      }
    }
  } catch (error) {
    channel.logInfo(`Error in FetchBalanceMain : ${error}`);
  }
}
