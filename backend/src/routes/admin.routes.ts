import { Router } from 'express';
import { authenticateToken, requireSuperGuru } from '../middleware/auth.middleware';
import {
  assignPrimaryBridge,
  assignRegionGuru,
  createRegion,
  deleteRegionAssignment,
  getAdminRegions,
  listBridgeIssues,
  removePrimaryBridge,
  rejectBridgeLink,
  updateBridgeGeneration,
  updateRegionAssignment,
} from '../controllers/admin.controller';
import {
  listUsers,
  searchUsersEndpoint,
  getUserStats,
  getUserDetail,
  getUserBranchesEndpoint,
  getUserActivityEndpoint,
  updateUserRoleEndpoint,
  deactivateUserEndpoint,
  reactivateUserEndpoint,
  sendNotificationEndpoint,
} from '../controllers/user.controller';

const router = Router();

// Require authentication + SuperGuru role for all admin routes
router.use(authenticateToken, requireSuperGuru);

// Region management routes
router.get('/regions', getAdminRegions);
router.post('/regions', createRegion);
router.post('/regions/:regionId/assignments', assignRegionGuru);
router.patch('/regions/:regionId/assignments/:assignmentId', updateRegionAssignment);
router.delete('/regions/:regionId/assignments/:assignmentId', deleteRegionAssignment);

// Bridge issue management routes
router.get('/bridge-issues', listBridgeIssues);
router.post('/bridge-issues/:linkId/primary', assignPrimaryBridge);
router.delete('/bridge-issues/:linkId/primary', removePrimaryBridge);
router.post('/bridge-issues/:linkId/reject', rejectBridgeLink);
router.post('/bridge-issues/:linkId/generation', updateBridgeGeneration);

// User management routes
router.get('/users', listUsers);
router.get('/users/search', searchUsersEndpoint);
router.get('/users/stats', getUserStats);
router.get('/users/:userId', getUserDetail);
router.get('/users/:userId/branches', getUserBranchesEndpoint);
router.get('/users/:userId/activity', getUserActivityEndpoint);
router.patch('/users/:userId/role', updateUserRoleEndpoint);
router.post('/users/:userId/deactivate', deactivateUserEndpoint);
router.post('/users/:userId/reactivate', reactivateUserEndpoint);
router.post('/users/:userId/notify', sendNotificationEndpoint);

export default router;
