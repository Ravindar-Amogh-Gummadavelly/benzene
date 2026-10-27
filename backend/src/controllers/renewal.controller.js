import { renewalService } from '../services/renewal.service.js';

export const renewalController = {
  /**
   * GET /api/renewals
   */
  async getAll(req, res) {
    try {
      const { status, search, urgency } = req.query;
      let institutionId = req.query.institutionId;

      if (req.user?.role === 'INSTITUTION_USER') {
        institutionId = req.user.institutionId;
      }

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

      if (req.user?.role === 'INSTITUTION_USER') {
        if (renewal.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to access renewals of another institution.',
          });
        }
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

      const existing = await renewalService.getRenewalById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: `Record with ID '${id}' not found.`,
        });
      }

      if (req.user?.role === 'INSTITUTION_USER') {
        if (existing.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to initiate renewals for another institution.',
          });
        }
      }

      const result = await renewalService.createRenewal(
        id,
        {
          newMaturityDate,
          remarks,
          updateFdrStatus,
        },
        req.user?.id
      );

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

      const existing = await renewalService.getRenewalById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: `Record with ID '${id}' not found.`,
        });
      }

      if (req.user?.role === 'INSTITUTION_USER') {
        if (existing.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to update renewals for another institution.',
          });
        }
      }

      const result = await renewalService.updateRenewal(
        id,
        {
          newMaturityDate,
          remarks,
        },
        req.user?.id
      );

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

      const result = await renewalService.completeRenewal(
        id,
        {
          newMaturityDate,
          extensionYears,
          remarks,
        },
        req.user?.id
      );

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
