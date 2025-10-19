import { Router } from 'express';
import {
  create,
  list,
  getById,
  getMembers,
  joinRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  updateRole,
} from '../controllers/branch.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', list); // List all public branches
router.get('/:id', getById); // Get branch details
router.get('/:id/members', getMembers); // Get branch members

// Protected routes (require authentication)
router.post('/', authenticateToken, create); // Create branch
router.post('/:id/join', authenticateToken, joinRequest); // Request to join

// Guru-only routes
router.get('/:id/join-requests', authenticateToken, getPendingRequests); // Get pending requests
router.post('/:id/join-requests/approve', authenticateToken, approveRequest); // Approve request
router.post('/:id/join-requests/reject', authenticateToken, rejectRequest); // Reject request
router.patch('/:id/members/:userId/role', authenticateToken, updateRole); // Update member role

export default router;
