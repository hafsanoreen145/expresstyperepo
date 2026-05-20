/**
 * Joi Validation Schemas
 * Centralized validation rules for API requests
 */

import Joi from 'joi';

/**
 * OAuth Callback validation schema
 */
export const oauthCallbackSchema = Joi.object({
  code: Joi.string().required().messages({
    'string.empty': 'Authorization code cannot be empty',
    'any.required': 'Authorization code is required',
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State parameter cannot be empty',
    'any.required': 'State parameter is required',
  }),
  error: Joi.string().optional(),
});

/**
 * User email validation schema
 */
export const emailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required',
    }),
});

/**
 * Generic pagination schema
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

/**
 * Query string ID validation
 */
export const idParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required',
  }),
});

/**
 * Session exchange validation
 */
export const sessionExchangeSchema = Joi.object({
  token: Joi.string().optional(),
});
