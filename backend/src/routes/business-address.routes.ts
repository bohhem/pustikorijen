import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getGuruBusinessAddress, upsertGuruBusinessAddress } from '../controllers/business-address.controller';

const router = Router();

router.get('/guru', authenticateToken, getGuruBusinessAddress);
router.put('/guru', authenticateToken, upsertGuruBusinessAddress);

export default router;
