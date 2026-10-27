import express from 'express';
import { releaseController } from '../controllers/release.controller.js';
import { authenticate, authorize, enforceInstitutionScope } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all release request routes with authentication
router.use(authenticate);

// GET /api/releases - List all release requests with filters (Institution users scoped to own)
router.get('/', enforceInstitutionScope, releaseController.getAll);

// GET /api/releases/:id - Get release request details
router.get('/:id', releaseController.getById);

// POST /api/releases - Create a new release request for an FDR
router.post('/', authorize('INSTITUTION_USER', 'AICTE_OFFICER', 'ADMIN'), releaseController.createRelease);

// PUT /api/releases/:id - Update release request remarks
router.put('/:id', authorize('INSTITUTION_USER', 'AICTE_OFFICER', 'ADMIN'), releaseController.updateRelease);

// POST /api/releases/:id/approve - Approve release request and update FDR to RELEASED (APPROVING_OFFICER and ADMIN only)
router.post('/:id/approve', authorize('APPROVING_OFFICER', 'ADMIN'), releaseController.approveRelease);

// POST /api/releases/:id/reject - Reject release request with mandatory remarks (APPROVING_OFFICER and ADMIN only)
router.post('/:id/reject', authorize('APPROVING_OFFICER', 'ADMIN'), releaseController.rejectRelease);

export default router;
