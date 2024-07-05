// ***************************************************************
// /////////////////// Build Pie chart /////////////////////
// ***************************************************************
// As a part of token holding, we use ChartJS to generate a pie chart distribution for users 
// This helps them visualize their asset holding instead of reading bunch of numbers

import ChartJSImage from "chart.js-image";

export const buildChart = async (tokensData) => {
  try {
    const totalTokenHolding = Number(tokensData.totalTokens);
    const tokenNames = [],
      holdingPercentage = [];

    tokensData.tokensInfo.map((token) => {
      tokenNames.push(token.name);

      const tokenHoldingPercent = (
        (Number(token.balance) / totalTokenHolding) *
        100
      ).toFixed(2);
      holdingPercentage.push(tokenHoldingPercent);
    });

    // Build the pie chart data
    // For more information of configuration options, please refer: https://www.chartjs.org/docs
    const data = {
      labels: tokenNames,
      datasets: [
        {
          label: "Portfolio",
          data: holdingPercentage,
          backgroundColor: [
            "rgb(255, 99, 132)",
            "rgb(54, 162, 235)",
            "rgb(255, 205, 86)",
            "rgb(89, 61, 232)",
            "rgb(61, 106, 86)",
            "rgb(61, 232, 86)",
            "rgb(94, 250, 26)",
            "rgb(191, 250, 26)",
            "rgb(250, 123, 26)",
          ],
          hoverOffset: 4,
        },
      ],
    };

    const config = {
      type: "pie",
      data: data,
    };
    
    const line_chart = ChartJSImage().chart(config);

    // Get base64 encoded image
    const chartBase64 = await line_chart.toDataURI()

    return chartBase64;

  } catch (error) {
    return { error: true, message: "Error while building chart!" };
  }
};





