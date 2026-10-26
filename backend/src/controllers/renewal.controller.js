import { renewalService } from '../services/renewal.service.js';

export const renewalController = {
  /**
   * GET /api/renewals
   */
  async getAll(req, res) {
    try {
      const { status, search, institutionId, urgency } = req.query;
      const renewals = await renewalService.getAllRenewals({
        status,
        search,
        institutionId,
        urgency,
      });

      return res.status(200).json({
        status: 'ok',
        count: renewals.length,
        data: renewals,
      });
    } catch (error) {
      console.error('Error fetching renewals:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching renewals.',
      });
    }
  },

  /**
   * GET /api/renewals/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const renewal = await renewalService.getRenewalById(id);

      if (!renewal) {
        return res.status(404).json({
          status: 'error',
          message: `Renewal or FDR record with ID '${id}' not found.`,
        });
      }

      return res.status(200).json({
        status: 'ok',
        data: renewal,
      });
    } catch (error) {
      console.error('Error fetching renewal by ID:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching renewal record.',
      });
    }
  },

  /**
   * POST /api/renewals/:id
   */
  async createRenewal(req, res) {
    try {
      const { id } = req.params;
      const { newMaturityDate, remarks, updateFdrStatus } = req.body || {};

      const result = await renewalService.createRenewal(id, {
        newMaturityDate,
        remarks,
        updateFdrStatus,
      });

      return res.status(201).json({
        status: 'ok',
        message: 'Renewal record created successfully.',
        data: result,
      });
    } catch (error) {
      console.error('Error creating renewal:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while creating renewal.',
      });
    }
  },

  /**
   * PUT /api/renewals/:id
   */
  async updateRenewal(req, res) {
    try {
      const { id } = req.params;
      const { newMaturityDate, remarks } = req.body || {};

      const result = await renewalService.updateRenewal(id, {
        newMaturityDate,
        remarks,
      });

      return res.status(200).json({
        status: 'ok',
        message: 'Renewal updated successfully.',
        data: result,
      });
    } catch (error) {
      console.error('Error updating renewal:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while updating renewal.',
      });
    }
  },

  /**
   * POST /api/renewals/:id/complete
   */
  async completeRenewal(req, res) {
    try {
      const { id } = req.params;
      const { newMaturityDate, extensionYears, remarks } = req.body || {};

      const result = await renewalService.completeRenewal(id, {
        newMaturityDate,
        extensionYears,
        remarks,
      });

      return res.status(200).json({
        status: 'ok',
        message: 'Renewal processed and completed successfully.',
        data: result,
      });
    } catch (error) {
      console.error('Error completing renewal:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while completing renewal.',
      });
    }
  },
};
