import { Router } from 'express';
import {
  createPerson,
  getPersonsByBranch,
  getPersonById,
  updatePerson,
  deletePerson,
  movePerson,
} from '../controllers/person.controller';
import { createPersonClaimController } from '../controllers/person-claim.controller';
import {
  listPersonBusinessAddresses,
  createPersonBusinessAddress,
  updatePersonBusinessAddress,
  deletePersonBusinessAddress,
} from '../controllers/business-address.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Person routes (nested under branches)
router.post('/', authenticateToken, createPerson);
router.get('/', authenticateToken, getPersonsByBranch);
router.get('/:personId', authenticateToken, getPersonById);
router.patch('/:personId', authenticateToken, updatePerson);
router.delete('/:personId', authenticateToken, deletePerson);
router.post('/:personId/move', authenticateToken, movePerson);
router.post('/:personId/claim', authenticateToken, createPersonClaimController);
router.get('/:personId/business-addresses', authenticateToken, listPersonBusinessAddresses);
router.post('/:personId/business-addresses', authenticateToken, createPersonBusinessAddress);
router.patch('/:personId/business-addresses/:addressId', authenticateToken, updatePersonBusinessAddress);
router.delete('/:personId/business-addresses/:addressId', authenticateToken, deletePersonBusinessAddress);


export default router;
