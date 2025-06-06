import winston from 'winston';
import { Loggly } from 'winston-loggly-bulk';

// Loggly configuration from environment variables
const LOGGLY_TOKEN = process.env.LOGGLY_TOKEN;
const LOGGLY_SUBDOMAIN = process.env.LOGGLY_SUBDOMAIN;

if (!LOGGLY_TOKEN || !LOGGLY_SUBDOMAIN) {
  console.warn('Warning: LOGGLY_TOKEN or LOGGLY_SUBDOMAIN environment variables are not set');
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    ...(LOGGLY_TOKEN && LOGGLY_SUBDOMAIN ? [
      new Loggly({
        token: LOGGLY_TOKEN,
        subdomain: LOGGLY_SUBDOMAIN,
        tags: ['kachery-api'],
        json: true
      })
    ] : [])
  ]
});

// Add console transport for local development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
