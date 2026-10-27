import express from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all reports endpoints: only AICTE_OFFICER, APPROVING_OFFICER, and ADMIN can access statutory reports
router.use(authenticate);
router.use(authorize('AICTE_OFFICER', 'APPROVING_OFFICER', 'ADMIN'));

// GET /api/reports/fdr-summary
router.get('/fdr-summary', reportController.getFdrSummary);

// GET /api/reports/maturity
router.get('/maturity', reportController.getMaturityReport);

// GET /api/reports/verification
router.get('/verification', reportController.getVerificationReport);

// GET /api/reports/releases
router.get('/releases', reportController.getReleaseReport);

export default router;
