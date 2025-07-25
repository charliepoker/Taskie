import { Router } from 'express';
import authRoutes from './auth';
import healthRoutes from './health';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

export default router;
