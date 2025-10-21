import { Router } from 'express';
import { authenticateToken, requireSuperGuru } from '../middleware/auth.middleware';
import {
  assignRegionGuru,
  createRegion,
  deleteRegionAssignment,
  getAdminRegions,
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

export default router;
