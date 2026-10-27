import { authService } from '../services/auth.service.js';

export const authController = {
  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      const result = await authService.login({ email, password });
      return res.status(200).json({
        status: 'ok',
        message: 'Authentication successful.',
        data: result,
      });
    } catch (error) {
      console.error('Login error:', error.message);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Authentication failed.',
      });
    }
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id);
      return res.status(200).json({
        status: 'ok',
        data: user,
      });
    } catch (error) {
      console.error('getMe error:', error.message);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Error fetching user profile.',
      });
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    // Stateless JWT: Frontend clears localStorage token; optional server acknowledgment
    return res.status(200).json({
      status: 'ok',
      message: 'Logged out successfully.',
    });
  },

  /**
   * GET /api/auth/users (ADMIN only)
   */
  async listUsers(req, res) {
    try {
      const users = await authService.listUsers();
      return res.status(200).json({
        status: 'ok',
        count: users.length,
        data: users,
      });
    } catch (error) {
      console.error('listUsers error:', error.message);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Error fetching users list.',
      });
    }
  },

  /**
   * POST /api/auth/users (ADMIN only)
   */
  async createUser(req, res) {
    try {
      const { email, password, name, role, institutionId } = req.body || {};
      const created = await authService.createUser(
        { email, password, name, role, institutionId },
        req.user?.id
      );
      return res.status(201).json({
        status: 'ok',
        message: 'User created successfully.',
        data: created,
      });
    } catch (error) {
      console.error('createUser error:', error.message);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Error creating user.',
      });
    }
  },

  /**
   * PUT /api/auth/users/:id (ADMIN only)
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, role, institutionId, password } = req.body || {};
      const updated = await authService.updateUser(
        id,
        { name, role, institutionId, password },
        req.user?.id
      );
      return res.status(200).json({
        status: 'ok',
        message: 'User updated successfully.',
        data: updated,
      });
    } catch (error) {
      console.error('updateUser error:', error.message);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Error updating user.',
      });
    }
  },

  /**
   * POST /api/auth/seed-demo (Public / Development helper to seed demo users safely)
   */
  async seedDemoAccounts(req, res) {
    try {
      const results = await authService.ensureDemoAccounts();
      return res.status(200).json({
        status: 'ok',
        message: 'Demo accounts verified and provisioned.',
        data: results,
      });
    } catch (error) {
      console.error('seedDemoAccounts error:', error.message);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Error provisioning demo accounts.',
      });
    }
  },
};
