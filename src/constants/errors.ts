/**
 * API Error Codes and Messages
 * Centralized error handling constants
 */

export enum ErrorCode {
  // Authentication Errors (4001-4010)
  AUTH_UNAUTHORIZED = 'AUTH_401',
  AUTH_INVALID_TOKEN = 'AUTH_402',
  AUTH_TOKEN_EXPIRED = 'AUTH_403',
  AUTH_MISSING_CREDENTIALS = 'AUTH_404',

  // Validation Errors (4011-4020)
  VALIDATION_FAILED = 'VALIDATION_400',
  INVALID_INPUT = 'VALIDATION_401',
  MISSING_FIELD = 'VALIDATION_402',

  // LinkedIn OAuth Errors (4021-4030)
  OAUTH_FAILED = 'OAUTH_400',
  OAUTH_STATE_INVALID = 'OAUTH_401',
  OAUTH_EXCHANGE_FAILED = 'OAUTH_402',
  OAUTH_PROFILE_FETCH_FAILED = 'OAUTH_403',

  // Database Errors (4031-4040)
  DATABASE_ERROR = 'DB_500',
  RECORD_NOT_FOUND = 'DB_501',
  DUPLICATE_RECORD = 'DB_502',

  // Server Errors (5001-5010)
  INTERNAL_SERVER_ERROR = 'SERVER_500',
  SERVICE_UNAVAILABLE = 'SERVER_503',
}

export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  AUTH_401: 'Unauthorized access',
  AUTH_402: 'Invalid or malformed token',
  AUTH_403: 'Token has expired',
  AUTH_404: 'Missing authentication credentials',

  // Validation
  VALIDATION_400: 'Request validation failed',
  VALIDATION_401: 'Invalid input provided',
  VALIDATION_402: 'Required field is missing',

  // OAuth
  OAUTH_400: 'OAuth authentication failed',
  OAUTH_401: 'Invalid or expired state parameter',
  OAUTH_402: 'Failed to exchange authorization code for token',
  OAUTH_403: 'Failed to fetch LinkedIn profile',

  // Database
  DB_500: 'Database operation failed',
  DB_501: 'Requested resource not found',
  DB_502: 'Resource already exists',

  // Server
  SERVER_500: 'Internal server error',
  SERVER_503: 'Service temporarily unavailable',
};

export const HTTP_STATUS_CODES: Record<string, number> = {
  AUTH_401: 401,
  AUTH_402: 401,
  AUTH_403: 401,
  AUTH_404: 401,
  VALIDATION_400: 400,
  VALIDATION_401: 400,
  VALIDATION_402: 400,
  OAUTH_400: 400,
  OAUTH_401: 400,
  OAUTH_402: 400,
  OAUTH_403: 400,
  DB_500: 500,
  DB_501: 404,
  DB_502: 409,
  SERVER_500: 500,
  SERVER_503: 503,
};
