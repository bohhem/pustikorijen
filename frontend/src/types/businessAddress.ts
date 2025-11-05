import type { GeoCity } from './geo';

export interface BusinessAddressBase {
  id: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  googleMapsPlaceId?: string;
  googleMapsUrl?: string;
  geoCity?: GeoCity;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuruBusinessAddress extends BusinessAddressBase {
  isPublic: boolean;
  isPrimary: boolean;
}

export interface PersonBusinessAddress extends BusinessAddressBase {
  personId: string;
  isPrimary: boolean;
  notes?: string;
}

export interface UpsertGuruBusinessAddressPayload {
  geoCityId: string;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsPlaceId?: string | null;
  googleMapsUrl?: string | null;
  isPublic?: boolean;
  isPrimary?: boolean;
}

export interface PersonBusinessAddressPayload {
  geoCityId: string;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsPlaceId?: string | null;
  googleMapsUrl?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
}
