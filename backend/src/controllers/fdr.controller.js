import { fdrService } from '../services/fdr.service.js';
import { validateFdrInput } from '../utils/fdrValidator.js';

export const fdrController = {
  /**
   * GET /api/fdr
   * Optional query params: status, institutionId, search
   */
  async getFdrs(req, res) {
    try {
      const { status, institutionId, search } = req.query;
      const data = await fdrService.getAllFdrs({ status, institutionId, search });
      return res.status(200).json({
        status: 'ok',
        data,
      });
    } catch (error) {
      console.error('Error fetching FDRs:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve FDR records.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/fdr/stats
   */
  async getStats(req, res) {
    try {
      const data = await fdrService.getStats();
      return res.status(200).json({
        status: 'ok',
        data,
      });
    } catch (error) {
      console.error('Error calculating FDR statistics:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to compute FDR statistics.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/fdr/:id
   */
  async getFdrById(req, res) {
    try {
      const { id } = req.params;
      const record = await fdrService.getFdrById(id);

      if (!record) {
        return res.status(404).json({
          status: 'error',
          message: `FDR record with ID or number '${id}' not found.`,
        });
      }

      return res.status(200).json({
        status: 'ok',
        data: record,
      });
    } catch (error) {
      console.error(`Error retrieving FDR ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve FDR record.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * POST /api/fdr
   */
  async createFdr(req, res) {
    try {
      const validation = validateFdrInput(req.body, false);
      if (!validation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed.',
          errors: validation.errors,
        });
      }

      const created = await fdrService.createFdr(req.body);
      return res.status(201).json({
        status: 'ok',
        data: created,
      });
    } catch (error) {
      console.error('Error creating FDR:', error);
      if (error.statusCode === 400) {
        return res.status(400).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create FDR record.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * PUT /api/fdr/:id
   */
  async updateFdr(req, res) {
    try {
      const { id } = req.params;

      const validation = validateFdrInput(req.body, true);
      if (!validation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed.',
          errors: validation.errors,
        });
      }

      const updated = await fdrService.updateFdr(id, req.body);
      if (!updated) {
        return res.status(404).json({
          status: 'error',
          message: `FDR record with ID '${id}' not found.`,
        });
      }

      return res.status(200).json({
        status: 'ok',
        data: updated,
      });
    } catch (error) {
      console.error(`Error updating FDR ${req.params.id}:`, error);
      if (error.statusCode === 400) {
        return res.status(400).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update FDR record.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * DELETE /api/fdr/:id
   */
  async deleteFdr(req, res) {
    try {
      const { id } = req.params;
      const success = await fdrService.deleteFdr(id);

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: `FDR record with ID '${id}' not found.`,
        });
      }

      return res.status(200).json({
        status: 'ok',
        message: `FDR record with ID '${id}' deleted successfully.`,
      });
    } catch (error) {
      console.error(`Error deleting FDR ${req.params.id}:`, error);
      if (error.statusCode === 400) {
        return res.status(400).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete FDR record.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};
