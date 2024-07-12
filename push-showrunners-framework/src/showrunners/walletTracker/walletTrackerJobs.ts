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

import logger from "../../loaders/logger";

import { Container } from "typedi";
import schedule from "node-schedule";
import wtChannel from "./walletTrackerChannel";
import { globalCycleModel } from "./walletTrackerModel";

export default () => {
// ***************************************************************
// /////////////////// EXISTING JOBS HERE ////////////////////////
// ***************************************************************

  // wallet tracker jobs
  const startTime = new Date(new Date().setHours(0, 0, 0, 0));
  const channel = Container.get(wtChannel);

  const threeDayRule = new schedule.RecurrenceRule();
  threeDayRule.dayOfWeek = new schedule.Range(0, 6, 3);
  threeDayRule.hour = 0;
  threeDayRule.minute = 0;
  threeDayRule.second = 0;

  //Fetch Tokens
  schedule.scheduleJob(
    { start: startTime, rule: threeDayRule },
    async function () {
      const taskName = `${channel.cSettings.name} Starting to fetch Tokens`;
      logger.info(`🐣 Cron Task Started -- ${taskName}`);
      const cycleValue =
        (await globalCycleModel.findOne({ _id: "global" })) ||
        (await globalCycleModel.create({
          _id: "global",
          lastCycle: 1,
        }));

      logger.info(`Cycle Value ${cycleValue}`);
      try {
        if (cycleValue.lastCycle == 1) {
          channel.fetchBalance();
          logger.info("First case");
          await globalCycleModel.updateOne(
            { _id: "global" },
            { $inc: { lastCycle: 1 } }
          );
        } else {
          logger.info("Second case");
          channel.fetchPortolio();
          channel.fetchBalance();
          await globalCycleModel.updateOne(
            { _id: "global" },
            { $inc: { lastCycle: -1 } }
          );
        }
        logger.info(`🐣 Cron Task Completed -- ${taskName}`);
      } catch (err) {
        logger.error(`❌ Cron Task Failed -- ${taskName}`);
        logger.error(`Error Object: %o`, err);
      }
    }
  );

  // wallet history tranasactions
  const twelveHourRule = new schedule.RecurrenceRule();
  twelveHourRule.hour = new schedule.Range(0, 23, 12);
  twelveHourRule.minute = 0;
  twelveHourRule.second = 0;

  channel.logInfo(
    `-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [on 12hr ]`
  );
  schedule.scheduleJob(
    { start: startTime, rule: twelveHourRule },
    async function () {
      const taskName = `${channel.cSettings.name} Sending Wallet Transaction history`;
      try {
        channel.sendWalletTransactions();
        logger.info(`🐣 Cron Task Completed -- ${taskName}`);
      } catch (err) {
        logger.error(`❌ Cron Task Failed -- ${taskName}`);
        logger.error(`Error Object: %o`, err);
      }
    }
  );

  // send events job
  const oneDayRule = new schedule.RecurrenceRule();
  oneDayRule.hour = 0;
  oneDayRule.minute = 0;
  oneDayRule.second = 0;

  channel.logInfo(
    `-- 🛵 Scheduling Showrunner ${channel.cSettings.name} -  Channel [on 1day ]`
  );
  schedule.scheduleJob(
    { start: startTime, rule: oneDayRule },
    async function () {
      const taskName = `${channel.cSettings.name} walletTracker.sendEvents`;
      try {
        channel.sendEventInfo();
        logger.info(`🐣 Cron Task Completed -- ${taskName}`);
      } catch (err) {
        logger.error(`❌ Cron Task Failed -- ${taskName}`);
        logger.error(`Error Object: %o`, err);
      }
    }
  );

// ***************************************************************
// //////////////// CONTRIBUTIONS STARTS HERE ////////////////////
// ***************************************************************
};
