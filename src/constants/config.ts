/**
 * Application Configuration Constants
 */

export const CONFIG = {
  API_PREFIX: '/api',

  // Token Expiry
  JWT_EXPIRES_IN: '24h',
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in ms
  REFRESH_TOKEN_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

  // OAuth State
  STATE_EXPIRY: 10 * 60 * 1000, // 10 minutes in ms

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  // Features
  ENABLE_CORS: true,
  ENABLE_HELMET: true,
  ENABLE_RATE_LIMIT: process.env.NODE_ENV === 'production',
};

export const LINKEDIN_SCOPES = ['openid', 'profile', 'email'];

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
};
