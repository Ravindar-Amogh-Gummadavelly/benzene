import express from 'express';
import { renewalController } from '../controllers/renewal.controller.js';

const router = express.Router();

// GET /api/renewals - List all renewals / maturity tracking items
router.get('/', renewalController.getAll);

// GET /api/renewals/:id - Get detailed renewal dossier
router.get('/:id', renewalController.getById);

// POST /api/renewals/:id - Create renewal record for FDR
router.post('/:id', renewalController.createRenewal);

// PUT /api/renewals/:id - Update renewal record
router.put('/:id', renewalController.updateRenewal);

// POST /api/renewals/:id/complete - Complete renewal and update FDR maturity
router.post('/:id/complete', renewalController.completeRenewal);

export default router;
