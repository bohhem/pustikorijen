import { Router } from 'express';
import { authenticateToken, requireFullSuperGuru, requireSuperGuru } from '../middleware/auth.middleware';
import {
  assignPrimaryBridge,
  assignRegionGuru,
  createBackupSnapshotController,
  createRegion,
  archiveBranchAdmin,
  updateBranchRegion,
  deleteRegionAssignment,
  getAdminRegions,
  getAdminRegionTree,
  getBackupSummary,
  hardDeleteBranchAdmin,
  listBridgeIssues,
  listAdminBranches,
  listBackupHistory,
  downloadBackupManifest,
  removePrimaryBridge,
  rejectBridgeLink,
  unarchiveBranchAdmin,
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
router.get('/regions/tree', getAdminRegionTree);
router.post('/regions', requireFullSuperGuru, createRegion);
router.post('/regions/:regionId/assignments', requireFullSuperGuru, assignRegionGuru);
router.patch('/regions/:regionId/assignments/:assignmentId', requireFullSuperGuru, updateRegionAssignment);
router.delete('/regions/:regionId/assignments/:assignmentId', requireFullSuperGuru, deleteRegionAssignment);

// Branch management routes
router.get('/branches', listAdminBranches);
router.post('/branches/:branchId/archive', archiveBranchAdmin);
router.post('/branches/:branchId/unarchive', unarchiveBranchAdmin);
router.delete('/branches/:branchId', hardDeleteBranchAdmin);
router.post('/branches/:branchId/region', updateBranchRegion);

// Backup routes
router.get('/backups/summary', requireFullSuperGuru, getBackupSummary);
router.get('/backups', requireFullSuperGuru, listBackupHistory);
router.post('/backups', requireFullSuperGuru, createBackupSnapshotController);
router.get('/backups/:backupId/manifest', requireFullSuperGuru, downloadBackupManifest);

// Bridge issue management routes
router.get('/bridge-issues', requireFullSuperGuru, listBridgeIssues);
router.post('/bridge-issues/:linkId/primary', requireFullSuperGuru, assignPrimaryBridge);
router.delete('/bridge-issues/:linkId/primary', requireFullSuperGuru, removePrimaryBridge);
router.post('/bridge-issues/:linkId/reject', requireFullSuperGuru, rejectBridgeLink);
router.post('/bridge-issues/:linkId/generation', requireFullSuperGuru, updateBridgeGeneration);

// User management routes
router.get('/users', requireFullSuperGuru, listUsers);
router.get('/users/search', requireFullSuperGuru, searchUsersEndpoint);
router.get('/users/stats', requireFullSuperGuru, getUserStats);
router.get('/users/:userId', requireFullSuperGuru, getUserDetail);
router.get('/users/:userId/branches', requireFullSuperGuru, getUserBranchesEndpoint);
router.get('/users/:userId/activity', requireFullSuperGuru, getUserActivityEndpoint);
router.patch('/users/:userId/role', requireFullSuperGuru, updateUserRoleEndpoint);
router.post('/users/:userId/deactivate', requireFullSuperGuru, deactivateUserEndpoint);
router.post('/users/:userId/reactivate', requireFullSuperGuru, reactivateUserEndpoint);
router.post('/users/:userId/notify', requireFullSuperGuru, sendNotificationEndpoint);

export default router;
