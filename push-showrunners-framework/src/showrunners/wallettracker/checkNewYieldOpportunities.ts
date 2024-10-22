import { ethers } from 'ethers';
import { user, CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import config from '../../config';
import wtChannel from './wallettrackerChannel';
import { settings } from './wallettrackerSettings';
import { GraphQLClient, gql } from 'graphql-request';
import { Container } from 'typedi';
import { URL } from 'url';

let channelAddress = settings.channelAddress;
export async function checkNewYieldOpportunities() {
    const channel = Container.get(wtChannel);
    console.log("IN Channel");
    try {
        const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
        const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
        const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV] });
        const yields = await fetchYields(settings.defiApiKey, settings.defiRektApiEndpoint);

        if (yields.length === 0) {
            channel.logInfo('No yields found');
            return;
        }


        let index = 0;
        let count = 0;
        let selectedYields = [];

        while (count <= 5) {
            if (yields[index].apr * 100 >= 2) {
                selectedYields.push(yields[index]);
                count++;
            }
            index++;
        }

        channel.logInfo(`Selected yields: ${selectedYields}`)

       
        let page = 1;
        let hasMoreSubscribers = true;

        while (hasMoreSubscribers) {
            const userData: any = await userAlice.channel.subscribers({
                page: page,
                limit: 30,
                setting: true,
                channel: settings.channelAddress
            });

            if (userData.itemcount > 0) {
                const subscribers = userData.subscribers;

                for (let j = 0; j < subscribers.length; j++) {
                    if (subscribers[j].settings !== null) {
                        const chSettings = JSON.parse(subscribers[j].settings)[0];
                        if (chSettings.user === true) {

                          for (let i = 0; i < selectedYields.length; i++) {
                            triggerYieldNotification(selectedYields[i], subscribers[j].subscriber);
                        }
                        }
                    }
                }
                page++;
            } else {
                hasMoreSubscribers = false;
            }
        }

      

    } catch (err) {
        channel.logError(`Error in checkYieldOpportunities: ${err.message}`);
    }
}

async function fetchYields(apiKey: string, endpoint: string): Promise<any> {
    const query = gql`query {
      opportunities(where:{statuses:VALID,chainIds:1},orderBy: TVL, orderDirection: desc){
        id
          chainId
          apr
          totalValueLocked
          categories
          investmentUrl
          isNew
          status
          farm {
            id
            url
            slug
            logo
            categories
          }
          tokens {
            borrowRewards {
              displayName
              icon
              symbol
              name
            }
            deposits {
              displayName
              icon
              symbol
              name
            }
            rewards {
              displayName
              icon
              symbol
              name
            }
          }
        }
      }`;
    // Create a GraphQL client with the X-Api-Key header
    const client = new GraphQLClient(endpoint, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    try {
      // Execute the query
      const data = await client.request(query);
      return data.opportunities;
    } catch (error) {
    const channel = Container.get(wtChannel);
      channel.logError(`Error fetching data: ${error}`);
      throw error;
    }
  }

  async function triggerYieldNotification(yieldData: any, recipients: any) {
    const channel = Container.get(wtChannel);

    try {
      const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
      const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);

      const userAlice = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
      });

      let title = 'Current Yield Opportunities';

      const platform = getPlatformName(yieldData.farm.url)



      let message = `Stake 💲**${yieldData.tokens.deposits[0].symbol}** and earn <span color='green'>${(yieldData.apr * 100).toFixed(2)}% APR</span> on **${platform}**`;
      message += `[timestamp: ${Math.floor(Date.now() / 1000)}]`;

      await userAlice.channel.send([recipients], {
        notification: { title: `Don't let your assets stay idle,stake and earn !`, body: '✨ Here are some yeild opportunities for you ✨' },
        payload: {
          title: title,
          body: message,
          cta: yieldData.farm.url
        },
        channel: settings.channelAddress
      });
    } catch (error) {
      channel.logError(`Error occured: ${error}`);
    }
  }

  function getPlatformName(url: string) {
    const parsedUrl = new URL(url);
    const hostnameParts = parsedUrl.hostname.split('.');

    // Remove common prefixes like 'www' or 'app'
    let name = hostnameParts[0];
    if (['www', 'app'].includes(name.toLowerCase())) {
      name = hostnameParts[1];
    }

    // Capitalize the name
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }