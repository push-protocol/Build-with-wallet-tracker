import "dotenv/config";

import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";
import { ethers } from "ethers";

import { formattedWalletBalance } from "./src/controller/formattedWalletBalance.js";
import { getTopNfts } from "./src/controller/getTopNfts.js";

import { checkValidWalletAddress } from "./src/utils/checkValidWalletAddress.js";
import { resolveENS } from "./src/utils/resolveENS.js";
import { resolveUD } from "./src/utils/resolveUD.js";

import { getCryptoEvents } from "./src/apis/getCryptoEvents.js";

import { buildChart } from "./src/utils/buildChart.js";

import { walletPerformance } from "./src/controller/walletPerformance.js";

// ***************************************************************
// /////////////////// INITIALIZE USER ALICE /////////////////////
// ***************************************************************

const provider = new ethers.JsonRpcProvider(
  `${process.env.ETHEREUM_RPC_PROVIDER}`
);
const signer = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, provider);
console.log("Signer: ", signer);

const userAlice = await PushAPI.initialize(signer, {
  env: CONSTANTS.ENV.PROD,
});

if (userAlice.errors.length > 0) {
  // Handle Errors Here
}


// ***************************************************************
// ////////////////////// AVAILABLE COMMANDS /////////////////////
// ***************************************************************

const COMMANDS = [
  "/portfolio",
  "/help",
  "/calendar",
  "/performance",
  "/topnfts",
];


// ***************************************************************
// ////////////////////// AVAILABLE CHAINS ///////////////////////
// ***************************************************************

const CHAINS = ["eth", "pol", "bsc", "arb", "polzk"];


// ***************************************************************
// /////////////////// WELCOME & HELP MESSAGES ///////////////////
// ***************************************************************

const WELCOME_MESSAGE = "Welcome to Wallet Tracker🎊\n";

const HELP_MESSAGE = `To best use this tool, you can use the following command(s)👇\n1. /portfolio [wallet address] [chain] - To get you current token holding and asset valuation on specified chain. Chain options: "eth", "pol", "bsc", "arb", "polzk". If not specified, you'll get the portfolio across all 5 chains\n2. /calendar [number of days] - To get crypto events organized by your favorite tokens within number of days\n3. /performance [your wallet address] [no of days] [chain] - To get your wallet performance across the given days.\nWe are constantly working on it and adding new features.\n4. /topnfts [your wallet address] [no of results] [chain] - To get the top recent NFTs in your wallet. Chain options: "eth", "pol", "bsc", "arb". No of results should positive integer less than 10\nType '/help' to get the latest available commands and responses.`;


// ***************************************************************
// /////////////////// INITIALIZE CHAT STREAM ////////////////////
// ***************************************************************
/*
  FOR MORE DETAILS ON CHAT STREAMS AND CONFIGURATION OPTIONS, PLEASE REFER: https://push.org/docs/chat/build/stream-chat/
*/

const stream = await userAlice.initStream(
  [
    CONSTANTS.STREAM.CHAT, // Listen for chat messages
    CONSTANTS.STREAM.NOTIF, // Listen for notifications
    CONSTANTS.STREAM.CONNECT, // Listen for connection events
    CONSTANTS.STREAM.DISCONNECT, // Listen for disconnection events
  ],
  {
    filter: {
      channels: ["*"],
      chats: ["*"],
    },
    // Connection options:
    connection: {
      retries: 3, // Retry connection 3 times if it fails
    },
    raw: false, // Receive events in structured format
  }
);


// ***************************************************************
// /////////////////// SETUP EVENT LISTENERS /////////////////////
// ***************************************************************

// Stream connection established:
stream.on(CONSTANTS.STREAM.CONNECT, async (a) => {
  console.log("Stream Connected");

  // Send initial message to PushAI Bot:
  console.log("Sending message to Wallet Tracker Bot");
});

// Chat message received:
stream.on(CONSTANTS.STREAM.CHAT, async (message) => {
  try {
    console.log("Encrypted Message Received");

    if (message.event == "chat.request") {
      await userAlice.chat.accept(message.from);
    }

    if (message.origin === "self") {
      console.log("Ignoring the message...");
      return;
    }

    if (!message.message.content) {
      throw {
        message:
          "Couldn't read the last message💥.\n Try again after some time!",
      };
    }

    const params = message.message.content.split(" ");
    const command = params[0];

    // COMMAND 0: Welcome message
    if (!COMMANDS.includes(command.toLowerCase())) {
      throw {
        message: `${WELCOME_MESSAGE}${HELP_MESSAGE}`,
      };
    }

    // COMMAND 1: /help
    if (command == COMMANDS[1].toString()) {
      if (params.length != 1) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\nportfolio [your wallet address]`,
        };
      }

      // ***************************************************************
      // //////////////////// SENDING MESSAGES /////////////////////////
      // ***************************************************************

      await userAlice.chat.send(message.from, {
        type: "Text",
        content: `${HELP_MESSAGE}`,
      });

      // **************************************************************
    }

    // COMMAND 2: /portfolio
    if (command == COMMANDS[0].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      if (params.length != 2 && params.length != 3) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/portfolio [your wallet address] [chain]`,
        };
      }

      let chainIndexFound;

      if (params.length == 3) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[2]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"\n4. Arbitrum Mainnet - "arb"\n5. Polygon zkEVM Mainnet - "polzk"`,
          };
        }
      }

      const address = params[1];

      let resolvedAddress = "";
      resolvedAddress = address;

      if (address.substring(0, 2) !== "0x") {
        resolvedAddress = await resolveENS(address);

        if (resolvedAddress.error) {
          resolvedAddress = await resolveUD(address);

          if (resolvedAddress.error) {
            throw {
              message: `Invalid domain⚠️\nCheck your domain name`,
            };
          }
        }
      }

      if (!checkValidWalletAddress(resolvedAddress)) {
        throw {
          message: `Invalid address⚠️\nCheck your wallet address`,
        };
      }

      // ***************************************************************
      // //////////////////////// CHECKS END /////////////////////////
      // ***************************************************************

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

      await userAlice.chat.send(message.from, {
        type: "Text",
        content: `${walletPerformance}`,
      });

      await userAlice.chat.send(message.from, {
        type: "Image",
        content: `{"content":"${pieChartURI}"}`,
      });

      // **************************************************************
    }

    // COMMAND 3: /calendar
    if (command == COMMANDS[2].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      if (params.length != 2) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/calendar [number of days]`,
        };
      }

      const noOfDays = Number(params[1]);

      if (typeof noOfDays != "number" || noOfDays < 0) {
        throw {
          message:
            "Parameter should be an positive number. Please again again with a positive number.",
        };
      }

      // ***************************************************************
      // //////////////////////// CHECKS END /////////////////////////
      // ***************************************************************

      // Error from covalent
      const walletData = await formattedWalletBalance(message.from.slice(7));

      if (walletData.error) {
        throw {
          message: `${walletData.message}`,
        };
      }

      if (walletData.tokensInfo.length == 0) {
        throw {
          message:
            "There are no tokens in your wallet. Try a different wallet!!",
        };
      }

      const walletTokens = walletData.tokensInfo;
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

      await userAlice.chat.send(message.from, {
        type: "Text",
        content: `${eventsMessage}`,
      });

      // **************************************************************
    }

    // COMMAND 4: /performance
    if (command == COMMANDS[3].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      if (params.length != 3 && params.length != 4) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/performance [your wallet address] [no of days] [chain] (optional)`,
        };
      }

      let chainIndexFound = -1;

      if (params.length == 4) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[3]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"\n4. Arbitrum Mainnet - "arb"\n5. Polygon zkEVM Mainnet - "polzk"`,
          };
        }
      }

      const address = params[1];
      const noOfDays = Number(params[2]);

      if (isNaN(noOfDays) || noOfDays < 0) {
        throw {
          message: `Invalid number of days⚠️\nPlease enter a positive integer`,
        };
      }

      let resolvedAddress = "";
      resolvedAddress = address;

      if (address.substring(0, 2) !== "0x") {
        resolvedAddress = await resolveENS(address);

        if (resolvedAddress.error) {
          resolvedAddress = await resolveUD(address);

          if (resolvedAddress.error) {
            throw {
              message: `Invalid domain⚠️\nCheck your domain name`,
            };
          }
        }
      }

      if (!checkValidWalletAddress(resolvedAddress)) {
        throw {
          message: `Invalid address⚠️\nCheck your wallet address`,
        };
      }

      // ***************************************************************
      // //////////////////////// CHECKS END /////////////////////////
      // ***************************************************************

      const { imageURI } = await walletPerformance(
        resolvedAddress,
        chainIndexFound,
        noOfDays
      );

      // ***************************************************************
      // //////////////////// SENDING MESSAGES /////////////////////////
      // ***************************************************************

      await userAlice.chat.send(message.from, {
        type: "Image",
        content: `{"content":"${imageURI}"}`,
      });

      // **************************************************************
    }

    // COMMAND 5: /top nfts
    if (command == COMMANDS[4].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      // Checks start here
      if (params.length != 4 && params.length != 4) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/topnfts [your wallet address] [no of results] [chain]`,
        };
      }

      let chainIndexFound = -1;

      if (params.length == 4) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[3]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"\n4. Arbitrum Mainnet - "arb"`,
          };
        }
      }

      const address = params[1];
      const noOfNfts = Number(params[2]);

      if (isNaN(noOfNfts) || noOfNfts > 10) {
        throw {
          message: `Invalid number of nfts⚠️\nPlease enter a positive integer less than 10`,
        };
      }

      let resolvedAddress = "";
      resolvedAddress = address;

      if (address.substring(0, 2) !== "0x") {
        resolvedAddress = await resolveENS(address);

        if (resolvedAddress.error) {
          resolvedAddress = await resolveUD(address);

          if (resolvedAddress.error) {
            throw {
              message: `Invalid domain⚠️\nCheck your domain name`,
            };
          }
        }
      }

      if (!checkValidWalletAddress(resolvedAddress)) {
        throw {
          message: `Invalid address⚠️\nCheck your wallet address`,
        };
      }

      // ***************************************************************
      // //////////////////////// CHECKS END /////////////////////////
      // ***************************************************************

      // Checks ends here
      await userAlice.chat.send(message.from, {
        type: "Text",
        content: `Please wait as this command might take some time!\nTill then did you do the laundry your mom asked you to?`,
      });

      // Main logic
      const response = await getTopNfts(
        resolvedAddress,
        chainIndexFound,
        noOfNfts
      );

      // ***************************************************************
      // //////////////////// SENDING MESSAGES /////////////////////////
      // ***************************************************************

      // Send NFTs and name
      for (let i = 0; i < response.length; i++) {
        const nft = response[i];

        await userAlice.chat.send(message.from, {
          type: "Text",
          content: `🖼️NFT Name: ${nft.name}`,
        });

        await userAlice.chat.send(message.from, {
          type: "Image",
          content: `{"content":"${nft.imageBase64}"}`,
        });

        console.log("Text & Image sent successfully");
      }

      // **************************************************************
    }

  } catch (error) {
    await userAlice.chat.send(message.from, {
      type: "Text",
      content: `${
        error.message
          ? error.message
          : "Something went wrong. Try again after some time!"
      }`,
    });
  }
});

// Chat operation received:
stream.on(CONSTANTS.STREAM.CHAT_OPS, (data) => {
  console.log("Chat operation received.");
});

// Stream disconnection:
stream.on(CONSTANTS.STREAM.DISCONNECT, async () => {
  console.log("Stream Disconnected");
});


// ***************************************************************
// //////////////////// CONNECT THE STREAM ///////////////////////
// ***************************************************************

await stream.connect(); // Establish the connection after setting up listeners

