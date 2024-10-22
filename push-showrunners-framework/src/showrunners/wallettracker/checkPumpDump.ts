import axios from "axios";
import { ethers } from "ethers";
import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";
import { keys } from "./wallettrackerKeys";
import { settings } from "./wallettrackerSettings";

import WalletTrackerChannel from "./wallettrackerChannel";
import { Container } from "typedi";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  price_change_percentage_24h: number;
}

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/coins/markets";
const CURRENCY = "usd"; // You can change the currency if needed
const CHAR_LIMIT = 420;

async function fetchTop50Cryptos() {
  try {
    const response = await axios.get(COINGECKO_API_URL, {
      params: {
        vs_currency: CURRENCY,
        order: "market_cap_desc",
        per_page: 51,
        page: 1,
      },
    });
    return response.data as Coin[];
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    return [];
  }
}

async function handlePayload(type: string, payload: string) {
  const channel = Container.get(WalletTrackerChannel);

  // This function handles the pump or dump payload (e.g., send it to an API or log it)
  if (type === "pump") {
    let startingText = `Massive <span color='#00712D'>Gains</span> in a Day`;
    let endingText = `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
    payload = startingText + "\n\n" + payload + "\n" + endingText;
  }

  if (type === "dump") {
    let startingText = `Last-Day Token <span color='#B8001F'>Sell-off</span> Trend`;
    let endingText = `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
    payload = startingText + "\n\n" + payload + "\n" + endingText;
  }
  const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
  const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
  const userAlice = await PushAPI.initialize(signer, {
    env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
  });

  const userAliceSubscribers = await PushAPI.initialize(null, {
    env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
    account: settings.channelAddress,
  });

  let page = 1;
  let hasMoreSubscribers = true;

  while (hasMoreSubscribers) {
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
          channel.logToFile("❄️Settings activated");

          const settings = JSON.parse(subscribers[j].settings)[1]; //Change

          channel.logToFile(`🎂🎂: ${JSON.stringify(settings)}`);

          if (settings.user === true) {
            channel.logToFile("❄️Settings true");

            channel.logToFile(
              `Sending Notification to ${subscribers[j].subscriber}, Payload length ${payload.length}`
            );
            //${subscribers[j].subscriber}
            await userAlice.channel.send([`${subscribers[j].subscriber}`], {
              notification: {
                title: "Is this a PUMP or DUMP, Let’s check out 👇 ",
                body: `Here's a list of tokens that went through pump/dumps`,
              },
              payload: {
                title: `Is this a PUMP or DUMP, Let’s check out 👇 `,
                body: payload,
                cta: "https://www.coingecko.com/",
              },
              channel: `eip155:1:${settings.channelAddress}`,

            });
            channel.logToFile(`Notification sent to ${subscribers[j].subscriber}`);
          }
        }
      }
      page++;
    } else {
      hasMoreSubscribers = false;
    }
  }
}

function analyzePriceChange(cryptos: Coin[]) {
  let pumpPayload = ""; // To store pump messages
  let dumpPayload = ""; // To store dump messages

  cryptos.forEach((coin, index) => {
    const change = coin.price_change_percentage_24h;
    let message = "";
    if (index <21 && change >= 6.5 || index > 21 && change >= 10) {
    // if ((index < 21 && change >= 1) || (index > 21 && change >= 1)) {
      message = `<span color='#FF9100'>${
        coin.name
      }</span> (${coin.symbol.toUpperCase()}) soars <span color='#6256CA'>${change.toFixed(
        2
      )}%</span>\n`;
      // Check if adding this message will exceed the character limit for the pump payload
      if (pumpPayload.length + message.length > CHAR_LIMIT) {
        handlePayload("pump", pumpPayload.trim());
        pumpPayload = "";
      }
      pumpPayload += message;
    // } else if ((index < 21 && change <= -1) || (index > 21 && change <= -1)) {
    } else if (index <21 && change <= -6.5 || index > 21 && change <= -10) {
      message = `<span color='#384B70'>${
        coin.name
      }</span> (${coin.symbol.toUpperCase()}) takes a <span color='#507687'>${change.toFixed(
        2
      )}% dip </span>\n`;
      // Check if adding this message will exceed the character limit for the dump payload
      if (dumpPayload.length + message.length > CHAR_LIMIT) {
        handlePayload("dump", dumpPayload.trim());
        dumpPayload = "";
      }
      dumpPayload += message;
    }

    // Final check to handle remaining pump and dump messages if we're at the last token
    if (index === cryptos.length - 1) {
      if (pumpPayload.length > 0) {
        handlePayload("pump", pumpPayload.trim());
      }
      if (dumpPayload.length > 0) {
        handlePayload("dump", dumpPayload.trim());
      }
    }
  });
}

export async function handlePumpDump() {
  const cryptos = await fetchTop50Cryptos();
  analyzePriceChange(cryptos);
}
