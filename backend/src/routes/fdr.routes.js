import express from 'express';
import { fdrController } from '../controllers/fdr.controller.js';

const router = express.Router();

// Specific routes first
router.get('/stats', fdrController.getStats);

// Collection routes
router.get('/', fdrController.getFdrs);
router.post('/', fdrController.createFdr);

// Single resource routes by ID or FDR number
router.get('/:id', fdrController.getFdrById);
router.put('/:id', fdrController.updateFdr);
router.delete('/:id', fdrController.deleteFdr);

export default router;
