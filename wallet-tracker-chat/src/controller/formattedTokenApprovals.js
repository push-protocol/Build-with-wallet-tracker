import { getTokenApprovals } from "../apis/getTokenApprovals.js";

export const formattedTokenApprovals = async (address, chainIndexFound) => {
  try {
    const data = await getTokenApprovals(address, chainIndexFound);
    let totalApprovals = 0,
      totalApprovalsTemp = 0;

    if (data.error) {
      return { error: true, message: data.message };
    }

    if (chainIndexFound == -1) {
      let chainWiseTokens = data?.data;

      const keys = Object.keys(chainWiseTokens);

      keys.forEach((key) => {
        const tokenValues = chainWiseTokens[key];
        let notificationContent = "";

        for (let i = 0; i < tokenValues.length; i++) {
          const token = tokenValues[i];

          if (
            !token.ticker_symbol ||
            !token.balance_quote ||
            token.balance_quote === 0
          ) {
            continue;
          }

          // Convert value_at_risk to a readable format
          const valueAtRisk =
            Number(token.value_at_risk) / Math.pow(10, token.contract_decimals);

          // Format the notification line
          const line =
            `${i + 1}. ${token.token_address_label}: ` +
            `${valueAtRisk.toFixed(2)} ${token.ticker_symbol} (${
              token.pretty_value_at_risk_quote
            })\n`;

          notificationContent += line;
          totalApprovalsTemp ++;
        }

        chainWiseTokens[key] = notificationContent;
      });

      totalApprovals = totalApprovalsTemp;
      totalApprovalsTemp = 0;

      return {
        error: false,
        tokensInfo: chainWiseTokens,
        totalApprovals,
      };
    }

    let notificationContent = "";

    for (let i = 0; i < data?.data?.length; i++) {
      const token = data.data[i];

      if (
        !token.ticker_symbol ||
        !token.balance_quote ||
        token.balance_quote === 0
      ) {
        continue;
      }

      // Convert value_at_risk to a readable format
      const valueAtRisk =
        Number(token.value_at_risk) / Math.pow(10, token.contract_decimals);

      // Format the notification line
      const line =
        `${i + 1}. ${token.token_address_label}: ` +
        `${valueAtRisk.toFixed(2)} ${token.ticker_symbol} (${
          token.pretty_value_at_risk_quote
        })\n`;

      notificationContent += line;
      totalApprovalsTemp++;
    }

    totalApprovals = totalApprovalsTemp;
    totalApprovalsTemp = 0;

    return {
      error: false,
      tokensInfo: notificationContent,
      totalApprovals,
    };
  } catch (error) {
    return {
      error: true,
      message:
        "Something went wrong while formatting your token approvals! Try again or contact owner!",
    };
  }
};
