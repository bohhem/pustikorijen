import { Router } from 'express';
import {
  createPerson,
  getPersonsByBranch,
  getPersonById,
  updatePerson,
  deletePerson,
} from '../controllers/person.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Person routes (nested under branches)
router.post('/', authenticateToken, createPerson);
router.get('/', authenticateToken, getPersonsByBranch);
router.get('/:personId', authenticateToken, getPersonById);
router.patch('/:personId', authenticateToken, updatePerson);
router.delete('/:personId', authenticateToken, deletePerson);

export default router;
