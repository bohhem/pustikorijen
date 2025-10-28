import api from '../lib/axios';
import type { Person, CreatePersonInput, UpdatePersonInput } from '../types/person';
import type { MovePersonPayload } from '../types/branch';

export async function getPersonsByBranch(branchId: string): Promise<Person[]> {
  const response = await api.get(`/branches/${branchId}/persons`);
  return response.data.persons;
}

export async function getPersonById(branchId: string, personId: string): Promise<Person> {
  const response = await api.get(`/branches/${branchId}/persons/${personId}`);
  return response.data.person;
}

export async function createPerson(branchId: string, data: CreatePersonInput): Promise<Person> {
  const response = await api.post(`/branches/${branchId}/persons`, data);
  return response.data.person;
}

export async function updatePerson(
  branchId: string,
  personId: string,
  data: UpdatePersonInput
): Promise<Person> {
  const response = await api.patch(`/branches/${branchId}/persons/${personId}`, data);
  return response.data.person;
}

export async function claimPerson(
  branchId: string,
  personId: string,
  message?: string
): Promise<{ claim: { id: string; status: string } }> {
  const response = await api.post(`/branches/${branchId}/persons/${personId}/claim`, message ? { message } : {});
  return response.data;
}

export async function deletePerson(branchId: string, personId: string): Promise<void> {
  await api.delete(`/branches/${branchId}/persons/${personId}`);
}

export async function getFamilyTree(branchId: string): Promise<Person[]> {
  const response = await api.get(`/branches/${branchId}/tree`);
  return response.data.tree;
}

export async function movePerson(branchId: string, personId: string, payload: MovePersonPayload) {
  const response = await api.post(`/branches/${branchId}/persons/${personId}/move`, payload);
  return response.data.person as Person;
}
