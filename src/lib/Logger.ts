import winston from 'winston';
import { isProd } from '../Constants';
import LokiTransport from 'winston-loki';

const transports: winston.transport[] = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'combined.log', dirname: 'logs' }),
  new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    dirname: 'logs'
  })
];
let format = winston.format.combine(
  winston.format.splat(),
  winston.format.timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
  winston.format.printf(info => `[${info.level.toUpperCase()}]: ${info.message} - ${info.timestamp}`)
);

if (isProd) {
  // Removing console logs in prod
  transports.shift();
  if (process.env.GRAFANA_IP) {
    // Removing disk logs if grafana is setup in prod
    transports.pop();
    transports.pop();
    const loki = new LokiTransport({
      host: process.env.GRAFANA_IP,
      onConnectionError: console.error, // Log error to console if connection problem
      labels: { job: 'onechat-logs' },
      basicAuth: process.env.LOKI_AUTH
    });
    transports.push(loki);
    format = winston.format.json();
  }
}

const Logger = winston.createLogger({
  level: 'debug',
  format,
  transports
});
export default Logger;
