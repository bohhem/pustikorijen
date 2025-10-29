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

const router = Router();

// Require authentication + SuperGuru role for all admin routes
router.use(authenticateToken, requireSuperGuru);

router.get('/regions', getAdminRegions);
router.post('/regions', createRegion);
router.post('/regions/:regionId/assignments', assignRegionGuru);
router.patch('/regions/:regionId/assignments/:assignmentId', updateRegionAssignment);
router.delete('/regions/:regionId/assignments/:assignmentId', deleteRegionAssignment);

router.get('/bridge-issues', listBridgeIssues);
router.post('/bridge-issues/:linkId/primary', assignPrimaryBridge);
router.delete('/bridge-issues/:linkId/primary', removePrimaryBridge);
router.post('/bridge-issues/:linkId/reject', rejectBridgeLink);
router.post('/bridge-issues/:linkId/generation', updateBridgeGeneration);

export default router;
