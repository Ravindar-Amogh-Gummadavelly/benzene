import express from 'express';
import { verificationController } from '../controllers/verification.controller.js';

const router = express.Router();

// List & Query
router.get('/', verificationController.getVerifications);

// Single Record Details
router.get('/:id', verificationController.getVerificationById);

// Decision Actions
router.post('/:id/approve', verificationController.approveVerification);
router.post('/:id/discrepancy', verificationController.raiseDiscrepancy);
router.post('/:id/reject', verificationController.rejectVerification);

export default router;
