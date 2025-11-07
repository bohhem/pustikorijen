import type { Branch } from '../types/branch';

export function formatBranchLocation(branch: Branch): string {
  const city = branch.location?.name ?? branch.cityName;
  const regionName =
    branch.location?.region?.name ??
    branch.location?.entity?.name ??
    branch.adminRegion?.name ??
    branch.location?.state?.name ??
    branch.country;
  const country = branch.location?.state?.name ?? branch.country;

  if (regionName) {
    return `${city}, ${regionName}`;
  }

  if (country) {
    return `${city}, ${country}`;
  }

  return city;
}

export function formatRegionPath(
  path: Array<{ name: string }> | undefined,
  delimiter = ' → '
): string {
  if (!path || path.length === 0) {
    return '';
  }
  return path.map((crumb) => crumb.name).join(delimiter);
}
