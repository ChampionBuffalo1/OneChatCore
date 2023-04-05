import winston from 'winston';
import { isProd } from '../Constants';

const Logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
    winston.format.printf(info => `[${info.level.toUpperCase()}]: ${info.message} - ${info.timestamp}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log', dirname: 'logs' }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      dirname: 'logs'
    })
  ]
});
export default Logger;
