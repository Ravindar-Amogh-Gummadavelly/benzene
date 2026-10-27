import { dashboardService } from '../services/dashboard.service.js';

export const dashboardController = {
  /**
   * GET /api/dashboard/stats
   */
  async getStats(req, res) {
    try {
      let institutionId = req.query.institutionId;

      // Scoping for INSTITUTION_USER
      if (req.user?.role === 'INSTITUTION_USER') {
        institutionId = req.user.institutionId;
      }

      const stats = await dashboardService.getStats({ institutionId });
      return res.status(200).json({
        status: 'ok',
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching dashboard stats.',
      });
    }
  },
};
