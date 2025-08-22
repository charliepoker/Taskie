export declare const securityConfig: {
    rateLimits: {
        auth: {
            windowMs: number;
            max: number;
        };
        api: {
            windowMs: number;
            max: number;
        };
        strict: {
            windowMs: number;
            max: number;
        };
    };
    cors: {
        allowedOrigins: string[];
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
    };
    csp: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            imgSrc: string[];
            fontSrc: string[];
            connectSrc: string[];
            frameAncestors: string[];
        };
    };
    requestLimits: {
        json: string;
        urlencoded: string;
        parameterLimit: number;
    };
    headers: {
        'X-Content-Type-Options': string;
        'X-Frame-Options': string;
        'X-XSS-Protection': string;
        'Referrer-Policy': string;
        'Permissions-Policy': string;
    };
    sqlInjectionPatterns: RegExp[];
    xssPatterns: RegExp[];
    ipFilter: {
        whitelist: string[];
        blacklist: string[];
    };
    auditLog: {
        level: string;
        filename: string;
        maxsize: number;
        maxFiles: number;
        tailable: boolean;
    };
};
export default securityConfig;
//# sourceMappingURL=security.d.ts.map