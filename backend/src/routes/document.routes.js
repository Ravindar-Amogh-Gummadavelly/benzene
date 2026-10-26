import express from 'express';
import { documentController } from '../controllers/document.controller.js';

const router = express.Router();

// GET /api/documents - List documents with filters
router.get('/', documentController.getAll);

// GET /api/documents/:id - Get document metadata by ID
router.get('/:id', documentController.getById);

// POST /api/documents - Create document metadata
router.post('/', documentController.createDocument);

// PUT /api/documents/:id - Update document metadata
router.put('/:id', documentController.updateDocument);

// DELETE /api/documents/:id - Delete document metadata
router.delete('/:id', documentController.deleteDocument);

export default router;
