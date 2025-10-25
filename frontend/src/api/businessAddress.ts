import api from '../lib/axios';
import type {
  GuruBusinessAddress,
  PersonBusinessAddress,
  UpsertGuruBusinessAddressPayload,
  PersonBusinessAddressPayload,
} from '../types/businessAddress';

export async function getGuruBusinessAddress(): Promise<GuruBusinessAddress | null> {
  const response = await api.get('/business-address/guru');
  return response.data.address ?? null;
}

export async function saveGuruBusinessAddress(payload: UpsertGuruBusinessAddressPayload): Promise<GuruBusinessAddress> {
  const response = await api.put('/business-address/guru', payload);
  return response.data.address;
}

export async function getPersonBusinessAddresses(branchId: string, personId: string): Promise<PersonBusinessAddress[]> {
  const response = await api.get(`/branches/${branchId}/persons/${personId}/business-addresses`);
  return response.data.addresses ?? [];
}

export async function createPersonBusinessAddress(
  branchId: string,
  personId: string,
  payload: PersonBusinessAddressPayload
): Promise<PersonBusinessAddress> {
  const response = await api.post(`/branches/${branchId}/persons/${personId}/business-addresses`, payload);
  return response.data.address;
}

export async function updatePersonBusinessAddress(
  branchId: string,
  personId: string,
  addressId: string,
  payload: PersonBusinessAddressPayload
): Promise<PersonBusinessAddress> {
  const response = await api.patch(`/branches/${branchId}/persons/${personId}/business-addresses/${addressId}`, payload);
  return response.data.address;
}

export async function deletePersonBusinessAddress(branchId: string, personId: string, addressId: string): Promise<void> {
  await api.delete(`/branches/${branchId}/persons/${personId}/business-addresses/${addressId}`);
}
