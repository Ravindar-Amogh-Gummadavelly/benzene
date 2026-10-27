import express from 'express';
import { fdrController } from '../controllers/fdr.controller.js';
import { authenticate, authorize, enforceInstitutionScope } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all FDR endpoints with authentication
router.use(authenticate);

// Specific routes first
router.get('/stats', fdrController.getStats);

// Collection routes
router.get('/', enforceInstitutionScope, fdrController.getFdrs);
router.post('/', authorize('INSTITUTION_USER', 'AICTE_OFFICER', 'ADMIN'), fdrController.createFdr);

// Single resource routes by ID or FDR number
router.get('/:id', fdrController.getFdrById);
router.put('/:id', authorize('INSTITUTION_USER', 'AICTE_OFFICER', 'ADMIN'), fdrController.updateFdr);
router.delete('/:id', authorize('AICTE_OFFICER', 'ADMIN'), fdrController.deleteFdr);

export default router;
