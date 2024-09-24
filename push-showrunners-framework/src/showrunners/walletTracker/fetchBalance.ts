import { ethers } from 'ethers';
import { CovalentClient } from "@covalenthq/client-sdk";
import { CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import {settings} from './wallettrackerSettings';
import wtChannel from './wallettrackerChannel';
import { Container } from 'typedi';
const channelAddress=settings.channelAddress;

export async function fetchBalance()
{
    const channel = Container.get(wtChannel);
    channel.logInfo("In Fetch Balance");
    {
        try {

          const client = new CovalentClient(settings.covalentApiKey);
        //  channel.logInfo("Key:",settings.covalentApiKey);
          const title = `Portfolio`;
          const message = `Here comes your portfolio insight!`;
          let cta;
          channel.logInfo("1---Fetch Balance called----1");
          // Initializing userAlice
          const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
    
          const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
          const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV.STAGING });
    let i = 1;
    
          while (true) {
            const userData: any = await userAlice.channel.subscribers({
              page: i,
              limit: 15,
              channel: settings.channelAddress
            });
           channel.logInfo(`User Data in FetchBalance : ${JSON.stringify(userData)}`);
            if (userData.itemcount != 0) {
              userData.subscribers.map(async (user) => {
                channel.logInfo(`User :${user}`);
                const resp = await client.BalanceService.getTokenBalancesForWalletAddress("eth-mainnet", user);
    
                  let amount = 0;
                  let payloadMsg = '';
                  let amtStatus = false;
                  let items;
                  if (!resp.error) {
    
                  items = resp.data.items;
                  channel.logInfo(`Response for ${user} in FetchBalance : ${items}`);
    
                    items.map(async (item: any) => {
                      let tokenBalance = (Number(ethers.utils.formatUnits(item.balance, item.contract_decimals))).toFixed(4);
                      amount = Number(amount + (item.quote_rate * Number(tokenBalance)));
                      if (item.quote_rate * Number(tokenBalance) > 0.5 && payloadMsg.length <= 335) {
                        tokenBalance = tokenBalance.replace(/\.?0+$/, '');
                        payloadMsg += `${item.contract_ticker_symbol} : ${tokenBalance} ~ $${(item.quote_rate * Number(tokenBalance)).toFixed(2)}\n`;
                        channel.logInfo(`Payload for ${user} in FetchBalance : ${payloadMsg}`);
    
                        if(payloadMsg.length >= 335){
                          if(amtStatus == false){
                            channel.logInfo("-------Short Balance-------");
                            cta = `https://etherscan.io/address/${user}`;
                          let msg = `<span color='#457b9d'>Portfolio balance</span>: <span color='#e76f51'>$${amount.toFixed(2)}</span>\n\n` + payloadMsg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
                          amtStatus = true;
    
                          payloadMsg ='';
                        channel.logInfo(`Payload FetchBalance 1 : ${payloadMsg}`);
                        channel.sendNotificationHelper(title, message, msg, cta, user);
                          
                         }else{
                          channel.logInfo("-------Long Balance-------");
                          cta = `https://etherscan.io/address/${user}`;
                          let msg = payloadMsg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
                          amtStatus = true;
                          payloadMsg = '';
                         channel.logInfo(`Payload FetchBalance 2 : ${payloadMsg}`);
                        channel.sendNotificationHelper(title, message, msg, cta, user);
                         
                        }
                        
                        }
                      }
                    });
                    cta = `https://etherscan.io/address/${user}`;
                    if (payloadMsg !='' && amount > 0) {
                      channel.logInfo("Third")
                      if (amtStatus == false) {
                        
                       let msg = `<span color='#457b9d'>Portfolio balance</span>: <span color='#e76f51'>$${amount.toFixed(2)}</span>\n\n` + payloadMsg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
    
                       payloadMsg = '';
                       channel.logInfo(`Payload FetchBalance 3 : ${payloadMsg}`);
                        channel.sendNotificationHelper(title, message, msg, cta, user);
                       
                      } else {
                        channel.logInfo("Fourth");
                        let msg = payloadMsg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
    
                        payloadMsg = '';
                        channel.logInfo(`Payload FetchBalance 4 : ${payloadMsg}`);
                        channel.sendNotificationHelper(title, message, msg, cta, user);
                      }
                    }
                   
                  } else {
                    console.log('In Else')
                    channel.logInfo(`Error : ${resp.error_message}`);
                  }
                
              }
              )
              i++;
            } else {
              channel.logInfo('Breakkkk.');
              i = 1;
              break;
            }
          }
        } catch (error) {
          channel.logInfo(`Error in FetchBalanceMain : ${error}`);
        }
      }
    
}
