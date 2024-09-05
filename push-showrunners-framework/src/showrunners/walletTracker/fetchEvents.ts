import WallettrackerChannel from './wallettrackerChannel';
import { Container } from 'typedi';
import {ethTrackerModel} from "./wallettrackerModel";
import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';
import { settings } from './wallettrackerSettings';
export async function fetchEvents(simulate: any) {
    const wt = Container.get(WallettrackerChannel);
    wt.logInfo('In ETH Transfer Events');
    //  Overide logic if need be
    const logicOverride =
        typeof simulate == 'object'
            ? simulate?.hasOwnProperty('logicOverride')
                ? simulate?.hasOwnProperty('logicOverride')
                : false
            : false;
    let subscribers =
        logicOverride && simulate.logicOverride.mode && simulate.logicOverride.hasOwnProperty('subscribers')
            ? simulate.logicOverride.subscribers
            : false;
    //  -- End Override logic
    // Check length of All subscribers saved balance , if zero then initialte balance save and then in next turn send notifs
    let firstTime;
    const userAlice = await PushAPI.initialize(null, {
        env: CONSTANTS.ENV.STAGING,
        account: settings.channelAddress,
      });
      const userData = await userAlice.channel.subscribers({
        page: 1,
        limit: 30,
        setting: true,
      });
    

for(let i=0;i<userData["subscribers"].length;i++){
    let sub =  await ethTrackerModel.find({ _id: { $in: `${userData["subscribers"][i].subscriber}` } });
   if(sub.length !=0){
    firstTime = false;
         break;
   }else{
         firstTime = true;
   }
}

    await wt._increasePaginationParams();
    const { allBalances: subscribersAndBalances } = await wt._fetchETHBalances(subscribers);
    const results = await wt._sendNotificationsToUsers(subscribersAndBalances,firstTime,simulate);
    return { results, subscribers };
  

}
