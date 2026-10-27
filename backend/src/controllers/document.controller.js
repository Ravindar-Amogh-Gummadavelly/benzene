import { documentService } from '../services/document.service.js';

export const documentController = {
  /**
   * GET /api/documents
   */
  async getAll(req, res) {
    try {
      const { fdrRecordId, fdrNumber, documentType, search } = req.query;

      let documents = await documentService.getAllDocuments({
        fdrRecordId,
        fdrNumber,
        documentType,
        search,
      });

      // Institution scoping: if INSTITUTION_USER, only return documents belonging to their institution
      if (req.user?.role === 'INSTITUTION_USER') {
        documents = documents.filter((doc) => doc.institutionId === req.user.institutionId);
      }

      return res.status(200).json({
        status: 'ok',
        count: documents.length,
        data: documents,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching documents.',
      });
    }
  },

  /**
   * GET /api/documents/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);

      if (!document) {
        return res.status(404).json({
          status: 'error',
          message: `Document with ID '${id}' not found.`,
        });
      }

      // Institution scoping check
      if (req.user?.role === 'INSTITUTION_USER') {
        if (document.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to access documents of another institution.',
          });
        }
      }

      return res.status(200).json({
        status: 'ok',
        data: document,
      });
    } catch (error) {
      console.error('Error fetching document by ID:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching document.',
      });
    }
  },

  /**
   * POST /api/documents
   */
  async createDocument(req, res) {
    try {
      const { fdrRecordId, fdrNumber, fileName, filePath, documentType } = req.body || {};

      // If INSTITUTION_USER, verify the FDR belongs to them
      if (req.user?.role === 'INSTITUTION_USER') {
        const { fdrService } = await import('../services/fdr.service.js');
        const fdr = await fdrService.getFdrById(fdrRecordId || fdrNumber);
        if (!fdr || fdr.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You cannot attach documents to an FDR belonging to another institution.',
          });
        }
      }

      const created = await documentService.createDocument(
        {
          fdrRecordId,
          fdrNumber,
          fileName,
          filePath,
          documentType,
        },
        req.user?.id
      );

      return res.status(201).json({
        status: 'ok',
        message: 'Document metadata created successfully.',
        data: created,
      });
    } catch (error) {
      console.error('Error creating document:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while creating document metadata.',
      });
    }
  },

  /**
   * PUT /api/documents/:id
   */
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const { fileName, documentType, filePath } = req.body || {};

      const existing = await documentService.getDocumentById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: `Document with ID '${id}' not found.`,
        });
      }

      if (req.user?.role === 'INSTITUTION_USER') {
        if (existing.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to update documents of another institution.',
          });
        }
      }

      const updated = await documentService.updateDocument(
        id,
        {
          fileName,
          documentType,
          filePath,
        },
        req.user?.id
      );

      return res.status(200).json({
        status: 'ok',
        message: 'Document metadata updated successfully.',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating document:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while updating document metadata.',
      });
    }
  },

  /**
   * DELETE /api/documents/:id
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      const existing = await documentService.getDocumentById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: `Document with ID '${id}' not found.`,
        });
      }

      if (req.user?.role === 'INSTITUTION_USER') {
        if (existing.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to delete documents of another institution.',
          });
        }
      }

      const deleted = await documentService.deleteDocument(id, req.user?.id);

      return res.status(200).json({
        status: 'ok',
        message: 'Document metadata deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while deleting document metadata.',
      });
    }
  },
};
