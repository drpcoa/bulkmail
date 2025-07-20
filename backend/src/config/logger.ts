import winston, { format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from './env';

const { combine, timestamp, printf, colorize, json } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

// Create transports array based on environment
const createTransports = () => {
  const transportsList = [];
  const isProduction = config.NODE_ENV === 'production';

  // Console transport for all environments
  transportsList.push(
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
      level: isProduction ? 'info' : 'debug',
    })
  );

  // File transport for production
  if (isProduction) {
    // Ensure logs directory exists
    const logDir = path.join(process.cwd(), 'logs');
    
    transportsList.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(timestamp(), json()),
        level: 'info',
      })
    );

    // Error logs in separate file
    transportsList.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(timestamp(), json()),
        level: 'error',
      })
    );
  }

  return transportsList;
};

// Create the logger instance
const logger: Logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'bulkmail-api' },
  transports: createTransports(),
  exitOnError: false, // Don't exit on handled exceptions
});

// Add exception handling
if (config.NODE_ENV === 'production') {
  const logDir = path.join(process.cwd(), 'logs');
  
  logger.exceptions.handle(
    new transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: combine(timestamp(), json()),
    })
  );

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    throw reason;
  });
}

// Export the logger as default
export default logger;
