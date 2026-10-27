import express from 'express';
import { documentController } from '../controllers/document.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all document endpoints with authentication
router.use(authenticate);

// GET /api/documents - List documents with filters (Scoped per role)
router.get('/', documentController.getAll);

// GET /api/documents/:id - Get document metadata by ID
router.get('/:id', documentController.getById);

// POST /api/documents - Create document metadata (All authenticated roles can upload to permitted FDR)
router.post('/', documentController.createDocument);

// PUT /api/documents/:id - Update document metadata
router.put('/:id', documentController.updateDocument);

// DELETE /api/documents/:id - Delete document metadata (Institution users for own, Officers/Admin)
router.delete('/:id', documentController.deleteDocument);

export default router;
