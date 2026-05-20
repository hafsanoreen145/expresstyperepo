/**
 * Global Error Handler Middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../helpers/errors';
import { ErrorCode, HTTP_STATUS_CODES } from '../constants';

interface ErrorResponse {
  success: boolean;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, string[]>;
  stack?: string;
}

/**
 * Global error handler middleware
 * Must be registered as the last middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle AppError instances
  if (err instanceof AppError) {
    const statusCode = err.statusCode;
    const response: ErrorResponse = {
      success: false,
      error: err.code,
      message: err.message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    // Add validation details if present
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    return res.status(statusCode).json(response);
  }

  // Handle unknown errors
  console.error('Unhandled Error:', err);

  const statusCode = 500;
  const response: ErrorResponse = {
    success: false,
    error: ErrorCode.INTERNAL_SERVER_ERROR,
    message: err.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Don't expose stack trace in production
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Route not found', 404, req.path);
  next(error);
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
