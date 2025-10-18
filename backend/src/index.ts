import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Pustikorijen API is running' });
});

// API routes
import authRoutes from './routes/auth.routes';
import branchRoutes from './routes/branch.routes';
import personRoutes from './routes/person.routes';
import partnershipRoutes from './routes/partnership.routes';
import { authenticateToken } from './middleware/auth.middleware';

app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'Pustikorijen API v1',
    version: '0.1.0'
  });
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// Branch routes
app.use('/api/v1/branches', branchRoutes);

// Person routes (nested under branches)
app.use('/api/v1/branches/:branchId/persons', personRoutes);

// Partnership routes (nested under branches)
app.use('/api/v1/branches/:branchId/partnerships', partnershipRoutes);

// Family tree route (separate from persons to avoid conflict)
app.get('/api/v1/branches/:branchId/tree', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const personService = (await import('./services/person.service')).default;
    const tree = await personService.getFamilyTree(branchId);
    res.json({ tree });
  } catch (error: any) {
    console.error('Error fetching family tree:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch family tree' });
  }
});

// Recalculate generations route
app.post('/api/v1/branches/:branchId/recalculate-generations', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const personService = (await import('./services/person.service')).default;
    const result = await personService.recalculateGenerations(branchId);
    res.json({
      message: 'Generations recalculated successfully',
      result
    });
  } catch (error: any) {
    console.error('Error recalculating generations:', error);
    res.status(500).json({
      error: 'Failed to recalculate generations',
      details: error.message
    });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/api/v1`);
});

export default app;
