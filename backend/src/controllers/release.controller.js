import { releaseService } from '../services/release.service.js';

export const releaseController = {
  /**
   * GET /api/releases
   */
  async getAll(req, res) {
    try {
      const { status, search, institutionId, fdrNumber } = req.query;
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
      const created = await releaseService.createReleaseRequest({
        fdrId,
        fdrNumber,
        remarks,
      });

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
      const updated = await releaseService.updateReleaseRequest(id, { remarks });

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
      const approved = await releaseService.approveRelease(id, { remarks });

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
      const rejected = await releaseService.rejectRelease(id, { remarks });

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
