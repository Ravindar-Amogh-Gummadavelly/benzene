import express from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

export default router;
