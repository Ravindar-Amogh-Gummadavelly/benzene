import express from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect dashboard endpoints with authentication
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

export default router;
