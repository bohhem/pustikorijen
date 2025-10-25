import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getErrorMessage } from './utils/error.util';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

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
import adminRoutes from './routes/admin.routes';
import geoRoutes from './routes/geo.routes';
import businessAddressRoutes from './routes/business-address.routes';
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

// Admin routes
app.use('/api/v1/admin', adminRoutes);

// Geo lookup routes
app.use('/api/v1/geo', geoRoutes);

// Business address routes
app.use('/api/v1/business-address', businessAddressRoutes);

// Family tree route (separate from persons to avoid conflict)
app.get('/api/v1/branches/:branchId/tree', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const personService = (await import('./services/person.service')).default;
    const tree = await personService.getFamilyTree(branchId);
    res.json({ tree });
  } catch (error: unknown) {
    console.error('Error fetching family tree:', error);
    const message = getErrorMessage(error) || 'Failed to fetch family tree';
    res.status(400).json({ error: message });
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
  } catch (error: unknown) {
    console.error('Error recalculating generations:', error);
    const message = getErrorMessage(error);
    res.status(500).json({
      error: 'Failed to recalculate generations',
      details: message || undefined
    });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorWithStatus = err as { status?: number };
  const status = typeof errorWithStatus.status === 'number' ? errorWithStatus.status : 500;
  const message = getErrorMessage(err) || 'Internal server error';
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
  res.status(status).json({
    error: message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/api/v1`);
});

export default app;
