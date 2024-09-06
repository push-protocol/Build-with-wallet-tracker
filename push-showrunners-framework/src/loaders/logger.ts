import winston from 'winston';
require ('winston-daily-rotate-file');
const moment = require('moment'); // time library

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    simulate: 4,
    input: 5,
    saved: 6,
    verbose: 7,
    debug: 8,
    silly: 9,
  },
  colors: {
    info: 'green',
    simulate: 'white bold dim',
    input: 'inverse bold',
    saved: 'italic white',
    debug: 'yellow',
  }
};

var options = {
  file: {
    level: 'verbose',
    filename: `${__dirname}/../../logs/app.log`,
    handleExceptions: true,
    json: true,
    maxSize: "5m", // 5MB
    maxFiles: "5d",
    // colorize: true,
  },
};

const parser = (param: any): string => {
  if (!param) {
    return '';
  }
  if (typeof param === 'string') {
    return param;
  }

  return Object.keys(param).length ? JSON.stringify(param, undefined, 2) : '';
};

const formatter = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, meta } = info;

    
    const ts = moment(Date.now()).local().format('HH:MM:ss');
    const currentDate = new Date(Date.now());

    const hours = currentDate.getHours().toString().padStart(2, '0');  // Get hours (0-23) and pad with zero if needed
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');  // Get minutes (0-59) and pad with zero
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');  // Get seconds (0-59) and pad with zero
    
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    
    const metaMsg = meta ? `: ${parser(meta)}` : '';

    return `${formattedTime} ${level} ${parser(message)} ${metaMsg}`;
  }),
  winston.format.colorize({
    all: true,
  }),
)

const winstonTransporter:any = winston.transports;
var transport = new (winstonTransporter.DailyRotateFile)(options.file);
transport.on('rotate', function(oldFilename, newFilename) {
  // do something fun
  console.log("login rotated from: %o | %o", oldFilename, newFilename)
});

const transports = [];
transports.push(
  transport,
  new winston.transports.Console({
    format: formatter
  }),
)

const LoggerInstance = winston.createLogger({
  level: 'debug',
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports
});

winston.addColors(customLevels.colors);

export default LoggerInstance;
