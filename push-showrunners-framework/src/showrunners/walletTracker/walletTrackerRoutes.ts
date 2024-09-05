import { Router, Request, Response, NextFunction, response } from 'express';
import { Container } from 'typedi';
import middlewares from '../../api/middlewares';
import { celebrate, Joi } from 'celebrate';
import WallettrackerChannel from './wallettrackerChannel';
import { globalCycleModel } from './wallettrackerModel';

const route = Router();

export default (app: Router) => {
  app.use('/showrunners/walletTracker', route);


  // routes for testing eth transfers
  route.post(
    '/trackEthBalance',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/wt ticker endpoint with body: %o', req.body);
      try {
        const wt = Container.get(WallettrackerChannel);
      
        const response = await wt.fetchEvents(null);

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

//route for testing portfolio
  route.post(
    '/trackPortfolio',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/load_tokens endpoint with body: %o', req.body);
      
        const wt = Container.get(WallettrackerChannel);
        const cycleValue = await globalCycleModel.findOne({_id: "global"})
    ||
   (await globalCycleModel.create({
      _id: "global",
     lastCycle: 1
   }));
   const channel = Container.get(WallettrackerChannel);

    Logger.info(`Cycle Value ${cycleValue}`);
   
      if(cycleValue.lastCycle == 1){
      channel.fetchBalance();
     Logger.info("First case");
     await globalCycleModel.updateOne({_id:'global'},{ $inc: {lastCycle: 1 } }); 
    }else{
      Logger.info("Second case");
      channel.fetchPortolio()
      channel.fetchBalance();
    await globalCycleModel.updateOne({_id:'global'},{ $inc: {lastCycle: -1 } }); 
      } 
      return res.status(201).json({ success: true, data: "GM" });



}
  );

  //This one may not return any logs as there can be no new events to fetch / send notifications about.
  //route for fetching major events in web3.
  route.post(
    '/trackEvents',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/load_tokens endpoint with body: %o', req.body);
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.sendEventInfo();
        
        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  //route for testing New hacks
  route.post(
    '/trackHacks',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/events endpoint with body: %o', req.body);
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.checkNewHacks();
        
        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  //route for testing Yield Opportunities.
  route.post(
    '/trackYield',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get('logger');
      logger.debug('Calling /showrunners/wt ticker endpoint with body: %o', req.body);
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.checkNewYieldOpportunities();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  // route for testing token approvals
  route.post(
    '/trackApprovals',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: any = Container.get('logger');
      logger.debug('Calling /showrunners/wt ticker endpoint with body: %o', req.body);
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.checkApprovals();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
};
