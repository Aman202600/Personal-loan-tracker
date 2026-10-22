import { Router } from 'express';
import { summaryController } from '../controllers/summary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect summary endpoint with authentication
router.use(authenticate);

// Get dashboard aggregated summary
router.get('/', summaryController.getSummary);

export default router;
