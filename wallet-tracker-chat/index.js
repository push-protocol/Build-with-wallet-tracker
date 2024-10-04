import "dotenv/config";

import { pm2Automation } from "./pm2Restart.js";

import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";
import { ethers } from "ethers";

import { checkValidWalletAddress } from "./src/utils/checkValidWalletAddress.js";
import { resolveENS } from "./src/utils/resolveENS.js";
import { resolveUD } from "./src/utils/resolveUD.js";

import { command_portfolio } from "./src/commands/command_portfolio.js";
import { command_performance } from "./src/commands/command_performance.js";
import { command_topNfts } from "./src/commands/command_topNfts.js";
import { command_calendar } from "./src/commands/command_calendar.js";
import { command_approvals } from "./src/commands/command_approvals.js";
import { command_topYields } from "./src/commands/command_topYields.js";

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
  "/approvals",
  "/topyields",
];

// ***************************************************************
// ////////////////////// AVAILABLE CHAINS ///////////////////////
// ***************************************************************

const CHAINS = ["eth", "pol", "bsc"];

// ***************************************************************
// /////////////////// WELCOME & HELP MESSAGES ///////////////////
// ***************************************************************

const WELCOME_MESSAGE = "Welcome to Wallet Tracker🎊\n";

const HELP_MESSAGE = `To best use this tool, you can use the following commands👇:\n1. 🪙: /portfolio [wallet address] [chain] (optional) - Get your current token holdings and asset valuation on a specified chain. Chain options: 'eth', 'pol', 'bsc'. If not specified, you'll get the portfolio across all 5 chains.\n2. 🗓️: /calendar [number of days] - Get crypto events organized by your favorite tokens within the specified number of days.\n3. 📈: /performance [your wallet address] [no of days] [chain] (optional) - Get your wallet performance across the given days.\n4. 🎨: /topnfts [your wallet address] [chain] (required) - Get the top recent NFTs in your wallet. Chain options: 'eth', 'pol', 'bsc'. Number of results should be a positive integer less than 10.\n5. ✅: /approvals [wallet address] [chain] (optional) - Get your current token approvals on a specified chain. Chain options: 'eth', 'pol', 'bsc'. If not specified, you'll get the approvals across all 5 chains.\n6. 📈: /topyields [address] [chain](optional) - Get top platforms providing best APRs as per portfolio.\nWe are constantly working on it and adding new features.\nType ⚠️ '/help' to get the latest available commands and responses.`;

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
    if (command.toLowerCase() == COMMANDS[1].toString()) {
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
    if (command.toLowerCase() == COMMANDS[0].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      if (params.length != 2 && params.length != 3) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/portfolio [your wallet address] [chain]`,
        };
      }

      let chainIndexFound = -1;

      if (params.length == 3) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[2]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"`,
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

      const receiver = message.from;
      await command_portfolio(
        params,
        receiver,
        userAlice,
        resolvedAddress,
        chainIndexFound
      );
    }

    // COMMAND 3: /calendar
    if (command.toLowerCase() == COMMANDS[2].toString()) {
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

      const receiver = message.from;
      await command_calendar(receiver, userAlice, noOfDays);
    }

    // COMMAND 4: /performance
    if (command.toLowerCase() == COMMANDS[3].toString()) {
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
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"`,
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

      const receiver = message.from;
      await command_performance(
        noOfDays,
        receiver,
        userAlice,
        resolvedAddress,
        chainIndexFound
      );
    }

    // COMMAND 5: /top nfts
    if (command.toLowerCase() == COMMANDS[4].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      // Checks start here
      if (params.length != 3 && params.length != 3) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/topnfts [your wallet address] [chain]`,
        };
      }

      let chainIndexFound = -1;

      if (params.length == 3) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[2]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"\n4. Arbitrum Mainnet - "arb"`,
          };
        }
      }

      const address = params[1];
      const noOfNfts = 10;

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

      const receiver = message.from;
      await command_topNfts(
        receiver,
        userAlice,
        resolvedAddress,
        chainIndexFound,
        noOfNfts
      );
    }
    
    // COMMAND 5: /approvals
    if (command.toLowerCase() == COMMANDS[5].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      if (params.length != 2 && params.length != 3) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/approvals [your wallet address] [chain]`,
        };
      }

      let chainIndexFound = -1;

      if (params.length == 3) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[2]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"`,
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

      const receiver = message.from;
      await command_approvals(
        params,
        receiver,
        userAlice,
        resolvedAddress,
        chainIndexFound
      );
    }

    // COMMAND 6: /top yields
    if (command.toLowerCase() == COMMANDS[6].toString()) {
      // ***************************************************************
      // //////////////////////// CHECKS START /////////////////////////
      // ***************************************************************

      if (params.length != 2 && params.length != 3) {
        throw {
          message: `Invalid parameters count⚠️\nPlease follow the specific format:\n/topyields [address] [chain](optional)`,
        };
      }

      let chainIndexFound = -1;

      if (params.length == 3) {
        chainIndexFound = CHAINS.findIndex((chain) => chain == params[2]);

        if (chainIndexFound == -1) {
          throw {
            message: `Invalid chain⚠️\nPlease select one from these supported chains:\n1. Ethereum Mainnet - "eth"\n2. Polygon Mainnet - "pol"\n3. Binance Smart Chain - "bsc"`,
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

      const receiver = message.from;
      await command_topYields(
        params,
        receiver,
        userAlice,
        resolvedAddress,
        chainIndexFound
      );
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

  // For autorestart chat streams once disconnected. Works with Pm2
  // pm2Automation();
});

// ***************************************************************
// //////////////////// CONNECT THE STREAM ///////////////////////
// ***************************************************************

await stream.connect(); // Establish the connection after setting up listeners
