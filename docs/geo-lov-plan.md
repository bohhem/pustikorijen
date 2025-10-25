# Bosnia & Herzegovina Location LOV Rollout Plan

## 1. Overview

Goal: replace free-text branch location fields with authoritative lookup tables that cover Bosnia and Herzegovina’s full administrative hierarchy, use native spellings (e.g., “Tešanj”), store GPS coordinates, and unlock Guru/person business addresses tied to Google Maps.

Data source: `data/geo/bih_locations.json` (generated via `scripts/data/fetch_bih_locations.py`). It contains:
- One `state` record (Bosna i Hercegovina, ISO `BA`).
- Region LOV: entities (FBiH, RS), Brčko District, and all 10 FBiH cantons with seats + lat/lon.
- 145 municipality/city records with population, density, area, “official city” flag, precise coordinates, Wikidata IDs, and parent references.

## 2. Database design (Prisma + Postgres)

### 2.1 Geography tables
| Table | Key columns | Notes |
| --- | --- | --- |
| `geo_states` | `state_id` (PK, e.g., `bih`), `iso2`, `iso3`, `name`, `wikidata_id`, `latitude`, `longitude`, timestamps | Seed once per supported country. |
| `geo_regions` | `region_id` (PK), `state_id` FK → `geo_states`, `parent_region_id` (self-FK), `name`, `name_native`, `code`, `type` (`entity`, `district`, `canton`, `other`), `wikidata_id`, `seat`, `latitude`, `longitude`, timestamps | All entities/cantons/districts. |
| `geo_cities` | `city_id` (PK, e.g., `FBiH-tesanj`), `state_id` FK, `region_id` FK (nullable for RS cities w/out canton), `entity_region_id` FK (RS/FBiH/BD), `name`, `slug`, `wikidata_id`, `is_official_city`, `latitude`, `longitude`, `population_2013`, `num_settlements`, `density_per_km2`, `area_km2`, timestamps | Main LOV referenced by branches, gurus, persons. |

Indexes:
- `geo_regions (state_id, type)` for filtering.
- `geo_cities (state_id, region_id, name)`.
- Unique slug per state (`state_id`, `slug`).

### 2.2 Branch linkage migration
1. Add `geo_city_id` FK → `geo_cities` to `family_branches`.
2. Temporarily keep legacy columns (`city_code`, `city_name`, `region`, `country`) until data is backfilled:
   - Write migration script that maps existing rows by matching normalized `city_name` to `geo_cities.name`.
   - For conflicts/unmatched rows, log them in a “needs review” table or report.
3. Once all branches have `geo_city_id`, drop the redundant columns or keep `city_name` as denormalized cache (populated via relation).

### 2.3 Business address tables
| Table | Purpose | Columns |
| --- | --- | --- |
| `guru_business_addresses` | Single public business location per Guru (unique on `user_id`). | `address_id` (PK), `user_id` FK (unique), `geo_city_id` FK, `label` (default “Poslovna adresa”), `address_line1`, `address_line2`, `postal_code`, `latitude`, `longitude`, `google_maps_place_id`, `google_maps_url`, `is_public`, timestamps. |
| `person_business_addresses` | Multiple per person. | `address_id` (PK), `person_id` FK, `geo_city_id` FK, `label`, `address_line1`, `address_line2`, `postal_code`, `latitude`, `longitude`, `google_maps_place_id`, `google_maps_url`, `is_primary`, `notes`, timestamps. |

Constraints:
- `guru_business_addresses.user_id` unique.
- `person_business_addresses` has optional unique partial index for `(person_id)` where `is_primary = true`.
- Foreign keys cascade on delete (if person is removed, addresses go with them).

## 3. Seed strategy
1. Commit the generated JSON and script (done).
2. Create Prisma seed helper that reads `data/geo/bih_locations.json` and upserts into `geo_states`, `geo_regions`, `geo_cities`.
   - Use deterministic IDs from JSON (`state_id`, `region_id`, `city_id`) to keep referential integrity stable.
   - Include `created_at/updated_at` timestamps via `now()`.
3. Add verification step in CI (simple Node/TS script) to ensure JSON and DB counts align (e.g., expect 145 `geo_cities` for BiH).

## 4. Backend changes
### 4.1 Prisma schema
- Add new models for the tables above with proper indexes.
- Modify `family_branches` to include `geo_city_id` relation.
- Introduce `guru_business_addresses` & `person_business_addresses` models.

### 4.2 Services & DTOs
- Expose read-only LOV endpoints:
  - `GET /geo/states`
  - `GET /geo/states/:id/regions`
  - `GET /geo/regions/:id/cities`
  - `GET /geo/cities/:id`
  (Supports caching on the frontend; data infrequently changes.)
- Update branch create/update DTOs to require `geo_city_id` instead of free text; API responses should include resolved `city_name`, `region_name`, `entity_name`, and coordinates.
- Add Guru business address endpoints:
  - `GET/PUT /gurus/:id/business-address`.
  - Enforce Guru role, upsert style (single record).
- Add person business address endpoints:
  - `GET /persons/:id/business-addresses`
  - `POST /persons/:id/business-addresses`
  - `PATCH /persons/:id/business-addresses/:addressId`
  - `DELETE /persons/:id/business-addresses/:addressId`
  - Validation: `geo_city_id` must exist, optional lat/lon overrides allowed, `google_maps_url` validated via regex.

### 4.3 Authorization & validation
- Only branch Gurus or admins can set Guru business addresses.
- Person addresses editable by Gurus with edit permissions or account owners (depending on product rules).
- Rate limit updates to prevent abuse.

### 4.4 Migration rollout
1. Deploy migrations adding new tables + columns.
2. Seed LOV tables.
3. Backfill `family_branches.geo_city_id`.
4. Deploy API changes that read from both old/new fields (dual-write during transition).
5. Clean up deprecated columns once UI fully migrated.

## 5. Frontend updates
- Replace free-text city/region inputs with cascaded selects:
  1. Select entity (`Federacija`, `Republika Srpska`, `Brčko`).
  2. If entity = FBiH, show canton select.
  3. Select city/municipality (populated from `/geo/regions/:id/cities`).
- Display locale-friendly names and optionally show coordinates with a “View on map” link (using lat/lon).
- Branch detail pages should show location as `Grad/Općina – Kanton (if any) – Entity, Bosnia i Hercegovina`.
- Guru dashboard: add form to manage their single business address (map preview using stored coordinates/Maps URL).
- Person profile: new “Business Addresses” section listing multiple entries with Maps links; add creation/edit modals.

## 6. Testing & monitoring
- Unit tests for new services + validators.
- Integration test covering branch creation/updating with LOV.
- Seed integrity test verifying JSON vs DB counts/hashes.
- UI E2E test scenario: create branch selecting `Tešanj`, verify rendered hierarchy ∧ stored `geo_city_id`.
- Logging/analytics for address updates to monitor adoption.

## 7. Future considerations
- Extend LOV dataset + tables to cover other countries as needed (JSON structure already generic).
- Add optional `geo_subdivision_levels` table if we later need finer breakdowns (e.g., neighborhoods).
- Consider caching LOV data in Redis for faster reads, invalidating when JSON regenerates.
