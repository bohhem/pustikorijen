#!/usr/bin/env python3
"""
Fetch Eurostat GISCO datasets to build an EU-wide geography dataset.

The script downloads:
    1. Countries (EU-27 members) from GISCO "Countries" theme
    2. NUTS regions (levels 0-3) from GISCO "NUTS" theme
    3. Urban Audit 2021 city points from GISCO "Urban Audit" theme

It aggregates the data into a JSON document suitable for populating
List-of-Values (LOV) selectors that require EU countries, regions, and cities.

Output file: data/geo/eu_locations.json

Usage:
    python3 scripts/data/fetch_eu_locations.py

Requirements:
    pip install requests
"""

from __future__ import annotations

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

GISCO_BASE = "https://gisco-services.ec.europa.eu/distribution/v2"

COUNTRIES_URL = f"{GISCO_BASE}/countries/geojson/CNTR_RG_60M_2020_4326.geojson"
NUTS_URL = f"{GISCO_BASE}/nuts/geojson/NUTS_RG_60M_2021_4326.geojson"
URBAN_AUDIT_CITIES_URL = f"{GISCO_BASE}/urau/geojson/URAU_LB_2021_4326_CITIES.geojson"

SPARQL_THROTTLE_SECONDS = 1.0  # conservative pause between large file downloads

EU_STATUS_FLAG = "T"

GERMAN_CHAR_MAP = {
    "ä": "ae",
    "ö": "oe",
    "ü": "ue",
    "ß": "ss",
    "Ä": "ae",
    "Ö": "oe",
    "Ü": "ue",
}


class DataFetchError(RuntimeError):
    """Raised when a remote dataset cannot be retrieved."""


def fetch_json(url: str, session: Optional[requests.Session] = None) -> dict:
    """Download JSON content with a friendly pause to avoid hammering GISCO."""
    time.sleep(SPARQL_THROTTLE_SECONDS)
    session = session or requests.Session()
    response = session.get(
        url,
        headers={
            "User-Agent": "PustikorijenBot/1.0 (EU geography fetcher; data-team@pustikorijen)",
            "Accept": "application/json",
        },
        timeout=120,
    )
    if response.status_code != 200:
        raise DataFetchError(f"Failed to download {url} (status {response.status_code})")
    return response.json()


def slugify(value: str) -> str:
    """Slugify a string using ASCII characters."""
    value = "".join(GERMAN_CHAR_MAP.get(char, char) for char in value)
    slug = []
    prev_dash = False
    for char in value.lower():
        if char.isalnum():
            slug.append(char)
            prev_dash = False
        else:
            if not prev_dash:
                slug.append("-")
                prev_dash = True
    result = "".join(slug).strip("-")
    return result or "unknown"


def generate_state_id(iso2: str) -> str:
    return iso2.lower()


def generate_region_id(state_iso2: str, nuts_id: str) -> str:
    return f"{state_iso2.lower()}-{nuts_id.lower()}"


def generate_city_id(state_iso2: str, name: str) -> str:
    return f"{state_iso2.lower()}-{slugify(name)}"


def fetch_eu_member_states(session: Optional[requests.Session] = None) -> Dict[str, dict]:
    """Retrieve EU-27 member metadata from the GISCO countries dataset."""
    payload = fetch_json(COUNTRIES_URL, session=session)
    states: Dict[str, dict] = {}
    for feature in payload.get("features", []):
        props = feature.get("properties", {})
        if props.get("EU_STAT") != EU_STATUS_FLAG:
            continue
        iso2 = props.get("CNTR_ID")
        if not iso2:
            continue
        state_id = generate_state_id(iso2)
        states[iso2] = {
            "state_id": state_id,
            "name": props.get("NAME_ENGL") or props.get("CNTR_NAME"),
            "iso2": iso2,
            "iso3": props.get("ISO3_CODE"),
            "capital": props.get("CAPT"),
            "nuts_id": iso2,
        }
    return states


def fetch_nuts_regions(
    states_by_iso2: Dict[str, dict],
    session: Optional[requests.Session] = None,
) -> Tuple[Dict[str, dict], Dict[str, dict]]:
    """
    Download the NUTS dataset and return region dictionaries.

    Returns:
        Tuple of (nuts_level2, nuts_level3) dicts keyed by nuts_id
    """
    payload = fetch_json(NUTS_URL, session=session)
    level2: Dict[str, dict] = {}
    level3: Dict[str, dict] = {}

    for feature in payload.get("features", []):
        props = feature.get("properties", {})
        nuts_id = props.get("NUTS_ID")
        level_code = props.get("LEVL_CODE")
        country_code = props.get("CNTR_CODE")
        if not nuts_id or level_code not in (2, 3):
            continue
        if country_code not in states_by_iso2:
            continue

        record = {
            "nuts_id": nuts_id,
            "level": level_code,
            "name": props.get("NAME_LATN") or props.get("NUTS_NAME"),
            "country_code": country_code,
        }

        if level_code == 2:
            level2[nuts_id] = record
        elif level_code == 3:
            level3[nuts_id] = record

    return level2, level3


def parent_nuts_of(nuts3_id: str) -> Optional[str]:
    """Given a NUTS3 code, return the corresponding NUTS2 code."""
    return nuts3_id[:-1] if nuts3_id and len(nuts3_id) > 2 else None


def fetch_urban_cities(
    states_by_iso2: Dict[str, dict],
    session: Optional[requests.Session] = None,
) -> List[dict]:
    """Retrieve the Urban Audit city centroids dataset."""
    payload = fetch_json(URBAN_AUDIT_CITIES_URL, session=session)
    cities: List[dict] = []
    for feature in payload.get("features", []):
        props = feature.get("properties", {})
        geom = feature.get("geometry") or {}
        coords = geom.get("coordinates") or [None, None]
        country = props.get("CNTR_CODE")
        if country not in states_by_iso2:
            continue

        city = {
            "ura_code": props.get("URAU_CODE"),
            "name": props.get("URAU_NAME"),
            "category": props.get("URAU_CATG"),
            "country_code": country,
            "nuts3_id": props.get("NUTS3_2021"),
            "functional_area_code": props.get("FUA_CODE"),
            "area_sqm": props.get("AREA_SQM"),
            "longitude": coords[0],
            "latitude": coords[1],
        }
        cities.append(city)
    return cities


def build_dataset() -> dict:
    """Core workflow orchestrating downloads and transformations."""
    session = requests.Session()

    print("Fetching EU member states metadata...")
    states_map = fetch_eu_member_states(session=session)
    print(f"   ✓ Retrieved {len(states_map)} EU member states")

    print("Fetching NUTS regions (levels 2 and 3)...")
    nuts_level2, nuts_level3 = fetch_nuts_regions(states_map, session=session)
    print(f"   ✓ NUTS level 2 regions: {len(nuts_level2)}")
    print(f"   ✓ NUTS level 3 regions: {len(nuts_level3)}")

    print("Fetching Urban Audit city centroids...")
    cities_raw = fetch_urban_cities(states_map, session=session)
    print(f"   ✓ Urban Audit cities: {len(cities_raw)}")

    # Build state records
    states_output: List[dict] = []
    for iso2, state in sorted(states_map.items()):
        states_output.append({
            "state_id": state["state_id"],
            "name": state["name"],
            "iso2": iso2,
            "iso3": state.get("iso3"),
            "nuts_id": state.get("nuts_id"),
            "capital": state.get("capital"),
        })

    # Build region records (include both NUTS2 and NUTS3 entries)
    regions_output: List[dict] = []
    region_index: Dict[str, str] = {}  # map NUTS ID -> region_id for parent lookup

    for nuts in sorted(nuts_level2.values(), key=lambda r: (r["country_code"], r["nuts_id"])):
        state_iso2 = nuts["country_code"]
        region_id = generate_region_id(state_iso2, nuts["nuts_id"])
        region_index[nuts["nuts_id"]] = region_id

        regions_output.append({
            "region_id": region_id,
            "state_id": generate_state_id(state_iso2),
            "name": nuts["name"],
            "nuts_id": nuts["nuts_id"],
            "nuts_level": nuts["level"],
            "code": nuts["nuts_id"],
            "type": "nuts2",
            "parent_region_id": None,
        })

    for nuts in sorted(nuts_level3.values(), key=lambda r: (r["country_code"], r["nuts_id"])):
        state_iso2 = nuts["country_code"]
        region_id = generate_region_id(state_iso2, nuts["nuts_id"])
        parent_nuts = parent_nuts_of(nuts["nuts_id"])
        parent_region_id = region_index.get(parent_nuts) if parent_nuts else None
        region_index[nuts["nuts_id"]] = region_id

        regions_output.append({
            "region_id": region_id,
            "state_id": generate_state_id(state_iso2),
            "name": nuts["name"],
            "nuts_id": nuts["nuts_id"],
            "nuts_level": nuts["level"],
            "code": nuts["nuts_id"],
            "type": "nuts3",
            "parent_region_id": parent_region_id,
        })

    # Build city records with references to states/regions
    cities_output: List[dict] = []
    seen_city_ids = set()

    for city in cities_raw:
        state_iso2 = city["country_code"]
        state_id = generate_state_id(state_iso2)
        city_id = generate_city_id(state_iso2, city["name"])

        if city_id in seen_city_ids:
            # Avoid duplicate IDs if names repeat across categories
            city_id = f"{city_id}-{city['ura_code'].lower()}"
        seen_city_ids.add(city_id)

        nuts3_id = city.get("nuts3_id")
        nuts2_id = parent_nuts_of(nuts3_id) if nuts3_id else None
        region_id = None
        if nuts3_id and nuts3_id in region_index:
            region_id = region_index[nuts3_id]

        area_sqm = city.get("area_sqm")
        slug_value = slugify(city["name"])
        fallback_code = (slug_value.replace("-", "")[:10] or city_id[-10:]).upper()
        city_code = (city["ura_code"] or fallback_code)[:10]

        cities_output.append({
            "city_id": city_id,
            "name": city["name"],
            "state_id": state_id,
            "country_code": state_iso2,
            "slug": slug_value,
            "city_code": city_code,
            "ura_code": city["ura_code"],
            "category": city["category"],
            "nuts3_id": nuts3_id,
            "nuts2_id": nuts2_id,
            "region_id": region_id,
            "functional_area_code": city.get("functional_area_code"),
            "area_km2": area_sqm / 1_000_000 if isinstance(area_sqm, (int, float)) else None,
            "latitude": city.get("latitude"),
            "longitude": city.get("longitude"),
            "is_official_city": True,
        })

    bih_data_path = Path(__file__).resolve().parents[2] / "data" / "geo" / "bih_locations.json"
    if bih_data_path.exists():
        print("Merging Bosnia & Herzegovina dataset...")
        bih_payload = json.loads(bih_data_path.read_text(encoding="utf-8"))

        bih_state = bih_payload.get("state", {})
        bih_state_id = bih_state.get("state_id")
        if bih_state_id:
            states_output.append({
                "state_id": bih_state_id,
                "name": bih_state.get("name"),
                "iso2": bih_state.get("iso2"),
                "iso3": bih_state.get("iso3"),
                "nuts_id": bih_state.get("state_id"),
                "capital": bih_state.get("name"),
            })

        for region in bih_payload.get("regions", []):
            regions_output.append({
                "region_id": region.get("region_id"),
                "state_id": region.get("state_id"),
                "name": region.get("name"),
                "nuts_id": region.get("code") or region.get("region_id"),
                "nuts_level": 2 if region.get("type") in {"entity", "district"} else 3,
                "code": region.get("code") or region.get("region_id"),
                "type": region.get("type"),
                "parent_region_id": region.get("parent_region_id"),
            })

        for city in bih_payload.get("cities", []):
            area_km2 = None
            metrics = city.get("metrics") or {}
            if metrics.get("area_km2") is not None:
                area_km2 = metrics["area_km2"]

            cities_output.append({
                "city_id": city.get("city_id"),
                "name": city.get("name"),
                "slug": city.get("slug"),
                "city_code": city.get("code") or city.get("city_id")[-10:].upper(),
                "state_id": city.get("state_id") or bih_state_id,
                "region_id": city.get("region", {}).get("region_id") if city.get("region") else None,
                "country_code": bih_state.get("iso2") or "BA",
                "is_official_city": city.get("is_official_city", False),
                "latitude": (city.get("coordinates") or {}).get("latitude"),
                "longitude": (city.get("coordinates") or {}).get("longitude"),
                "area_km2": area_km2,
                "nuts3_id": city.get("region", {}).get("code") if city.get("region") else None,
                "nuts2_id": city.get("entity", {}).get("code") if city.get("entity") else None,
                "functional_area_code": None,
            })

    metadata = {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "source": {
            "countries": COUNTRIES_URL,
            "nuts": NUTS_URL,
            "urban_audit_cities": URBAN_AUDIT_CITIES_URL,
        },
        "counts": {
            "states": len(states_output),
            "regions": len(regions_output),
            "cities": len(cities_output),
        },
    }

    dataset = {
        "metadata": metadata,
        "states": states_output,
        "regions": regions_output,
        "cities": cities_output,
    }

    return dataset


def write_output(payload: dict) -> Path:
    """Persist the dataset to the standard location."""
    output_path = Path(__file__).resolve().parents[2] / "data" / "geo" / "eu_locations.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as stream:
        json.dump(payload, stream, ensure_ascii=False, indent=2)
    return output_path


def main() -> int:
    print("=" * 72)
    print("Building EU Geography dataset from Eurostat / GISCO resources")
    print("=" * 72)

    try:
        dataset = build_dataset()
    except DataFetchError as error:
        print(f"\n❌ Data download failed: {error}")
        return 1

    output_path = write_output(dataset)

    print("\nSuccess!")
    print(f"   States: {dataset['metadata']['counts']['states']}")
    print(f"   Regions: {dataset['metadata']['counts']['regions']}")
    print(f"   Cities: {dataset['metadata']['counts']['cities']}")
    print(f"Output written to: {output_path}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        sys.exit(1)
