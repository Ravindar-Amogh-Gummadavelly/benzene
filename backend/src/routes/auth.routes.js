import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/seed-demo', authController.seedDemoAccounts);

// Protected auth endpoints
router.get('/me', authenticate, authController.getMe);

// Admin-only user management endpoints
router.get('/users', authenticate, authorize('ADMIN'), authController.listUsers);
router.post('/users', authenticate, authorize('ADMIN'), authController.createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), authController.updateUser);

export default router;
