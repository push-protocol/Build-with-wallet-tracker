import { Router, Request, Response, NextFunction, response } from 'express';
import { Container } from 'typedi';
import middlewares from '../../api/middlewares';
import { celebrate, Joi } from 'celebrate';
import WallettrackerChannel from './walletTrackerChannel';
import { globalCycleModel } from './walletTrackerModel';

const route = Router();

export default (app: Router) => {
  app.use('/showrunners/wallet_tracker', route);
  // routes for wallet tracker

  route.post(
    '/apr',
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
        const response = await wt.calculateWalletPerformance(
          1000,
          '0xaB8a67743325347Aa53bCC66850f8F13df87e3AF',
          'https://app.push.org/yieldv2',
          true,
          1000,
          1,
        );

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  //route for sending new events
  route.post(
    '/events',
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
        const response = await wt.sendEventInfo();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  //route for Sending Transaction History
  route.post(
    '/getHistory',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/getHistory endpoint with body: %o', req.body);
      try {
        const wt = Container.get(WallettrackerChannel);
        const response = await wt.sendWalletTransactions();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  //route for sending hack report notifications
  route.post(
    '/hack_notif',
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
        const hackerNews = Container.get(WallettrackerChannel);
        const response = await hackerNews.checkNewHacks();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  //route for sending yield opportunity notifications
  route.post(
    '/yield_notif',
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
        const hackerNews = Container.get(WallettrackerChannel);
        const response = await hackerNews.checkNewYieldOpportunities();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  // route for sending token approvals
  route.post(
    '/approvals',
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
        const hackerNews = Container.get(WallettrackerChannel);
        const response = await hackerNews.checkApprovals();

        return res.status(201).json({ success: true, data: response });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
};
