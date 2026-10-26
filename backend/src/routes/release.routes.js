import express from 'express';
import { releaseController } from '../controllers/release.controller.js';

const router = express.Router();

// GET /api/releases - List all release requests with filters
router.get('/', releaseController.getAll);

// GET /api/releases/:id - Get release request details
router.get('/:id', releaseController.getById);

// POST /api/releases - Create a new release request for an FDR
router.post('/', releaseController.createRelease);

// PUT /api/releases/:id - Update release request remarks
router.put('/:id', releaseController.updateRelease);

// POST /api/releases/:id/approve - Approve release request and update FDR to RELEASED
router.post('/:id/approve', releaseController.approveRelease);

// POST /api/releases/:id/reject - Reject release request with mandatory remarks
router.post('/:id/reject', releaseController.rejectRelease);

export default router;
