import { verificationService } from '../services/verification.service.js';

export const verificationController = {
  /**
   * GET /api/verifications
   */
  async getVerifications(req, res) {
    try {
      const { status, search, institutionId } = req.query;
      const data = await verificationService.getAllVerifications({ status, search, institutionId });
      return res.status(200).json({
        status: 'ok',
        data,
      });
    } catch (error) {
      console.error('Error fetching verifications:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve verification records.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/verifications/:id
   */
  async getVerificationById(req, res) {
    try {
      const { id } = req.params;
      const record = await verificationService.getVerificationById(id);

      if (!record) {
        return res.status(404).json({
          status: 'error',
          message: `Verification record with ID '${id}' not found.`,
        });
      }

      return res.status(200).json({
        status: 'ok',
        data: record,
      });
    } catch (error) {
      console.error(`Error retrieving verification ${req.params.id}:`, error);
      if (error.statusCode === 400) {
        return res.status(400).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve verification record.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * POST /api/verifications/:id/approve
   */
  async approveVerification(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};
      const updated = await verificationService.approveVerification(id, { remarks });

      return res.status(200).json({
        status: 'ok',
        message: 'Verification approved successfully.',
        data: updated,
      });
    } catch (error) {
      console.error(`Error approving verification ${req.params.id}:`, error);
      if (error.statusCode === 400 || error.statusCode === 404) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to approve verification.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * POST /api/verifications/:id/discrepancy
   */
  async raiseDiscrepancy(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};

      if (!remarks || typeof remarks !== 'string' || !remarks.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Discrepancy remarks are required and cannot be empty.',
        });
      }

      const updated = await verificationService.raiseDiscrepancy(id, { remarks });

      return res.status(200).json({
        status: 'ok',
        message: 'Discrepancy raised successfully.',
        data: updated,
      });
    } catch (error) {
      console.error(`Error raising discrepancy on ${req.params.id}:`, error);
      if (error.statusCode === 400 || error.statusCode === 404) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to raise discrepancy.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * POST /api/verifications/:id/reject
   */
  async rejectVerification(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};

      if (!remarks || typeof remarks !== 'string' || !remarks.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason/remarks are required and cannot be empty.',
        });
      }

      const updated = await verificationService.rejectVerification(id, { remarks });

      return res.status(200).json({
        status: 'ok',
        message: 'Verification rejected successfully.',
        data: updated,
      });
    } catch (error) {
      console.error(`Error rejecting verification ${req.params.id}:`, error);
      if (error.statusCode === 400 || error.statusCode === 404) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to reject verification.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};
