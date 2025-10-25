import { Request, Response } from 'express';
import {
  listStates,
  listRegionsByState,
  listCitiesByRegion,
  listCitiesByState,
  getCityDetail,
} from '../services/geo.service';
import { getErrorMessage } from '../utils/error.util';

export async function getStates(_req: Request, res: Response) {
  const states = await listStates();
  res.json({ states });
}

export async function getRegionsByState(req: Request, res: Response) {
  try {
    const { stateId } = req.params;
    const regions = await listRegionsByState(stateId);
    res.json({ regions });
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to load regions';
    res.status(400).json({ error: message });
  }
}

export async function getCitiesByRegion(req: Request, res: Response) {
  try {
    const { regionId } = req.params;
    const cities = await listCitiesByRegion(regionId);
    res.json({ cities });
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to load cities';
    res.status(400).json({ error: message });
  }
}

export async function getCitiesByState(req: Request, res: Response) {
  try {
    const { stateId } = req.params;
    const cities = await listCitiesByState(stateId);
    res.json({ cities });
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to load cities';
    res.status(400).json({ error: message });
  }
}

export async function getCity(req: Request, res: Response) {
  try {
    const { cityId } = req.params;
    const city = await getCityDetail(cityId);
    res.json({ city });
  } catch (error) {
    const message = getErrorMessage(error) || 'City not found';
    res.status(404).json({ error: message });
  }
}
