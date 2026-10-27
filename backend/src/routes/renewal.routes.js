import express from 'express';
import { renewalController } from '../controllers/renewal.controller.js';
import { authenticate, authorize, enforceInstitutionScope } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all renewal endpoints with authentication
router.use(authenticate);

// GET /api/renewals - List all renewals / maturity tracking items (Institution users scoped to own)
router.get('/', enforceInstitutionScope, renewalController.getAll);

// GET /api/renewals/:id - Get detailed renewal dossier
router.get('/:id', renewalController.getById);

// POST /api/renewals/:id - Create renewal record for FDR
router.post('/:id', authorize('INSTITUTION_USER', 'AICTE_OFFICER', 'ADMIN'), renewalController.createRenewal);

// PUT /api/renewals/:id - Update renewal record
router.put('/:id', authorize('INSTITUTION_USER', 'AICTE_OFFICER', 'ADMIN'), renewalController.updateRenewal);

// POST /api/renewals/:id/complete - Complete renewal and update FDR maturity (AICTE_OFFICER and ADMIN only)
router.post('/:id/complete', authorize('AICTE_OFFICER', 'ADMIN'), renewalController.completeRenewal);

export default router;
