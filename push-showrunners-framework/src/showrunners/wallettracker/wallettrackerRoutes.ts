import { Router, Request, Response, NextFunction, response } from "express";
import { Container } from "typedi";
import middlewares from "../../api/middlewares";
import { celebrate, Joi } from "celebrate";
import WallettrackerChannel from "./wallettrackerChannel";
import { globalCycleModel } from "./wallettrackerModel";
import { triggerDaoNotifications } from "./checkDaoProposals";
import { checkTransfers } from "./checkTokenTransfers";
import { checkNftTransfers } from "./checkNftTransfers";
import { handlePumpDump } from "./checkPumpDump";
const route = Router();

export default (app: Router) => {
  app.use("/showrunners/walletTracker", route);

  //route for testing portfolio
  route.post(
    "/trackPortfolio",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get("logger");
      Logger.debug(
        "Calling /showrunners/load_tokens endpoint with body: %o",
        req.body
      );

      const wt = Container.get(WallettrackerChannel);
      const cycleValue =
        (await globalCycleModel.findOne({ _id: "global" })) ||
        (await globalCycleModel.create({
          _id: "global",
          lastCycle: 1,
        }));
      const channel = Container.get(WallettrackerChannel);

      Logger.info(`Cycle Value ${cycleValue}`);

      if (cycleValue.lastCycle == 1) {
        channel.fetchBalance();
        Logger.info("First case");
        await globalCycleModel.updateOne(
          { _id: "global" },
          { $inc: { lastCycle: 1 } }
        );
      } else {
        Logger.info("Second case");
        channel.fetchPortolio();
        channel.fetchBalance();
        await globalCycleModel.updateOne(
          { _id: "global" },
          { $inc: { lastCycle: -1 } }
        );
      }
      return res.status(201).json({ success: true, data: "GM" });
    }
  );

  //This one may not return any logs as there can be no new events to fetch / send notifications about.
  //route for fetching major events in web3.
  route.post(
    "/trackEvents",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get("logger");
      Logger.debug(
        "Calling /showrunners/load_tokens endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.sendEventInfo();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );

  //route for testing New hacks
  route.post(
    "/trackHacks",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get("logger");
      Logger.debug(
        "Calling /showrunners/events endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.checkNewHacks();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );

  //route for testing Yield Opportunities.
  route.post(
    "/trackYield",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get("logger");
      logger.debug(
        "Calling /showrunners/wt ticker endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.checkNewYieldOpportunities();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );

  // route for testing token approvals
  route.post(
    "/trackApprovals",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get("logger");
      logger.debug(
        "Calling /showrunners/wt ticker endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.checkApprovals();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );
  route.post(
    "/trackDaoProposals",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get("logger");
      logger.debug(
        "Calling /showrunners/trackDaoProposals ticker endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        //  const response = await wt.checkDaoProposals();
        const response = triggerDaoNotifications(
          "proposals/0x56469f7675c8c3193a74a3c5fe502e63f992ce6d686e217f4c949fc4335d45b3"
        );
        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );

  route.post(
    "/trackTransfers",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get("logger");
      logger.debug(
        "Calling /showrunners/trackTransfers ticker endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        //  const response = await wt.checkDaoProposals();
        await checkTransfers();
        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );

  // pump dump
  route.post(
    "/trackPumpDump",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get("logger");
      logger.debug(
        "Calling /showrunners/trackTransfers ticker endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        //  const response = await wt.checkDaoProposals();
        await handlePumpDump();
        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );

  // track nfts
  route.post(
    "/trackNfts",
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get("logger");
      logger.debug(
        "Calling /showrunners/trackTransfers ticker endpoint with body: %o",
        req.body
      );
      try {
        const wt = Container.get(WallettrackerChannel);
        //  const response = await wt.checkDaoProposals();
        await checkNftTransfers();
        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error("🔥 error: %o", e);
        return next(e);
      }
    }
  );
};
