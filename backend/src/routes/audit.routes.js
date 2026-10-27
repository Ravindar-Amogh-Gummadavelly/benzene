import express from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all audit routes: only AICTE_OFFICER, APPROVING_OFFICER, and ADMIN can access global audit logs
router.use(authenticate);
router.use(authorize('AICTE_OFFICER', 'APPROVING_OFFICER', 'ADMIN'));

// GET /api/audit-logs - List audit logs with filters
router.get('/', auditController.getAll);

// GET /api/audit-logs/:id - Get audit log by ID
router.get('/:id', auditController.getById);

export default router;
