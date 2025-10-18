import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
} from '../controllers/partnership.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All partnership routes require authentication
router.use(authenticateToken);

// Branch partnerships
router.post('/', create); // Create partnership
router.get('/', list); // List all partnerships in branch
router.get('/:id', getById); // Get partnership by ID
router.patch('/:id', update); // Update partnership
router.delete('/:id', remove); // Delete partnership

export default router;
