import winston from 'winston';
import { noConsole } from '../Constants';
import LokiTransport from 'winston-loki';

const transports: winston.transport[] = [new winston.transports.Console()];
let format = winston.format.combine(
  winston.format.splat(),
  winston.format.timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
  winston.format.printf(info => `[${info.level.toUpperCase()}]: ${info.message} - ${info.timestamp}`)
);

if (noConsole) {
  // Removing console logs in prod
  transports.shift();
}

if (process.env.GRAFANA_IP) {
  const loki = new LokiTransport({
    host: process.env.GRAFANA_IP,
    onConnectionError: console.error, // Log error to console if connection problem
    labels: { job: 'onechat-logs' },
    basicAuth: process.env.LOKI_AUTH
  });
  transports.push(loki);
  format = winston.format.json();
} else {
  // Adding disk logs if grafana loki isn't setup
  transports.push(new winston.transports.File({ filename: 'combined.log', dirname: 'logs' }));
  transports.push(
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      dirname: 'logs'
    })
  );
}
const Logger = winston.createLogger({
  level: 'debug',
  format,
  transports
});
export default Logger;
