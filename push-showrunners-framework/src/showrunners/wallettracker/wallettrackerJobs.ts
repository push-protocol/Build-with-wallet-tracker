// Do Scheduling
// https://github.com/node-schedule/node-schedule
// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
// Execute a cron job every 5 Minutes = */5 * * * *
// Starts from seconds = * * * * * *

import logger from '../../loaders/logger';

import { Container } from 'typedi';
import schedule from 'node-schedule';
import wtChannel from './wallettrackerChannel';
import { globalCycleModel } from './wallettrackerModel';
import { times } from 'lodash';
import { timeStamp } from 'console';
import { BalanceService } from '@covalenthq/client-sdk';
import {checkDaoProposals} from "./checkDaoProposals";
import { handlePumpDump } from './checkPumpDump';
import { checkTransfers } from './checkTokenTransfers';
import { checkNftTransfers } from './checkNftTransfers';
export default () => {
  // wallet tracker jobs
  const startTime = new Date(new Date().setHours(0, 0, 0, 0));
  const channel = Container.get(wtChannel);

  const threeDayRule = new schedule.RecurrenceRule();
  threeDayRule.dayOfWeek = new schedule.Range(0, 6,3);
  threeDayRule.hour = 0;
  threeDayRule.minute = 0;
  threeDayRule.second = 0;

  //Fetch Tokens 
  schedule.scheduleJob({ start: startTime, rule: threeDayRule }, async function () {
    const taskName = `${channel.cSettings.name} Starting to fetch Portfolio`;
    logger.info(`🐣 Cron Task Started -- ${taskName}`);
    const cycleValue = await globalCycleModel.findOne({ _id: "global" })
      ||
      (await globalCycleModel.create({
        _id: "global",
        lastCycle: 1
      }));

    logger.info(`Cycle Value ${cycleValue}`);
    try {
      if (cycleValue.lastCycle == 1) {
        channel.fetchBalance();
        logger.info("First case");
        await globalCycleModel.updateOne({ _id: 'global' }, { $inc: { lastCycle: 1 } });
      } else {
        logger.info("Second case");
        channel.fetchPortolio()
        channel.fetchBalance();
        await globalCycleModel.updateOne({ _id: 'global' }, { $inc: { lastCycle: -1 } });
      }
      logger.info(`🐣 Cron Task Completed -- ${taskName}`);
    } catch (err) {
      logger.error(`❌ Cron Task Failed -- ${taskName}`);
      logger.error(`Error Object: %o`, err);
    }
  });


  // eth tracker jobs
  const oneHourRule = new schedule.RecurrenceRule();
   oneHourRule.hour = new schedule.Range(0, 23);
   oneHourRule.minute = 0;
   oneHourRule.second = 0;

  const ethChannel = Container.get(wtChannel);

  const oneDayRule = new schedule.RecurrenceRule();
  oneDayRule.dayOfWeek = new schedule.Range(0, 6);
  oneDayRule.hour = 0;
  oneDayRule.minute = 0;
  oneDayRule.second = 0;
  // send events job


  channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [on 1day ]`)
  schedule.scheduleJob({ start: startTime, rule: oneDayRule }, async function () {
    const taskName = `${channel.cSettings.name} wallettracker.sendEvents`;
    try {
      channel.sendEventInfo();
      logger.info(`🐣 Cron Task Completed -- ${taskName}`);
    } catch (err) {
      logger.error(`❌ Cron Task Failed -- ${taskName}`);
      logger.error(`Error Object: %o`, err);
    }
  })

  // send hack reports every 12 hours job
  channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 12 hours]`);


  
  // Rule to run every 12 hours
 const twelveHourRule = new schedule.RecurrenceRule();
 twelveHourRule.hour = new schedule.Range(0, 23,12);
 twelveHourRule.minute = 0;
 twelveHourRule.second = 0;
  schedule.scheduleJob({ start: startTime, rule: twelveHourRule }, async function () {
    const taskName = `${channel.cSettings.name} hackerNews.checkNewHacks() and triggerUserNotification()`;
    try {
      await channel.checkNewHacks();
      logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
    } catch (err) {
      logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
      logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
    }
  });


  
  // send yield opportunities every 7 days job
  channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 12 hours]`);

  // Rule to run every 7 days // Changed to 1 day for testing
  const severDayRule = `0 0 */1 * *`
  schedule.scheduleJob({ start: startTime, rule: oneDayRule }, async function () {
    const taskName = `${channel.cSettings.name} Check new Yield Opportunities`;
    try {
      await channel.checkNewYieldOpportunities();
      logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
    } catch (err) {
      logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
      logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
    }
  });

  // send approvals notifications every 3 days
  channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 3 hours]`);

  // Rule to run every 3 days //changed to 1 day for testing
  const everyThreeDays = '0 0 */1 * *';
  schedule.scheduleJob({ start: startTime, rule: threeDayRule }, async function () {
    const taskName = `${channel.cSettings.name} sending Approval Notifications`;
    try {
      await channel.checkApprovals();
      logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
    } catch (err) {
      logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
      logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
    }
  });

 // send approvals notifications every 3 days
 channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 3 Days]`);

 // Rule to run every 3 days //changed to 1 day for testing
 schedule.scheduleJob({ start: startTime, rule: threeDayRule }, async function () {
   const taskName = `${channel.cSettings.name} Updating Dao Addresses`;
   try {
    await checkDaoProposals();
     logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
   } catch (err) {
     logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
     logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
   }
 });

 // send approvals notifications every 3 days
 channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 12 hours]`);
 const threeHourRule = new schedule.RecurrenceRule();
 threeHourRule.hour = new schedule.Range(0, 23, 3);
 threeHourRule.minute = 0;
 threeHourRule.second = 0;

 const fiveMinRule = new schedule.RecurrenceRule();
 fiveMinRule.minute = new schedule.Range(0, 59, 5);
 fiveMinRule.second = 0;

//  // Rule to run every 3 days //changed to 1 day for testing
 schedule.scheduleJob({ start: startTime, rule: threeHourRule }, async function () {
   const taskName = `${channel.cSettings.name} sending Pump Dump Notifications`;
   try {
    await handlePumpDump();
     logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
   } catch (err) {
     logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
     logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
   }
 });

//  channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 3 hours]`);

 // Rule to run every 3 days //changed to 1 day for testing
 schedule.scheduleJob({ start: startTime, rule: threeHourRule }, async function () {
   const taskName = `${channel.cSettings.name} sending Token Transfer Notifications`;
   try {
    await checkTransfers();
     logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
   } catch (err) {
     logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
     logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
   }
 });

 channel.logInfo(`-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [every 3 hours]`);

 // Rule to run every 3 days //changed to 1 day for testing
 schedule.scheduleJob({ start: startTime, rule: threeHourRule }, async function () {
   const taskName = `${channel.cSettings.name} sending NFT Transfer Notifications`;
   try {
    await checkNftTransfers();
     logger.info(`${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
   } catch (err) {
     logger.error(`${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
     logger.error(`${new Date(Date.now())}] Error Object: %o`, err);
   }
 });
};

