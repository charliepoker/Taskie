import { Router } from 'express';
import authRoutes from './auth';
import healthRoutes from './health';
import userRoutes from './users';
import projectRoutes from './projects';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// Project management routes
router.use('/projects', projectRoutes);

export default router;
