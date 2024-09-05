import { ethers } from 'ethers';
import { user, CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import config from '../../config';
import wtChannel from './wallettrackerChannel';
import { settings } from './wallettrackerSettings';
import { Container } from 'typedi';
import { CovalentClient } from '@covalenthq/client-sdk';

export async function checkApprovals() {
    const channel = Container.get(wtChannel);
    channel.logInfo('In Check Approvals');
    try {
        const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
        const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
        const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV.STAGING });

        const client = new CovalentClient(settings.covalentApiKey);

       
        let page = 1;
        let hasMoreSubscribers = true;

        while (hasMoreSubscribers) {
            const userData: any = await userAlice.channel.subscribers({
                page: page,
                limit: 30,
                setting: true,
            });

            if (userData.itemcount > 0) {
                const subscribers = userData.subscribers;
                for (let j = 0; j < subscribers.length; j++) {
                    if (subscribers[j].settings !== null) {
                        const settings = JSON.parse(subscribers[j].settings)[2];
                        if (settings.user === true) {
                            const resp = await client.SecurityService.getApprovals("eth-mainnet", subscribers[j].subscriber); //change to recipients[i]
            
            const recipient = resp.data.address;
            const items = resp.data.items;
            const chunkSize = 3;

            for (let chunkStart = 0; chunkStart < items.length; chunkStart += chunkSize) {
                let notificationContent = "";
                const chunk = items.slice(chunkStart, chunkStart + chunkSize);

                for (let j = 0; j < chunk.length; j++) {
                    const item = chunk[j];

                    if (!item.ticker_symbol || !item.balance_quote || item.balance_quote === 0) {
                        continue;
                    }
                    // Convert value_at_risk to a readable format
                    const valueAtRisk = Number(item.value_at_risk) / Math.pow(10, item.contract_decimals);

                    // Format the notification line
                    const line = `${item.token_address_label}: ` +
                        `${valueAtRisk.toFixed(2)} ${item.ticker_symbol} <span color='green'>(${item.pretty_value_at_risk_quote})</span>\n`;

                    notificationContent += line;
                }

                notificationContent += `[timestamp: ${Math.floor(Date.now() / 1000)}]`;

                if (notificationContent !== `[timestamp: ${Math.floor(Date.now() / 1000)}]`) {
                    await userAlice.channel.send([recipient], { // change * to recipient
                        notification: { title: 'Token Approvals', body: 'Token Approval Alert' },
                        payload: {
                            title: `🔐 Secure Your Tokens! Check Your Active Approvals Now!🔐`,
                            body: notificationContent,
                        },
                        channel: settings.channelAddress,
                    });
                }
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
        channel.logError(`Error in checkApprovals: ${err.message}`);
    }
}