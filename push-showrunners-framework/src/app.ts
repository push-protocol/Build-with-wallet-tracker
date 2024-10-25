import 'reflect-metadata'; // We need this in order to use @Decorators

import express from 'express';

import EnvVerifierLoader from './loaders/envVerifier';
import Logger from './loaders/logger';
import gradient from "gradient-string";
import figlet from "figlet";
async function startServer() {
  // Check environment setup first
  Logger.info('✌️   Verifying ENV');
  await EnvVerifierLoader();
  Logger.info('✔️   ENV Verified / Generated and Loaded!');
  // Continue load
  const config = (await require('./config/index')).default;

  // load app
  const app = express();

  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({ expressApp: app });

  app.listen(config.port, (err) => {
    if (err) {
      Logger.error(err);
      process.exit(1);
      return;
    }
    let text;
    if(process.env.SHOWRUNNERS_ENV === 'STAGING'){
      text = figlet.textSync("Showrunners Staging ", {
        font: "ANSI Shadow",
        horizontalLayout: "full",
      })
    }else{
      text = figlet.textSync("Showrunners Prod ", {
        font: "ANSI Shadow",
        horizontalLayout: "full",
      })
    }
    process.env.SHOWRUNNERS_ENV === 'STAGING'
      ?
      console.log(gradient.pastel.multiline(text))
      : 
      console.log(gradient.pastel.multiline(text))
    Logger.info(`🛡️ Server listening on port: ${config.port} 🛡️`)
  });
}

startServer();
