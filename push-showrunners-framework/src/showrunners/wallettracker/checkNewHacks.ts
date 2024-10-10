import { ethers } from 'ethers';
import { user, CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import config from '../../config';
import wtChannel from './wallettrackerChannel';
import { settings } from './wallettrackerSettings';
import { hackNewsDataModel } from './wallettrackerModel';
import { GraphQLClient, gql } from 'graphql-request';
import { Container } from 'typedi';
import numeral from 'numeral';

interface Rekt {
    id: string;
    projectName: string;
    date: string;
    title: string;
    category: string;
    fundsLost: string;
    issueType: string;
  }
  
  interface RektsResponse {
    rekts: Rekt[];
  }

export async function checkNewHacks() {
    const channel = Container.get(wtChannel);

    try {
        const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
        const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
        const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV.PROD });
        const rekts = await fetchRekts(settings.defiApiKey, settings.defiRektApiEndpoint);

        if (rekts.length === 0) {
            channel.logInfo('No rekts found');
            return;
        }

        const latestRektId = rekts[0].id.toString();

        // Try to find the latest stored rekt ID
        let storedRektData = await hackNewsDataModel.findOne();

        if (!storedRektData) {
            // If no data is stored, create a new entry with the latest rekt ID
            storedRektData = new hackNewsDataModel({ _id: "hackNewsData", rektId: latestRektId });
            await storedRektData.save();
            channel.logInfo(`Initialized with latest rekt ID: ${latestRektId}`);
            return;
        }

        // Use the stored ID or the hardcoded value for testing
        const useHardcodedId = false; // Set to false when not testing
        const hardcodedId = 3961;
        const storedRektId = useHardcodedId ? hardcodedId : parseInt(storedRektData.rektId);


        if (parseInt(latestRektId) > storedRektId) {
            // Find all new rekts
            const newRekts = rekts.filter(rekt => parseInt(rekt.id.toString()) > storedRektId);

            // Update the stored rekt ID
            storedRektData.rektId = latestRektId;
            await storedRektData.save();

            // Here you can add logic to send notifications for new rekts
            for (const rekt of newRekts) {
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
                                // console.log(subscribers[j]); // Changed from [i] to [j]
                                const chSettings = JSON.parse(subscribers[j].settings)[1];
                                if (chSettings.user === true) {
                                    triggerUserNotification(rekt, subscribers[j].subscriber);
                                }
                            }
                        }
                        page++; // Increment the page number
                    } else {
                        hasMoreSubscribers = false; // Exit the loop when there are no more subscribers
                    }
                }
                
            }
        } else {
            channel.logInfo('No new rekts found');
        }

    } catch (err) {
        channel.logError(`Error in checkNewHacks: ${err.message}`);
    }
}

async function triggerUserNotification(rekt: any, recipients: any) {
    const channel = Container.get(wtChannel);

    try {
        const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
        const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);

        const userAlice = await PushAPI.initialize(signer, {
            env: CONSTANTS.ENV.PROD,
        });

        let payloadMessage = `<span color="red">Funds Lost:</span> 💲 ${formatCurrency(rekt.fundsLost)} \n <span color="green">Issue:</span> ${rekt.issueType} \n <span color="#FFBF00">Category:</span> ${rekt.category}`;

        payloadMessage += `[timestamp: ${Math.floor(Date.now() / 1000)}]`;


        await userAlice.channel.send([recipients], {
            notification: { title: rekt.title, body: '🚨 Crypto Security Alert 🚨' },
            payload: {
                title: rekt.title + ' ⚠️',
                body: payloadMessage,
                cta: 'https://de.fi/rekt-database'
            },
            channel: settings.channelAddress
        });
    } catch (error) {
        channel.logError(`Error occured: ${error.message}`);
    }
}

async function fetchRekts(apiKey: string, endpoint: string): Promise<Rekt[]> {
    const query = gql`
      query {
        rekts(orderBy: { date: desc }) {
          id
          projectName
          date
          title
          category
          fundsLost
          issueType
        }
      }
    `;
    // Create a GraphQL client with the X-Api-Key header
    const client = new GraphQLClient(endpoint, {
        headers: {
            'X-Api-Key': apiKey,
        },
    });

    try {
        // Execute the query
        const data = await client.request<RektsResponse>(query);
        return data.rekts;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

function formatCurrency(amount: string): string {
    let intAmount = parseInt(amount);
    let format = '0.0a';

    if (intAmount < 1000) {
      format = '0,0.00';
    }

    return numeral(intAmount).format(format).toUpperCase().trim();
  }