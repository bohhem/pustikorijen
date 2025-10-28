import { Router } from 'express';
import {
  getStates,
  getRegionsByState,
  getCitiesByRegion,
  getCitiesByState,
  getCity,
  getPeopleLedger,
} from '../controllers/geo.controller';

const router = Router();

router.get('/states', getStates);
router.get('/states/:stateId/regions', getRegionsByState);
router.get('/states/:stateId/cities', getCitiesByState);
router.get('/regions/:regionId/cities', getCitiesByRegion);
router.get('/cities/:cityId', getCity);
router.get('/regions/:regionId/people-ledger', getPeopleLedger);

export default router;
