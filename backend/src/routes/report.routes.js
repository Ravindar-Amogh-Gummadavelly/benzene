import express from 'express';
import { reportController } from '../controllers/report.controller.js';

const router = express.Router();

// GET /api/reports/fdr-summary
router.get('/fdr-summary', reportController.getFdrSummary);

// GET /api/reports/maturity
router.get('/maturity', reportController.getMaturityReport);

// GET /api/reports/verification
router.get('/verification', reportController.getVerificationReport);

// GET /api/reports/releases
router.get('/releases', reportController.getReleaseReport);

export default router;
