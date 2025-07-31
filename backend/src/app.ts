import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './utils/database';
import routes from './routes';
import { performanceMiddleware } from './services/performanceMonitoringService';
import {
  securityHeaders,
  sanitizeInput,
  securityAuditLog,
  sqlInjectionProtection,
  requestSizeLimit,
  apiRateLimit,
} from './middlewares/security';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // We'll handle this in our custom middleware
    crossOriginEmbedderPolicy: false,
  })
);

// Custom security headers
app.use(securityHeaders);

// CORS configuration with enhanced security
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'https://localhost:3000',
      ];

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
  })
);

// Security audit logging
app.use(securityAuditLog);

// Request size limiting
app.use(requestSizeLimit('10mb'));

// SQL injection protection
app.use(sqlInjectionProtection);

// Input sanitization
app.use(sanitizeInput);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware with size limits
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // Additional verification can be added here
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000,
  })
);

// Global API rate limiting
app.use('/api', apiRateLimit);

// Performance monitoring middleware
app.use(performanceMiddleware());

// API routes
app.use('/api', routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  }
);

export default app;
