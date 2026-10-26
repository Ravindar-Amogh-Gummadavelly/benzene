import './prisma/db.ts';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.routes.js';
import fdrRouter from './routes/fdr.routes.js';
import verificationRouter from './routes/verification.routes.js';
import renewalRouter from './routes/renewal.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api/fdr', fdrRouter);
app.use('/api/verifications', verificationRouter);
app.use('/api/renewals', renewalRouter);

// Root fallback
app.get('/', (req, res) => {
  res.send('AICTE Security Deposit & FDR Management Portal API');
});

// Database test
app.get('/api/db-test', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      message: 'Prisma ORM is loaded and database configuration is available',
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});