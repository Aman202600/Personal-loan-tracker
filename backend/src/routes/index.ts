import { Router } from 'express';
import authRoutes from './auth.routes';
import loanRoutes from './loan.routes';
import summaryRoutes from './summary.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mounted module routes
router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/summary', summaryRoutes);

export default router;
