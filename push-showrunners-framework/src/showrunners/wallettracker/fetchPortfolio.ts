import { ethers } from 'ethers';
import { CovalentClient } from "@covalenthq/client-sdk";
import { CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import {settings} from './wallettrackerSettings';
import axios from 'axios';
import wtChannel from './wallettrackerChannel';
import { Container } from 'typedi';
export async function fetchPortfolio(){
    const channel = Container.get(wtChannel);
    const client = new CovalentClient(settings.covalentApiKey);
    console.log("I am Alive");
    const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);

    const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
    const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV.PROD });
    let currentBlockNumber = await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${settings.etherscanApiKey}`);
    let i = 1;

    while (true) {
      const userData: any = await userAlice.channel.subscribers({
        page: i,
        limit: 15,
        channel: settings.channelAddress
      });
      channel.logInfo(`Subscribers in Fetch Portfolio : ${userData}`);
      if (userData.itemcount != 0) {
        userData.subscribers.map(async (user) => {
        //  channel.logInfo("User :", user);
          const resp = await client.BalanceService.getTokenBalancesForWalletAddress("eth-mainnet", user);
          let amount = 0;
          let pushStatus = false;
          let pushAmount = 0;
          if (!resp.error) {

            let items = resp.data.items;
          channel.logInfo(`Response for ${user} in Fetch Portfolio : ${items}`);

            //calculate total potfolio balance
            items.map((item: any) => {
              let tokenBalance = (Number(ethers.utils.formatUnits(item.balance, item.contract_decimals))).toFixed(4);
              if (item.quote_rate * Number(tokenBalance) > 0.5) {
                tokenBalance = tokenBalance.replace(/\.?0+$/, '');
                amount = Number(amount + (item.quote_rate * Number(tokenBalance)));
              //  channel.logInfo("Amount", amount);
                if (item.contract_ticker_symbol == 'PUSH') {
                  pushStatus = true;
                  pushAmount = Number(tokenBalance);
                }
              }
            })
            if (pushStatus == true) {
              let cta = `https://app.push.org/yieldv2`;
              console.log("Calculating Wallet Performance");
              channel.calculateWalletPerformance(amount, user, cta, pushStatus, pushAmount, currentBlockNumber);
              pushStatus = false;
              pushAmount = 0;
            } else {
              let cta = `https://app.push.org/`;
              console.log("Calculating Wallet Performance");
              channel.calculateWalletPerformance(amount, user, cta, false, 0, currentBlockNumber);
            }

          }

        })
      i++;

      }
            else{
        channel.logInfo('Breakkkk.');
        i = 1;
        break;
      }
    }
}