import { ethers } from 'ethers';
import { CovalentClient } from "@covalenthq/client-sdk";
import { CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import {settings} from './wallettrackerSettings';
import axios from 'axios';
import moment from 'moment';
import wtChannel from './wallettrackerChannel';
import { Container } from 'typedi';

export async function sendEventInfo(){
    {
        const client = new CovalentClient(settings.covalentApiKey);
        const channel = Container.get(wtChannel);
        // Initlaize user Alice
        const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
        const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
        const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV.PROD });
        let i = 1;
  
        while (true) {
          const userData: any = await userAlice.channel.subscribers({
            page: i,
            limit: 15,
            setting: true,
            channel: settings.channelAddress
          });
          if (userData.itemcount != 0) {
            userData.subscribers.map(async (user) => {

              if (user.settings !== null) {
                // console.log(subscribers[j]); // Changed from [i] to [j]
                const chSettings = JSON.parse(user.settings)[4];
                if (chSettings.user === true) {
                     // send notif
                 // get all tokens held by a user
                 const resp = await client.BalanceService.getTokenBalancesForWalletAddress('eth-mainnet', user.subscriber);
                 let tokensHolding = [];
                 if (!resp.error) {
                   let items = resp.data.items;
       
                   items.map((item: any) => {
                     const balance = item.balance;
                     const symbol = item.contract_ticker_symbol;
                     if (balance !== '0' && symbol !== null) {
                       tokensHolding.push(symbol);
                     }
                   });
       
                   // get all token IDs from Coindar
                   let response: any = await axios.get(
                     `https://coindar.org/api/v2/coins?access_token=${settings.coindarApiKey}`,
                   );
                   const coins = response.data;
       
                   // add coinIds for a user for all tokens he holds
                   const symbolSet = new Set();
                   const coinIds = coins
                     .filter((coin) => {
                       if (tokensHolding.includes(coin.symbol) && !symbolSet.has(coin.symbol)) {
                         symbolSet.add(coin.symbol);
                         return true;
                       }
                       return false;
                     })
                     .map((coin) => coin.id);
       
                   // initiliaze today and tomorrow date for fetching events with 24h interval  
                   const todayDate = moment().format('YYYY-MM-DD');
                const tomorrowDate = moment().add(1, 'days').format('YYYY-MM-DD');
       
                   // @dev: use channel for testing
                   // response = await axios.get(
                   //   `https://coindar.org/api/v2/events?access_token=${settings.coindarApiKey}&filter_date_start=2024-02-01&filter_date_end=2024-05-14&filter_coins=${coinIds}&sort_by=views&order_by=1`,
                   // );
       
                   response = await axios.get(
                       `https://coindar.org/api/v2/events?access_token=${settings.coindarApiKey}&filter_date_start=${todayDate}&filter_date_end=${tomorrowDate}&filter_coins=${coinIds}&sort_by=views&order_by=1`,
                     );
       
                   const events = response.data;
       
                   // map events found for one user and send a notificiation one by one
                   events.map(async (event) => {
                     
                     //format title and body
                     const words = event.source.split('-');
                     let urlParts = words[0].split('/');
                     let lastPart = urlParts[urlParts.length - 1];
                     words[0] = lastPart;
                     const titleArr = words.slice(0, words.length - 1);
                     const formattedTitle = channel.capitalizeEveryWordLetter(titleArr);
                     
                     // find relative time
                     const eta = moment(event.date_start, 'YYYY-MM-DD HH:mm').fromNow();
                     let etaMessage = '';
                     if(eta.indexOf('ago')) {
                       etaMessage = 'Ended ' + eta;
                     } else {
                       etaMessage = 'Starts in ' + eta;
                     }
                     channel.sendNotificationHelper(event.caption,formattedTitle,`<span color='#457b9d'>Event:</span>${formattedTitle}\n\n${etaMessage} [timestamp: ${Math.floor(Date.now() / 1000)}]`,event.source,user.subscriber);
                      
                   });
                 }       

                }
            }
            });
            i++;
          } else {
            channel.logInfo('Breakkkk.');
            i = 1;
            break;
          }
        }
      }
}