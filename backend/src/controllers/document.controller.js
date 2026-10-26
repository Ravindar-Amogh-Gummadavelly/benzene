import { documentService } from '../services/document.service.js';

export const documentController = {
  /**
   * GET /api/documents
   */
  async getAll(req, res) {
    try {
      const { fdrRecordId, fdrNumber, documentType, search } = req.query;
      const documents = await documentService.getAllDocuments({
        fdrRecordId,
        fdrNumber,
        documentType,
        search,
      });

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
      const created = await documentService.createDocument({
        fdrRecordId,
        fdrNumber,
        fileName,
        filePath,
        documentType,
      });

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
      const updated = await documentService.updateDocument(id, {
        fileName,
        documentType,
        filePath,
      });

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
      const deleted = await documentService.deleteDocument(id);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: `Document with ID '${id}' not found.`,
        });
      }

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
