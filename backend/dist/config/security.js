"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityConfig = void 0;
exports.securityConfig = {
    rateLimits: {
        auth: {
            windowMs: 15 * 60 * 1000,
            max: 5,
        },
        api: {
            windowMs: 15 * 60 * 1000,
            max: 100,
        },
        strict: {
            windowMs: 15 * 60 * 1000,
            max: 10,
        },
    },
    cors: {
        allowedOrigins: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'https://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400,
    },
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'https:'],
            connectSrc: ["'self'", 'https:'],
            frameAncestors: ["'none'"],
        },
    },
    requestLimits: {
        json: '10mb',
        urlencoded: '10mb',
        parameterLimit: 1000,
    },
    headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
    sqlInjectionPatterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(--|\/\*|\*\/|;|'|"|`)/g,
        /(\bOR\b|\bAND\b).*?[=<>]/gi,
        /\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b/gi,
    ],
    xssPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
    ],
    ipFilter: {
        whitelist: process.env.IP_WHITELIST?.split(',') || [],
        blacklist: process.env.IP_BLACKLIST?.split(',') || [],
    },
    auditLog: {
        level: 'info',
        filename: 'logs/security-audit.log',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
    },
};
exports.default = exports.securityConfig;
//# sourceMappingURL=security.js.map