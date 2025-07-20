import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

// Custom error interface that extends the default Error
export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number;
  details?: Record<string, any>;
}

// Error response interface
export interface ErrorResponse {
  status: string;
  message: string;
  error?: any;
  stack?: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
  method?: string;
}

// Error handling middleware
export const errorHandler = (
  err: AppError | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default values for the error response
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Something went wrong';
  const isOperational = err.isOperational || false;
  const errorDetails = 'details' in err ? err.details : undefined;
  const timestamp = new Date().toISOString();

  // Prepare error response
  const errorResponse: ErrorResponse = {
    status,
    message,
    timestamp,
    path: req.originalUrl,
    method: req.method,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(errorDetails && { details: errorDetails }),
    };
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      error: err,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} - ${message}`, {
      error: err.message,
      path: req.originalUrl,
      method: req.method,
      ...(errorDetails && { details: errorDetails }),
    });
  }

  // In production, don't leak error details for non-operational errors
  if (process.env.NODE_ENV === 'production' && !isOperational) {
    errorResponse.message = 'An unexpected error occurred';
    delete errorResponse.error;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Handle 404 Not Found
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(
    404,
    `Can't find ${req.originalUrl} on this server!`,
    true
  );
  next(error);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  if (reason instanceof Error) {
    logger.error('Unhandled Rejection at:', reason);
    logger.error('Reason:', reason.message);
    logger.error('Stack:', reason.stack);
  } else {
    logger.error('Unhandled Rejection with value:', reason);
  }
  // Consider shutting down the server in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error:', err);
  logger.error('Stack:', err.stack);
  // Consider shutting down the server in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err);
  
  // Close server & exit process
  // For now, we'll just log the error
  // In a real app, you might want to gracefully shut down the server
  // server.close(() => {
  //   process.exit(1);
  // });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err);
  
  // In a real app, you might want to gracefully shut down the server
  // process.exit(1);
});
