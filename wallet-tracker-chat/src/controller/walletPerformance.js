// ***************************************************************
// /////////////////// Format Wallet Performance /////////////////////
// ***************************************************************
// As a part of wallet performance, we use ChartJS to plot a wallet performance graph for users 
// This helps them visualize their wallet activity instead of reading bunch of numbers

import { CovalentClient } from "@covalenthq/client-sdk";

import ChartJSImage from "chart.js-image";

import "dotenv/config";

// Available chains
const CHAINS = [
  "eth-mainnet",
  "matic-mainnet",
  "bsc-mainnet",
  // "arbitrum-mainnet",
  // "polygon-zkevm-mainnet",
];


const QUOTE_CURRENCY = ["USD"];

const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

// Formats date and their corresponding wallet valuation
const processData = (items) => {
  const portfolioData = {};
  items.forEach((item) => {
    item.holdings.forEach((holding) => {
      const date = new Date(holding.timestamp).toISOString().split("T")[0];
      if (!portfolioData[date]) {
        portfolioData[date] = 0;
      }
      portfolioData[date] += holding.close.quote;
    });
  });

  let dates = Object.keys(portfolioData).sort();
  let values = dates.map((date) => portfolioData[date]);

  dates.pop(); // Currency quote is null for the current date
  values.pop(); // Currency quote is null for the current date

  return { error: false, dates, values };
};

export const walletPerformance = async (address, chainIndexFound, noOfDays) => {
  const client = new CovalentClient(COVALENT_API_KEY);

  const allItems = [];

  if (chainIndexFound != -1) {
    // Single Chain
    const resp =
      await client.BalanceService.getHistoricalPortfolioForWalletAddress(
        CHAINS[chainIndexFound].toString(),
        address,
        { quoteCurrency: QUOTE_CURRENCY[0].toString(), days: Number(noOfDays) }
      );

    if (resp.error) {
      return { error: true, message: resp.error_message };
    }

    allItems.push(...resp.data.items);
  } else {
    // For 5 chains

    for (let i = 0; i < CHAINS.length; i++) {
      const resp =
        await client.BalanceService.getHistoricalPortfolioForWalletAddress(
          CHAINS[i].toString(),
          address,
          {
            quoteCurrency: QUOTE_CURRENCY[0].toString(),
            days: Number(noOfDays),
          }
        );

      if (resp.error) {
        return { error: true, message: resp.error_message };
      }

      allItems.push(...resp.data.items);
    }
  }

  const { dates, values } = processData(allItems);

  // Build the line graph
  // For more information of configuration options, please refer: https://www.chartjs.org/docs/latest/charts/line.html
  const labels = dates;
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Portfolio performance",
        data: values,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };
  const config = {
    type: "line",
    data: data,
  };

  const line_chart = ChartJSImage().chart(config);

  // Get base64 encoded image
  const imageURI = await line_chart.toDataURI();

  return { imageURI };
};
