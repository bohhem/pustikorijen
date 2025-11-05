import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  listGuruBusinessAddresses,
  createGuruBusinessAddress,
  updateGuruBusinessAddress,
  deleteGuruBusinessAddress,
  setPrimaryGuruBusinessAddress,
} from '../controllers/business-address.controller';

const router = Router();

router.get('/guru', authenticateToken, listGuruBusinessAddresses);
router.post('/guru', authenticateToken, createGuruBusinessAddress);
router.put('/guru/:addressId', authenticateToken, updateGuruBusinessAddress);
router.patch('/guru/:addressId/primary', authenticateToken, setPrimaryGuruBusinessAddress);
router.delete('/guru/:addressId', authenticateToken, deleteGuruBusinessAddress);

export default router;
