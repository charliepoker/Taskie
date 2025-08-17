"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityLogger = exports.ipFilter = exports.requestSizeLimit = exports.sqlInjectionProtection = exports.securityAuditLog = exports.securityHeaders = exports.sanitizeInput = exports.strictRateLimit = exports.apiRateLimit = exports.authRateLimit = exports.createRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const winston_1 = __importDefault(require("winston"));
const security_1 = __importDefault(require("../config/security"));
const prisma = new client_1.PrismaClient();
const securityLogger = winston_1.default.createLogger({
    level: security_1.default.auditLog.level,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'security-audit' },
    transports: [
        new winston_1.default.transports.File({
            filename: security_1.default.auditLog.filename,
            maxsize: security_1.default.auditLog.maxsize,
            maxFiles: security_1.default.auditLog.maxFiles,
            tailable: security_1.default.auditLog.tailable,
        }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple(),
        }),
    ],
});
exports.securityLogger = securityLogger;
const createRateLimit = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: {
            success: false,
            error: options.message || 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        handler: (req, res) => {
            securityLogger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString(),
            });
            res.status(429).json({
                success: false,
                error: options.message || 'Too many requests, please try again later',
                code: 'RATE_LIMIT_EXCEEDED',
            });
        },
    });
};
exports.createRateLimit = createRateLimit;
exports.authRateLimit = (0, exports.createRateLimit)({
    windowMs: security_1.default.rateLimits.auth.windowMs,
    max: security_1.default.rateLimits.auth.max,
    message: 'Too many authentication attempts, please try again in 15 minutes',
});
exports.apiRateLimit = (0, exports.createRateLimit)({
    windowMs: security_1.default.rateLimits.api.windowMs,
    max: security_1.default.rateLimits.api.max,
    message: 'Too many API requests, please try again later',
});
exports.strictRateLimit = (0, exports.createRateLimit)({
    windowMs: security_1.default.rateLimits.strict.windowMs,
    max: security_1.default.rateLimits.strict.max,
    message: 'Too many requests to this endpoint, please try again later',
});
const sanitizeInput = (req, res, next) => {
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            let sanitized = value;
            security_1.default.xssPatterns.forEach((pattern) => {
                sanitized = sanitized.replace(pattern, '');
            });
            return sanitized.trim();
        }
        if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        }
        if (value && typeof value === 'object') {
            const sanitized = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = sanitizeValue(val);
            }
            return sanitized;
        }
        return value;
    };
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
const securityHeaders = (req, res, next) => {
    const cspDirectives = Object.entries(security_1.default.csp.directives)
        .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${directive} ${values.join(' ')}`;
    })
        .join('; ');
    res.setHeader('Content-Security-Policy', cspDirectives);
    Object.entries(security_1.default.headers).forEach(([header, value]) => {
        res.setHeader(header, value);
    });
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityHeaders = securityHeaders;
const securityAuditLog = (req, res, next) => {
    const startTime = Date.now();
    const logSecurityEvent = (event, details = {}) => {
        securityLogger.info(event, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
            ...details,
        });
    };
    if (req.path.includes('/auth/')) {
        logSecurityEvent('AUTH_ATTEMPT', {
            endpoint: req.path,
            email: req.body?.email,
        });
    }
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        logSecurityEvent('SENSITIVE_OPERATION', {
            operation: `${req.method} ${req.path}`,
        });
    }
    const originalJson = res.json;
    res.json = function (body) {
        const responseTime = Date.now() - startTime;
        if (req.path.includes('/auth/') &&
            (!body.success || res.statusCode >= 400)) {
            logSecurityEvent('AUTH_FAILURE', {
                statusCode: res.statusCode,
                responseTime,
                error: body.error,
            });
        }
        if (res.statusCode === 401 || res.statusCode === 403) {
            logSecurityEvent('UNAUTHORIZED_ACCESS', {
                statusCode: res.statusCode,
                responseTime,
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.securityAuditLog = securityAuditLog;
const sqlInjectionProtection = (req, res, next) => {
    const checkForSqlInjection = (value) => {
        if (typeof value !== 'string')
            return false;
        return security_1.default.sqlInjectionPatterns.some((pattern) => pattern.test(value));
    };
    const checkObject = (obj) => {
        if (typeof obj === 'string') {
            return checkForSqlInjection(obj);
        }
        if (Array.isArray(obj)) {
            return obj.some(checkObject);
        }
        if (obj && typeof obj === 'object') {
            return Object.values(obj).some(checkObject);
        }
        return false;
    };
    if (checkObject(req.body) || checkObject(req.query)) {
        securityLogger.warn('SQL injection attempt detected', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            timestamp: new Date().toISOString(),
        });
        res.status(400).json({
            success: false,
            error: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
    next();
};
exports.sqlInjectionProtection = sqlInjectionProtection;
const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = req.get('content-length');
        if (contentLength) {
            const sizeInBytes = parseInt(contentLength, 10);
            const maxSizeInBytes = parseSize(maxSize);
            if (sizeInBytes > maxSizeInBytes) {
                securityLogger.warn('Request size limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    contentLength: sizeInBytes,
                    maxAllowed: maxSizeInBytes,
                    timestamp: new Date().toISOString(),
                });
                res.status(413).json({
                    success: false,
                    error: 'Request entity too large',
                    code: 'REQUEST_TOO_LARGE',
                });
                return;
            }
        }
        next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
const parseSize = (size) => {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
    if (!match)
        return 0;
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return value * (units[unit] || 1);
};
const ipFilter = (options) => {
    return (req, res, next) => {
        const clientIp = req.ip || req.connection.remoteAddress || '';
        if (options.blacklist && options.blacklist.includes(clientIp)) {
            securityLogger.warn('Blocked IP attempted access', {
                ip: clientIp,
                path: req.path,
                timestamp: new Date().toISOString(),
            });
            res.status(403).json({
                success: false,
                error: 'Access denied',
                code: 'IP_BLOCKED',
            });
            return;
        }
        if (options.whitelist && options.whitelist.length > 0) {
            if (!options.whitelist.includes(clientIp)) {
                securityLogger.warn('Non-whitelisted IP attempted access', {
                    ip: clientIp,
                    path: req.path,
                    timestamp: new Date().toISOString(),
                });
                res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    code: 'IP_NOT_WHITELISTED',
                });
                return;
            }
        }
        next();
    };
};
exports.ipFilter = ipFilter;
//# sourceMappingURL=security.js.map