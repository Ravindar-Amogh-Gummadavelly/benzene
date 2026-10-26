import { reportService } from '../services/report.service.js';

export const reportController = {
  /**
   * GET /api/reports/fdr-summary
   */
  async getFdrSummary(req, res) {
    try {
      const { institutionId, status } = req.query;
      const report = await reportService.getFdrSummaryReport({ institutionId, status });
      return res.status(200).json({
        status: 'ok',
        data: report,
      });
    } catch (error) {
      console.error('Error fetching FDR summary report:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching FDR summary report.',
      });
    }
  },

  /**
   * GET /api/reports/maturity
   */
  async getMaturityReport(req, res) {
    try {
      const { timeframe } = req.query;
      const report = await reportService.getMaturityReport({ timeframe });
      return res.status(200).json({
        status: 'ok',
        data: report,
      });
    } catch (error) {
      console.error('Error fetching maturity report:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching maturity report.',
      });
    }
  },

  /**
   * GET /api/reports/verification
   */
  async getVerificationReport(req, res) {
    try {
      const report = await reportService.getVerificationReport();
      return res.status(200).json({
        status: 'ok',
        data: report,
      });
    } catch (error) {
      console.error('Error fetching verification report:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching verification report.',
      });
    }
  },

  /**
   * GET /api/reports/releases
   */
  async getReleaseReport(req, res) {
    try {
      const report = await reportService.getReleaseReport();
      return res.status(200).json({
        status: 'ok',
        data: report,
      });
    } catch (error) {
      console.error('Error fetching release report:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching release report.',
      });
    }
  },
};
