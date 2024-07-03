import axios from "axios";
import moment from "moment";

import 'dotenv/config'

import { capitalizeEveryWordLetter } from "../utils/capitalize.js";


const COINDAR_API_KEY = process.env.COINDAR_API_KEY;

export const getCryptoEvents = async (tokensHolding, noOfDays) => {
  try {
    // Get all token IDs from Coindar
    const response = await axios.get(
      `https://coindar.org/api/v2/coins?access_token=${COINDAR_API_KEY}`
    );
    const coins = response.data;

    // add coinIds for a user for all tokens he holds
    const symbolSet = new Set();
    const coinIds = coins
      .filter((coin) => {
        if (
          tokensHolding.includes(coin.symbol) &&
          !symbolSet.has(coin.symbol)
        ) {
          symbolSet.add(coin.symbol);
          return true;
        }
        return false;
      })
      .map((coin) => coin.id);

    // initiliaze today and tomorrow date for fetching events with 24h interval
    const todayDate = moment().format("YYYY-MM-DD");
    const tomorrowDate = moment().add(noOfDays, "days").format("YYYY-MM-DD");

    const eventsResponse = await axios.get(
      `https://coindar.org/api/v2/events?access_token=${COINDAR_API_KEY}&filter_date_start=${todayDate}&filter_date_end=${tomorrowDate}&filter_coins=${coinIds}&sort_by=views&order_by=1`
    );

    const events = eventsResponse.data;

    let eventArray = [];

    // map events found for one user and send a notificiation one by one
    events.map(async (event) => {
      //format title and body
      const words = event.source.split("-");
      let urlParts = words[0].split("/");
      let lastPart = urlParts[urlParts.length - 1];
      words[0] = lastPart;
      const titleArr = words.slice(0, words.length - 1);
      const formattedTitle = capitalizeEveryWordLetter(titleArr);

      // find relative time
      const eta = moment(event.date_start, "YYYY-MM-DD HH:mm").fromNow();
      let etaMessage = "";
      if (eta.indexOf("ago")) {
        etaMessage = "Ended " + eta;
      } else {
        etaMessage = "Starts in " + eta;
      }

      eventArray.push(formattedTitle);
    });

    return { error: false, cryptoEvents: eventArray }

  } catch (error) {
    return { error: true, message: "Error while fetching crypto events!" };
  }
};

