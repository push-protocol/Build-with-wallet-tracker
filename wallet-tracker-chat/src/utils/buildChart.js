// ***************************************************************
// /////////////////// Build Pie chart /////////////////////
// ***************************************************************
// As a part of token holding, we use ChartJS to generate a pie chart distribution for users 
// This helps them visualize their asset holding instead of reading bunch of numbers

import ChartJSImage from "chart.js-image";
import { getColours } from "./colours.js";

export const buildChart = async (tokensData) => {
  try {
    const totalTokenHoldingValuation = Number(tokensData.totalWorth);
    const tokenNames = [],
    valuationPercentage = [];

    // Sort the array in descending order
    tokensData.tokensInfo.sort((a, b) => Number(b.worth) - Number(a.worth));

    // Get the top 3 elements
    let top35Tokens = tokensData.tokensInfo.slice(0, 35);
    
    top35Tokens.map((token) => {
      tokenNames.push(token.name);

      const tokenValuationPercent = (
        (Number(token.worth) / totalTokenHoldingValuation) *
        100
      ).toFixed(2);

      valuationPercentage.push(tokenValuationPercent);
    });

    // Generate colours for pir chart
    const COLOURS = getColours(valuationPercentage.length > 35 ? 35 : valuationPercentage.length);

    // Build the pie chart data
    // For more information of configuration options, please refer: https://www.chartjs.org/docs
    const data = {
      labels: tokenNames,
      datasets: [
        {
          label: "Portfolio",
          data: valuationPercentage,
          backgroundColor: COLOURS,
          hoverOffset: 4,
          borderWidth: 0.5,
        },
      ],
    };

    const config = {
      type: "pie",
      data: data,
    };
    
    const line_chart = ChartJSImage().chart(config);

    // Get base64 encoded image
    const chartBase64 = await line_chart.toDataURI();

    return chartBase64;

  } catch (error) {
    return { error: true, message: "Error while building chart!" };
  }
};





