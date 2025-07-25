import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError, FieldError } from '../types';

// Validation middleware factory
export const validate = (
  schema: z.ZodSchema<any>,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data =
        target === 'body'
          ? req.body
          : target === 'query'
            ? req.query
            : req.params;
      const validatedData = schema.parse(data);

      // Replace the original data with validated data
      if (target === 'body') {
        req.body = validatedData;
      } else if (target === 'query') {
        req.query = validatedData;
      } else {
        req.params = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: ValidationError = {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { target },
          timestamp: new Date().toISOString(),
          path: req.path,
          fields: error.issues.map(
            (err): FieldError => ({
              field: err.path.join('.'),
              message: err.message,
              value: (err as any).received,
            })
          ),
        };

        res.status(400).json({
          success: false,
          error: validationError,
        });
        return;
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during validation',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  };
};

// Convenience functions for common validation targets
export const validateBody = (schema: z.ZodSchema<any>) =>
  validate(schema, 'body');
export const validateQuery = (schema: z.ZodSchema<any>) =>
  validate(schema, 'query');
export const validateParams = (schema: z.ZodSchema<any>) =>
  validate(schema, 'params');

// Multiple validation middleware (for validating multiple targets)
export const validateMultiple = (
  validations: Array<{
    schema: z.ZodSchema<any>;
    target: 'body' | 'query' | 'params';
  }>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: FieldError[] = [];

    for (const { schema, target } of validations) {
      try {
        const data =
          target === 'body'
            ? req.body
            : target === 'query'
              ? req.query
              : req.params;
        const validatedData = schema.parse(data);

        // Replace the original data with validated data
        if (target === 'body') {
          req.body = validatedData;
        } else if (target === 'query') {
          req.query = validatedData;
        } else {
          req.params = validatedData;
        }
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(
            ...error.issues.map(
              (err): FieldError => ({
                field: `${target}.${err.path.join('.')}`,
                message: err.message,
                value: (err as any).received,
              })
            )
          );
        }
      }
    }

    if (errors.length > 0) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { targets: validations.map((v) => v.target) },
        timestamp: new Date().toISOString(),
        path: req.path,
        fields: errors,
      };

      res.status(400).json({
        success: false,
        error: validationError,
      });
      return;
    }

    next();
  };
};

// Response validation middleware (for validating API responses in development)
export const validateResponse = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'development') {
      const originalSend = res.send;

      res.send = function (data: any) {
        try {
          if (data && typeof data === 'object') {
            const parsedData =
              typeof data === 'string' ? JSON.parse(data) : data;
            if (parsedData.success && parsedData.data) {
              schema.parse(parsedData.data);
            }
          }
        } catch (error) {
          console.warn('Response validation failed:', error);
          // In development, log the error but don't break the response
        }

        return originalSend.call(this, data);
      };
    }

    next();
  };
};
