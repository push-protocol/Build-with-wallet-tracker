// ***************************************************************
// /////////////////// Get Token Approvals ///////////////////////
// ***************************************************************
//  Get data from Covalent API regarding token approvals across platforms

import { CovalentClient } from "@covalenthq/client-sdk";
import "dotenv/config";

const CHAINS = [
  "eth-mainnet",
  "matic-mainnet",
  "bsc-mainnet",
  "arbitrum-mainnet",
  "polygon-zkevm-mainnet",
];

const FORMATTED_CHAINS = [
  "Ethereum",
  "Polygon",
  "Binance",
  "Arbitrum",
  "Polygon zkEVM",
];

const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

export const getTokenApprovals = async (address, chainIndexFound) => {
  try {
    const client = new CovalentClient(COVALENT_API_KEY);

    if (chainIndexFound != -1) {
      // Single Chain
      const resp = await client.SecurityService.getApprovals(
        CHAINS[chainIndexFound].toString(),
        address
      );

      if (resp.error) {
        return { error: true, message: resp.error_message };
      }

      return { error: false, data: resp.data.items };
    } else {
      // For 5 chains
      const resultsObj = {};

      for (let i = 0; i < CHAINS.length; i++) {
        const resp = await client.SecurityService.getApprovals(
          CHAINS[i].toString(),
          address
        );

        if (resp.error) {
          return { error: true, message: resp.error_message };
        }

        // Get a key for the object
        const key = FORMATTED_CHAINS[i].toString();

        // Assign the array values to the object key
        resultsObj[key] = [...resp.data.items];
      }

      return { error: false, data: resultsObj };
    }
  } catch (error) {
    return {
      error: true,
      message: "Error getting token approvals of the wallet!",
    };
  }
};
