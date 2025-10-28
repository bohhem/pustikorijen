export interface GeoState {
  id: string;
  name: string;
  iso2?: string;
  iso3?: string;
}

export interface GeoRegion {
  id: string;
  name: string;
  code?: string;
  type: string;
  parentRegionId?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeoMetrics {
  population2013?: number;
  settlements?: number;
  densityPerKm2?: number;
  areaKm2?: number;
}

export interface GeoCity {
  id: string;
  code: string;
  name: string;
  slug: string;
  coordinates?: GeoCoordinates;
  metrics?: GeoMetrics;
  region?: GeoRegion;
  entity?: GeoRegion;
  state?: GeoState;
}

export interface PeopleLedgerEntry {
  personId: string;
  fullName: string;
  surname?: string;
  approxAge?: number | null;
  branchId: string;
  branchName: string;
  geoCityId?: string;
  cityName?: string;
  regionName?: string;
}
