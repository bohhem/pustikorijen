import type { Branch } from '../types/branch';

export function formatBranchLocation(branch: Branch): string {
  const city = branch.location?.name ?? branch.cityName;
  const regionName =
    branch.location?.region?.name ??
    branch.location?.entity?.name ??
    branch.region ??
    branch.location?.state?.name;
  const country = branch.location?.state?.name ?? branch.country;

  if (regionName) {
    return `${city}, ${regionName}`;
  }

  if (country) {
    return `${city}, ${country}`;
  }

  return city;
}
