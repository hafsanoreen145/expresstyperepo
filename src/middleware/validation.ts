/**
 * Request Validation Middleware
 * Validates request query, body, and params using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError as JoiValidationError } from 'joi';
import { ValidationError } from '../helpers/errors';

export interface ValidatedRequest extends Request {
  validated?: {
    body?: any;
    query?: any;
    params?: any;
  };
}

/**
 * Create validation middleware
 */
export function validate(schemas: {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}) {
  return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated: any = {};
      const errors: Record<string, string[]> = {};

      // Validate body
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
        });
        if (error) {
          error.details.forEach((detail) => {
            if (!errors[detail.path[0]]) {
              errors[detail.path[0]] = [];
            }
            errors[detail.path[0]].push(detail.message);
          });
        }
        validated.body = value;
      }

      // Validate query
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          abortEarly: false,
        });
        if (error) {
          error.details.forEach((detail) => {
            if (!errors[detail.path[0]]) {
              errors[detail.path[0]] = [];
            }
            errors[detail.path[0]].push(detail.message);
          });
        }
        validated.query = value;
      }

      // Validate params
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, {
          abortEarly: false,
        });
        if (error) {
          error.details.forEach((detail) => {
            if (!errors[detail.path[0]]) {
              errors[detail.path[0]] = [];
            }
            errors[detail.path[0]].push(detail.message);
          });
        }
        validated.params = value;
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Request validation failed', errors);
      }

      req.validated = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}
