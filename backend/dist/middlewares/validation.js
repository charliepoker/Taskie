"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResponse = exports.validateRequest = exports.validateMultiple = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            const data = target === 'body'
                ? req.body
                : target === 'query'
                    ? req.query
                    : req.params;
            const validatedData = schema.parse(data);
            if (target === 'body') {
                req.body = validatedData;
            }
            else if (target === 'query') {
                req.query = validatedData;
            }
            else {
                req.params = validatedData;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationError = {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: { target },
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    fields: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        value: err.received,
                    })),
                };
                res.status(400).json({
                    success: false,
                    error: validationError,
                });
                return;
            }
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
exports.validate = validate;
const validateBody = (schema) => (0, exports.validate)(schema, 'body');
exports.validateBody = validateBody;
const validateQuery = (schema) => (0, exports.validate)(schema, 'query');
exports.validateQuery = validateQuery;
const validateParams = (schema) => (0, exports.validate)(schema, 'params');
exports.validateParams = validateParams;
const validateMultiple = (validations) => {
    return (req, res, next) => {
        const errors = [];
        for (const { schema, target } of validations) {
            try {
                const data = target === 'body'
                    ? req.body
                    : target === 'query'
                        ? req.query
                        : req.params;
                const validatedData = schema.parse(data);
                if (target === 'body') {
                    req.body = validatedData;
                }
                else if (target === 'query') {
                    req.query = validatedData;
                }
                else {
                    req.params = validatedData;
                }
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    errors.push(...error.issues.map((err) => ({
                        field: `${target}.${err.path.join('.')}`,
                        message: err.message,
                        value: err.received,
                    })));
                }
            }
        }
        if (errors.length > 0) {
            const validationError = {
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
exports.validateMultiple = validateMultiple;
const validateRequest = (schemas) => {
    return (req, res, next) => {
        const errors = [];
        Object.entries(schemas).forEach(([target, schema]) => {
            if (!schema)
                return;
            try {
                const data = target === 'body'
                    ? req.body
                    : target === 'query'
                        ? req.query
                        : req.params;
                const validatedData = schema.parse(data);
                if (target === 'body') {
                    req.body = validatedData;
                }
                else if (target === 'query') {
                    req.query = validatedData;
                }
                else if (target === 'params') {
                    req.params = validatedData;
                }
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    errors.push(...error.issues.map((err) => ({
                        field: `${target}.${err.path.join('.')}`,
                        message: err.message,
                        value: err.received,
                    })));
                }
            }
        });
        if (errors.length > 0) {
            const validationError = {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: { targets: Object.keys(schemas) },
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
exports.validateRequest = validateRequest;
const validateResponse = (schema) => {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'development') {
            const originalSend = res.send;
            res.send = function (data) {
                try {
                    if (data && typeof data === 'object') {
                        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                        if (parsedData.success && parsedData.data) {
                            schema.parse(parsedData.data);
                        }
                    }
                }
                catch (error) {
                    console.warn('Response validation failed:', error);
                }
                return originalSend.call(this, data);
            };
        }
        next();
    };
};
exports.validateResponse = validateResponse;
//# sourceMappingURL=validation.js.map