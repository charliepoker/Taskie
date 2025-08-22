import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
declare const securityLogger: winston.Logger;
export declare const createRateLimit: (options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const strictRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityAuditLog: (req: Request, res: Response, next: NextFunction) => void;
export declare const sqlInjectionProtection: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeLimit: (maxSize?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const ipFilter: (options: {
    whitelist?: string[];
    blacklist?: string[];
}) => (req: Request, res: Response, next: NextFunction) => void;
export { securityLogger };
//# sourceMappingURL=security.d.ts.map