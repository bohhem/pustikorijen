import { Router } from 'express';
import {
  create,
  list,
  getById,
  getConnectedFamiliesController,
  updateBranchController,
  getMembers,
  joinRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  updateRole,
  searchLinkCandidates,
  createPersonLink,
  listPersonLinksController,
  approvePersonLinkRequest,
  rejectPersonLinkRequest,
  getMultiBranchTreeController,
} from '../controllers/branch.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import {
  listBranchPlaceholders,
  createBranchPlaceholder,
  claimBranchPlaceholder,
  listBranchPlaceholderClaims,
  resolveBranchPlaceholderClaim,
} from '../controllers/placeholder.controller';

const router = Router();

// Public routes
router.get('/', list); // List all public branches
router.get('/:id', getById); // Get branch details
router.get('/:id/members', getMembers); // Get branch members
router.get('/:id/connected-families', authenticateToken, getConnectedFamiliesController);
router.get('/:id/tree/connected', authenticateToken, getMultiBranchTreeController); // Get multi-branch tree
router.get('/:id/placeholders', optionalAuth, listBranchPlaceholders);
router.get('/:id/placeholders/claims', authenticateToken, listBranchPlaceholderClaims);

// Protected routes (require authentication)
router.post('/', authenticateToken, create); // Create branch
router.patch('/:id', authenticateToken, updateBranchController); // Update branch details
router.post('/:id/join', authenticateToken, joinRequest); // Request to join
router.post('/:id/placeholders', authenticateToken, createBranchPlaceholder);
router.post('/:id/placeholders/:placeholderId/claim', authenticateToken, claimBranchPlaceholder);
router.post('/:id/placeholders/:claimId/resolve', authenticateToken, resolveBranchPlaceholderClaim);

// Guru-only routes
router.get('/:id/join-requests', authenticateToken, getPendingRequests); // Get pending requests
router.post('/:id/join-requests/approve', authenticateToken, approveRequest); // Approve request
router.post('/:id/join-requests/reject', authenticateToken, rejectRequest); // Reject request
router.patch('/:id/members/:userId/role', authenticateToken, updateRole); // Update member role
router.get('/:id/person-links/candidates', authenticateToken, searchLinkCandidates);
router.get('/:id/person-links', authenticateToken, listPersonLinksController);
router.post('/:id/person-links', authenticateToken, createPersonLink);
router.post('/:id/person-links/:linkId/approve', authenticateToken, approvePersonLinkRequest);
router.post('/:id/person-links/:linkId/reject', authenticateToken, rejectPersonLinkRequest);

export default router;
