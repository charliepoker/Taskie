/**
 * Configuration type definitions
 */

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  resetBetweenTests: boolean;
  runMigrations: boolean;
  enableLogging: boolean;
}

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  db: number;
  password?: string;
  connectTimeout: number;
  commandTimeout: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  mockMode: boolean;
  enableOfflineQueue: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface SecurityConfig {
  rateLimits: {
    auth: RateLimitConfig;
    api: RateLimitConfig;
    strict: RateLimitConfig;
  };
  cors: {
    origin: string[] | boolean;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
  };
  csp: {
    directives: Record<string, string[]>;
  };
  requestLimits: {
    json: string;
    urlencoded: string;
    parameterLimit: number;
  };
  headers: Record<string, string>;
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
    enabled: boolean;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
  };
  bcrypt: {
    rounds: number;
  };
  disableRateLimit: boolean;
}

export interface LoggingConfig {
  level: string;
  silent: boolean;
  format: string;
  enableConsole: boolean;
  enableFile: boolean;
  filename: string;
  maxsize: number;
  maxFiles: number;
}

export interface CorsConfig {
  origin: string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

export interface AppConfig {
  environment: string;
  isTest: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  port: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
  cors: CorsConfig;
}
