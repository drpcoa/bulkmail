import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Define log format type
type LogFormatParams = {
  level: string;
  message: string;
  timestamp?: string;
  [key: string]: unknown;
};

const { combine, timestamp, printf, colorize, align } = winston.format;

// Define log format with proper typing
const logFormat = printf(({ level, message, timestamp, ...meta }: LogFormatParams) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

// Create transports array based on environment
const transports: winston.transport[] = [];

// Get NODE_ENV with proper type assertion
const nodeEnv = process.env['NODE_ENV'] || 'development';

// Console transport for all environments except test
if (nodeEnv !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        logFormat
      ),
      level: 'debug',
    })
  );
}

// File transport for production
if (nodeEnv === 'production') {
  const logDir = path.join(process.cwd(), 'logs');
  
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), logFormat),
    })
  );
  
  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: combine(timestamp(), logFormat),
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat
  ),
  transports,
  exitOnError: false, // Do not exit on handled exceptions
});

// Add a stream for Morgan (HTTP request logging)
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger };
