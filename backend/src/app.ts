import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './utils/database';
import healthRouter from './routes/health';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check routes
app.use('/health', healthRouter);

// API routes will be added here
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
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
