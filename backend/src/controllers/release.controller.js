import { releaseService } from '../services/release.service.js';

export const releaseController = {
  /**
   * GET /api/releases
   */
  async getAll(req, res) {
    try {
      const { status, search, fdrNumber } = req.query;
      let institutionId = req.query.institutionId;

      // Scoping for INSTITUTION_USER
      if (req.user?.role === 'INSTITUTION_USER') {
        institutionId = req.user.institutionId;
      }

      const releases = await releaseService.getAllReleases({
        status,
        search,
        institutionId,
        fdrNumber,
      });

      return res.status(200).json({
        status: 'ok',
        count: releases.length,
        data: releases,
      });
    } catch (error) {
      console.error('Error fetching release requests:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching release requests.',
      });
    }
  },

  /**
   * GET /api/releases/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const release = await releaseService.getReleaseById(id);

      if (!release) {
        return res.status(404).json({
          status: 'error',
          message: `Release request with ID '${id}' not found.`,
        });
      }

      // Scoping check for INSTITUTION_USER
      if (req.user?.role === 'INSTITUTION_USER') {
        if (release.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to view release requests of another institution.',
          });
        }
      }

      return res.status(200).json({
        status: 'ok',
        data: release,
      });
    } catch (error) {
      console.error('Error fetching release request by ID:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching release request.',
      });
    }
  },

  /**
   * POST /api/releases
   */
  async createRelease(req, res) {
    try {
      const { fdrId, fdrNumber, remarks } = req.body || {};

      // If INSTITUTION_USER, verify the FDR belongs to them before creating release request
      if (req.user?.role === 'INSTITUTION_USER') {
        const { fdrService } = await import('../services/fdr.service.js');
        const fdr = await fdrService.getFdrById(fdrId || fdrNumber);
        if (!fdr || fdr.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You cannot request release for an FDR belonging to another institution.',
          });
        }
      }

      const created = await releaseService.createReleaseRequest(
        { fdrId, fdrNumber, remarks },
        req.user?.id
      );

      return res.status(201).json({
        status: 'ok',
        message: 'Release request created successfully.',
        data: created,
      });
    } catch (error) {
      console.error('Error creating release request:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while creating release request.',
      });
    }
  },

  /**
   * PUT /api/releases/:id
   */
  async updateRelease(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};

      const existing = await releaseService.getReleaseById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: `Release request with ID '${id}' not found.`,
        });
      }

      // Scoping check for INSTITUTION_USER
      if (req.user?.role === 'INSTITUTION_USER') {
        if (existing.institutionId !== req.user.institutionId) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden. You do not have permission to update release requests of another institution.',
          });
        }
      }

      const updated = await releaseService.updateReleaseRequest(id, { remarks }, req.user?.id);

      return res.status(200).json({
        status: 'ok',
        message: 'Release request updated successfully.',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating release request:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while updating release request.',
      });
    }
  },

  /**
   * POST /api/releases/:id/approve
   */
  async approveRelease(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};
      const approved = await releaseService.approveRelease(id, { remarks }, req.user?.id);

      return res.status(200).json({
        status: 'ok',
        message: 'Release request approved and FDR marked as RELEASED.',
        data: approved,
      });
    } catch (error) {
      console.error('Error approving release request:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while approving release request.',
      });
    }
  },

  /**
   * POST /api/releases/:id/reject
   */
  async rejectRelease(req, res) {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};
      const rejected = await releaseService.rejectRelease(id, { remarks }, req.user?.id);

      return res.status(200).json({
        status: 'ok',
        message: 'Release request rejected successfully.',
        data: rejected,
      });
    } catch (error) {
      console.error('Error rejecting release request:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while rejecting release request.',
      });
    }
  },
};
