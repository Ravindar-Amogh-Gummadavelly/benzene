import { verificationService } from '../services/verification.service.js';

export const verificationController = {
  /**
   * GET /api/verifications
   */
  async getVerifications(req, res) {
    try {
      const { status, search } = req.query;
      let institutionId = req.query.institutionId;

      // Scoping for INSTITUTION_USER
      if (req.user?.role === 'INSTITUTION_USER') {
        institutionId = req.user.institutionId;
      }

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

      // Scoping check for INSTITUTION_USER
      if (req.user?.role === 'INSTITUTION_USER') {
        if (record.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to view verification details of another institution.',
          });
        }
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

      const updated = await verificationService.approveVerification(
        id,
        { remarks },
        req.user?.id
      );

      return res.status(200).json({
        status: 'ok',
        message: 'FDR verification approved successfully.',
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
        message: 'Failed to approve verification record.',
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

      const updated = await verificationService.raiseDiscrepancy(
        id,
        { remarks },
        req.user?.id
      );

      return res.status(200).json({
        status: 'ok',
        message: 'Discrepancy notice flagged for FDR verification.',
        data: updated,
      });
    } catch (error) {
      console.error(`Error raising discrepancy on verification ${req.params.id}:`, error);
      if (error.statusCode === 400 || error.statusCode === 404) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Failed to flag discrepancy on verification record.',
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

      const updated = await verificationService.rejectVerification(
        id,
        { remarks },
        req.user?.id
      );

      return res.status(200).json({
        status: 'ok',
        message: 'FDR verification rejected and marked with discrepancy.',
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
        message: 'Failed to reject verification record.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};
