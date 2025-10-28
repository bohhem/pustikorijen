import api from '../lib/axios';
import type { GeoState, GeoRegion, GeoCity, PeopleLedgerEntry } from '../types/geo';

export async function getGeoStates(): Promise<GeoState[]> {
  const response = await api.get('/geo/states');
  return response.data.states ?? [];
}

export async function getGeoRegions(stateId: string): Promise<GeoRegion[]> {
  const response = await api.get(`/geo/states/${stateId}/regions`);
  return response.data.regions ?? [];
}

export async function getCitiesByRegion(regionId: string): Promise<GeoCity[]> {
  const response = await api.get(`/geo/regions/${regionId}/cities`);
  return response.data.cities ?? [];
}

export async function getCitiesByState(stateId: string): Promise<GeoCity[]> {
  const response = await api.get(`/geo/states/${stateId}/cities`);
  return response.data.cities ?? [];
}

export async function getGeoCity(cityId: string): Promise<GeoCity> {
  const response = await api.get(`/geo/cities/${cityId}`);
  return response.data.city;
}

export async function getPeopleLedger(regionId: string, params?: { q?: string; limit?: number }): Promise<PeopleLedgerEntry[]> {
  const response = await api.get(`/geo/regions/${regionId}/people-ledger`, {
    params,
  });
  return response.data.ledger ?? [];
}
