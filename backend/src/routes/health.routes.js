import express from 'express';

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AICTE Security Deposit & FDR Management Portal - Backend API',
    timestamp: new Date().toISOString()
  });
});

export default router;
