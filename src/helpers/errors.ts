/**
 * Custom Error Handler
 * Extends Error class with additional properties for API responses
 */

import { ErrorCode, ERROR_MESSAGES, HTTP_STATUS_CODES } from '../constants';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: Date;
  public readonly path?: string;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode?: number,
    path?: string
  ) {
    const errorMessage = message || ERROR_MESSAGES[code] || 'An error occurred';
    super(errorMessage);

    this.code = code;
    this.statusCode = statusCode || HTTP_STATUS_CODES[code] || 500;
    this.timestamp = new Date();
    this.path = path;

    // Set prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.path && { path: this.path }),
    };
  }
}

export class ValidationError extends AppError {
  public readonly details?: Record<string, string[]>;

  constructor(message: string, details?: Record<string, string[]>) {
    super(ErrorCode.VALIDATION_FAILED, message);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.details && { details: this.details }),
    };
  }
}

export class AuthenticationError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.AUTH_UNAUTHORIZED, message);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorCode.RECORD_NOT_FOUND, `${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class OAuthError extends AppError {
  constructor(code: ErrorCode, message?: string) {
    super(code, message);
    Object.setPrototypeOf(this, OAuthError.prototype);
  }
}
