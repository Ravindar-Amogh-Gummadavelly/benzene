import express from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import { authenticate, authorize, enforceInstitutionScope } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all verification routes with authentication
router.use(authenticate);

// List & Query (Institution users only see their own queue; officers see all)
router.get('/', enforceInstitutionScope, verificationController.getVerifications);

// Single Record Details
router.get('/:id', verificationController.getVerificationById);

// Decision Actions (Restricted strictly to AICTE_OFFICER and ADMIN)
router.post('/:id/approve', authorize('AICTE_OFFICER', 'ADMIN'), verificationController.approveVerification);
router.post('/:id/discrepancy', authorize('AICTE_OFFICER', 'ADMIN'), verificationController.raiseDiscrepancy);
router.post('/:id/reject', authorize('AICTE_OFFICER', 'ADMIN'), verificationController.rejectVerification);

export default router;
