/**
 * API Response Messages
 * Standard messages for API responses
 */

export const MESSAGES = {
  // Authentication
  LOGIN_INITIATED: 'OAuth flow initiated successfully',
  LOGIN_SUCCESS: 'User authenticated successfully',
  LOGOUT_SUCCESS: 'User logged out successfully',
  SESSION_EXCHANGED: 'Session token refreshed successfully',

  // User
  USER_FETCHED: 'User data retrieved successfully',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',

  // General
  REQUEST_SUCCESS: 'Request processed successfully',
  SERVER_RUNNING: 'Server is running',
};

export const VALIDATION_MESSAGES = {
  CODE_REQUIRED: 'Authorization code is required',
  STATE_REQUIRED: 'State parameter is required',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email must be a valid email address',
};
