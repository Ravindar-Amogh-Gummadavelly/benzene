import express from 'express';
import { auditController } from '../controllers/audit.controller.js';

const router = express.Router();

// GET /api/audit-logs - List audit logs with filters
router.get('/', auditController.getAll);

// GET /api/audit-logs/:id - Get audit log by ID
router.get('/:id', auditController.getById);

export default router;
