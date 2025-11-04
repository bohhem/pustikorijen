#!/usr/bin/env python3
"""
Fetch German geography data from Wikidata and generate JSON for seeding.

This script fetches German administrative geography at 4 levels:
- State (Deutschland)
- Bundesländer (16 federal states)
- Regierungsbezirke (19 administrative districts, only in 4 Bundesländer)
- Landkreise + Kreisfreie Städte (401 rural districts + independent cities)
- Major cities (population > 50,000)

Data source: Wikidata SPARQL queries
License: CC0/Public Domain (Wikidata)
Output: ../../data/geo/germany_locations.json

Usage:
    python3 fetch_germany_locations.py

Requirements:
    pip install requests
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote

# Wikidata SPARQL endpoint
WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql"

# Germany Wikidata QID
GERMANY_QID = "Q183"

# 16 Bundesländer with metadata
BUNDESLAENDER = {
    "Q985": {"code": "BW", "iso": "DE-BW", "name": "Baden-Württemberg", "capital": "Stuttgart"},
    "Q980": {"code": "BY", "iso": "DE-BY", "name": "Bayern", "capital": "München"},
    "Q64": {"code": "BE", "iso": "DE-BE", "name": "Berlin", "capital": "Berlin"},
    "Q1208": {"code": "BB", "iso": "DE-BB", "name": "Brandenburg", "capital": "Potsdam"},
    "Q24879": {"code": "HB", "iso": "DE-HB", "name": "Bremen", "capital": "Bremen"},
    "Q1055": {"code": "HH", "iso": "DE-HH", "name": "Hamburg", "capital": "Hamburg"},
    "Q1199": {"code": "HE", "iso": "DE-HE", "name": "Hessen", "capital": "Wiesbaden"},
    "Q1196": {"code": "MV", "iso": "DE-MV", "name": "Mecklenburg-Vorpommern", "capital": "Schwerin"},
    "Q1197": {"code": "NI", "iso": "DE-NI", "name": "Niedersachsen", "capital": "Hannover"},
    "Q1198": {"code": "NW", "iso": "DE-NW", "name": "Nordrhein-Westfalen", "capital": "Düsseldorf"},
    "Q1200": {"code": "RP", "iso": "DE-RP", "name": "Rheinland-Pfalz", "capital": "Mainz"},
    "Q1201": {"code": "SL", "iso": "DE-SL", "name": "Saarland", "capital": "Saarbrücken"},
    "Q1202": {"code": "SN", "iso": "DE-SN", "name": "Sachsen", "capital": "Dresden"},
    "Q1206": {"code": "ST", "iso": "DE-ST", "name": "Sachsen-Anhalt", "capital": "Magdeburg"},
    "Q1194": {"code": "SH", "iso": "DE-SH", "name": "Schleswig-Holstein", "capital": "Kiel"},
    "Q1205": {"code": "TH", "iso": "DE-TH", "name": "Thüringen", "capital": "Erfurt"},
}

# Regierungsbezirke (only in 4 Bundesländer: BW, BY, HE, NW)
REGIERUNGSBEZIRKE = {
    # Baden-Württemberg (4)
    "Q8206": {"code": "FR", "parent_qid": "Q985", "parent_code": "BW", "name": "Freiburg"},
    "Q8203": {"code": "KA", "parent_qid": "Q985", "parent_code": "BW", "name": "Karlsruhe"},
    "Q8204": {"code": "S", "parent_qid": "Q985", "parent_code": "BW", "name": "Stuttgart"},
    "Q8205": {"code": "TÜ", "parent_qid": "Q985", "parent_code": "BW", "name": "Tübingen"},
    # Bayern (7)
    "Q10439": {"code": "OBB", "parent_qid": "Q980", "parent_code": "BY", "name": "Oberbayern"},
    "Q10443": {"code": "NB", "parent_qid": "Q980", "parent_code": "BY", "name": "Niederbayern"},
    "Q10555": {"code": "OPF", "parent_qid": "Q980", "parent_code": "BY", "name": "Oberpfalz"},
    "Q10553": {"code": "OFR", "parent_qid": "Q980", "parent_code": "BY", "name": "Oberfranken"},
    "Q10557": {"code": "MFR", "parent_qid": "Q980", "parent_code": "BY", "name": "Mittelfranken"},
    "Q10559": {"code": "UFR", "parent_qid": "Q980", "parent_code": "BY", "name": "Unterfranken"},
    "Q10547": {"code": "SW", "parent_qid": "Q980", "parent_code": "BY", "name": "Schwaben"},
    # Hessen (3)
    "Q7927": {"code": "DA", "parent_qid": "Q1199", "parent_code": "HE", "name": "Darmstadt"},
    "Q7954": {"code": "GI", "parent_qid": "Q1199", "parent_code": "HE", "name": "Gießen"},
    "Q7949": {"code": "KS", "parent_qid": "Q1199", "parent_code": "HE", "name": "Kassel"},
    # Nordrhein-Westfalen (5)
    "Q8164": {"code": "D", "parent_qid": "Q1198", "parent_code": "NW", "name": "Düsseldorf"},
    "Q7929": {"code": "K", "parent_qid": "Q1198", "parent_code": "NW", "name": "Köln"},
    "Q7924": {"code": "MS", "parent_qid": "Q1198", "parent_code": "NW", "name": "Münster"},
    "Q7959": {"code": "DT", "parent_qid": "Q1198", "parent_code": "NW", "name": "Detmold"},
    "Q7925": {"code": "A", "parent_qid": "Q1198", "parent_code": "NW", "name": "Arnsberg"},
}


def execute_sparql_query(query: str) -> List[Dict]:
    """
    Execute SPARQL query against Wikidata endpoint.

    Args:
        query: SPARQL query string

    Returns:
        List of result bindings as dictionaries

    Raises:
        Exception if query fails
    """
    # TODO: Implement SPARQL query execution
    # - Set proper User-Agent header
    # - Handle rate limiting (429 errors)
    # - Retry on failures with exponential backoff
    # - Parse JSON response and extract bindings

    headers = {
        'User-Agent': 'PustikorijenBot/1.0 (genealogy data collection)',
        'Accept': 'application/sparql-results+json'
    }

    params = {
        'query': query,
        'format': 'json'
    }

    # TODO: Implement request logic
    print(f"[TODO] Execute SPARQL query: {query[:100]}...")
    return []


def fetch_bundeslaender() -> List[Dict]:
    """
    Fetch all 16 German Bundesländer from Wikidata.

    Returns:
        List of Bundesland dictionaries with:
        - wikidata_qid
        - name
        - name_native
        - code (ISO)
        - capital
        - latitude, longitude
        - population
        - area_km2
    """
    # TODO: Implement Wikidata query for Bundesländer
    # Use P31=Q1221156 (instance of Bundesland)
    # Get P300 (ISO code), P36 (capital), P625 (coordinates), P1082 (population), P2046 (area)

    query = """
    SELECT ?state ?stateLabel ?iso ?capital ?capitalLabel ?coordinates ?population ?area WHERE {
      ?state wdt:P31 wd:Q1221156.           # instance of Bundesland
      ?state wdt:P17 wd:Q183.               # country: Germany
      OPTIONAL { ?state wdt:P300 ?iso. }    # ISO 3166-2 code
      OPTIONAL { ?state wdt:P36 ?capital. } # capital
      OPTIONAL { ?state wdt:P625 ?coordinates. }
      OPTIONAL { ?state wdt:P1082 ?population. }
      OPTIONAL { ?state wdt:P2046 ?area. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    """

    print("[TODO] Fetching 16 Bundesländer from Wikidata...")
    # results = execute_sparql_query(query)
    # Transform results into our format
    return []


def fetch_regierungsbezirke() -> List[Dict]:
    """
    Fetch 19 Regierungsbezirke from Wikidata.

    Returns:
        List of Regierungsbezirk dictionaries with parent relationships
    """
    # TODO: Implement Wikidata query for Regierungsbezirke
    # Use P31=Q106658 (instance of Regierungsbezirk)
    # Get P131 (located in) for parent Bundesland relationship

    query = """
    SELECT ?district ?districtLabel ?parent ?parentLabel ?seat ?seatLabel ?coordinates WHERE {
      ?district wdt:P31 wd:Q106658.             # instance of Regierungsbezirk
      ?district wdt:P17 wd:Q183.                # country: Germany
      OPTIONAL { ?district wdt:P131 ?parent. }  # located in (parent)
      OPTIONAL { ?district wdt:P36 ?seat. }     # seat/capital
      OPTIONAL { ?district wdt:P625 ?coordinates. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    """

    print("[TODO] Fetching 19 Regierungsbezirke from Wikidata...")
    return []


def fetch_landkreise() -> List[Dict]:
    """
    Fetch 401 Landkreise and Kreisfreie Städte from Wikidata.

    Returns:
        List of district dictionaries with:
        - wikidata_qid
        - name
        - ags_code (Amtlicher Gemeindeschlüssel)
        - type (landkreis or kreisfreie_stadt)
        - parent_qid (Bundesland or Regierungsbezirk)
        - coordinates
        - population
        - area_km2
    """
    # TODO: Implement Wikidata query for Landkreise
    # Use P31=Q1221156 (Landkreis) UNION P31=Q22865 (Kreisfreie Stadt)
    # Get P439 (AGS code), P131 (parent), P625 (coordinates), P1082 (population), P2046 (area)

    query = """
    SELECT ?district ?districtLabel ?parent ?parentLabel ?ags ?coordinates ?population ?area WHERE {
      {
        ?district wdt:P31 wd:Q1221156.        # Landkreis
      }
      UNION
      {
        ?district wdt:P31 wd:Q22865.          # Kreisfreie Stadt
      }
      ?district wdt:P17 wd:Q183.              # country: Germany
      OPTIONAL { ?district wdt:P131 ?parent. }       # located in
      OPTIONAL { ?district wdt:P439 ?ags. }          # AGS code
      OPTIONAL { ?district wdt:P625 ?coordinates. }
      OPTIONAL { ?district wdt:P1082 ?population. }
      OPTIONAL { ?district wdt:P2046 ?area. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    """

    print("[TODO] Fetching 401 Landkreise + Kreisfreie Städte from Wikidata...")
    return []


def fetch_major_cities(min_population: int = 50000) -> List[Dict]:
    """
    Fetch cities with population > threshold.

    Args:
        min_population: Minimum population filter (default 50,000)

    Returns:
        List of city dictionaries with:
        - wikidata_qid
        - name
        - landkreis_qid
        - bundesland_qid
        - population
        - area_km2
        - coordinates
    """
    # TODO: Implement Wikidata query for major cities
    # Use P31=Q515 (city), P1082 > min_population
    # Walk P131 hierarchy to find Landkreis and Bundesland

    query = f"""
    SELECT ?city ?cityLabel ?district ?districtLabel ?bundesland ?bundeslandLabel
           ?population ?coordinates ?area WHERE {{
      ?city wdt:P31/wdt:P279* wd:Q515.        # instance of city
      ?city wdt:P17 wd:Q183.                  # country: Germany
      ?city wdt:P1082 ?population.
      FILTER(?population > {min_population})
      OPTIONAL {{ ?city wdt:P131 ?district. }}
      OPTIONAL {{ ?district wdt:P131 ?bundesland. }}
      OPTIONAL {{ ?city wdt:P625 ?coordinates. }}
      OPTIONAL {{ ?city wdt:P2046 ?area. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "de,en". }}
    }}
    ORDER BY DESC(?population)
    LIMIT 1000
    """

    print(f"[TODO] Fetching cities with population > {min_population:,} from Wikidata...")
    return []


def resolve_hierarchy(
    bundeslaender: List[Dict],
    regierungsbezirke: List[Dict],
    landkreise: List[Dict],
    cities: List[Dict]
) -> Tuple[List[Dict], List[Dict]]:
    """
    Walk P131 (located in) relationships to build proper parent hierarchy.

    Creates region_id and city_id based on hierarchy.
    Links children to parents through parent_region_id.

    Args:
        bundeslaender: List of Bundesland dicts
        regierungsbezirke: List of Regierungsbezirk dicts
        landkreise: List of Landkreis dicts
        cities: List of city dicts

    Returns:
        Tuple of (regions_list, cities_list) with resolved IDs and relationships
    """
    # TODO: Implement hierarchy resolution
    # 1. Create region entries for Bundesländer (type=bundesland, parent_region_id=null)
    # 2. Create region entries for Regierungsbezirke (type=regierungsbezirk, parent_region_id=bundesland)
    # 3. Create region entries for Landkreise (type=landkreis/kreisfreie_stadt, parent_region_id=regierungsbezirk or bundesland)
    # 4. Create city entries linked to Landkreis and Bundesland
    # 5. Generate consistent IDs: region_id = "de-by-obb", city_id = "de-by-muenchen"

    print("[TODO] Resolving hierarchical relationships...")

    regions = []
    cities_resolved = []

    # TODO: Build QID -> region_id mapping
    # TODO: For each Bundesland, create region entry
    # TODO: For each Regierungsbezirk, link to parent Bundesland
    # TODO: For each Landkreis, link to parent (Regierungsbezirk or Bundesland)
    # TODO: For each city, link to Landkreis and Bundesland

    return regions, cities_resolved


def generate_region_id(bundesland_code: str, region_code: str = None, district_code: str = None) -> str:
    """
    Generate consistent region_id.

    Examples:
        - Bundesland: generate_region_id("BY") -> "de-by"
        - Regierungsbezirk: generate_region_id("BY", "OBB") -> "de-by-obb"
        - Landkreis: generate_region_id("BY", district_code="09162") -> "de-by-09162"

    Args:
        bundesland_code: 2-letter Bundesland code (e.g., "BY")
        region_code: Optional Regierungsbezirk code (e.g., "OBB")
        district_code: Optional Landkreis/AGS code (e.g., "09162")

    Returns:
        region_id string (e.g., "de-by-obb")
    """
    # TODO: Implement ID generation logic
    parts = ["de", bundesland_code.lower()]
    if region_code:
        parts.append(region_code.lower())
    if district_code:
        parts.append(district_code.lower())
    return "-".join(parts)


def generate_city_id(city_name: str, bundesland_code: str) -> str:
    """
    Generate consistent city_id.

    Example:
        - generate_city_id("München", "BY") -> "de-by-muenchen"

    Args:
        city_name: City name (may have special characters)
        bundesland_code: 2-letter Bundesland code

    Returns:
        city_id string (slugified)
    """
    # TODO: Implement slugification
    # - Convert to lowercase
    # - Replace ä->ae, ö->oe, ü->ue, ß->ss
    # - Remove special characters
    # - Replace spaces with hyphens

    slug = city_name.lower()
    # TODO: Apply German character replacements
    return f"de-{bundesland_code.lower()}-{slug}"


def parse_coordinates(coord_string: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Parse Wikidata coordinate string to (latitude, longitude).

    Args:
        coord_string: Format "Point(longitude latitude)"

    Returns:
        Tuple of (latitude, longitude) or (None, None) if parsing fails
    """
    # TODO: Implement coordinate parsing
    # Example input: "Point(11.5755 48.1374)"
    # Return: (48.1374, 11.5755)
    return None, None


def main():
    """
    Main data generation workflow.

    Steps:
    1. Fetch all 4 administrative levels from Wikidata
    2. Resolve hierarchical relationships
    3. Generate consistent IDs
    4. Format as JSON matching BiH structure
    5. Write to data/geo/germany_locations.json
    """
    print("=" * 60)
    print("Fetching German Geography Data from Wikidata")
    print("=" * 60)

    # TODO: Step 1 - Fetch all levels
    print("\n[1/5] Fetching Bundesländer (16 federal states)...")
    bundeslaender = fetch_bundeslaender()
    print(f"   ✓ Fetched {len(bundeslaender)} Bundesländer")

    print("\n[2/5] Fetching Regierungsbezirke (19 admin districts)...")
    regierungsbezirke = fetch_regierungsbezirke()
    print(f"   ✓ Fetched {len(regierungsbezirke)} Regierungsbezirke")

    print("\n[3/5] Fetching Landkreise + Kreisfreie Städte (401 districts)...")
    landkreise = fetch_landkreise()
    print(f"   ✓ Fetched {len(landkreise)} districts")

    print("\n[4/5] Fetching major cities (population > 50,000)...")
    cities = fetch_major_cities(min_population=50000)
    print(f"   ✓ Fetched {len(cities)} cities")

    # TODO: Step 2 - Resolve hierarchy
    print("\n[5/5] Resolving hierarchical relationships...")
    regions_resolved, cities_resolved = resolve_hierarchy(
        bundeslaender,
        regierungsbezirke,
        landkreise,
        cities
    )
    print(f"   ✓ Resolved {len(regions_resolved)} regions")
    print(f"   ✓ Resolved {len(cities_resolved)} cities")

    # TODO: Step 3 - Generate output JSON
    output = {
        "metadata": {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "source": "Wikidata SPARQL queries",
            "country": "Germany",
            "records": {
                "bundeslaender": len([r for r in regions_resolved if r.get('type') == 'bundesland']),
                "regierungsbezirke": len([r for r in regions_resolved if r.get('type') == 'regierungsbezirk']),
                "landkreise": len([r for r in regions_resolved if r.get('type') in ['landkreis', 'kreisfreie_stadt']]),
                "cities": len(cities_resolved),
                "total_regions": len(regions_resolved),
            }
        },
        "state": {
            "state_id": "de",
            "name": "Deutschland",
            "name_native": "Deutschland",
            "iso2": "DE",
            "iso3": "DEU",
            "wikidata_id": "Q183",
            "latitude": 51.1657,
            "longitude": 10.4515,
        },
        "regions": regions_resolved,
        "cities": cities_resolved,
    }

    # TODO: Step 4 - Write to file
    output_path = "../../data/geo/germany_locations.json"

    print(f"\n{'=' * 60}")
    print(f"Writing output to: {output_path}")

    # TODO: Ensure directory exists
    # import os
    # os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # TODO: Write JSON file
    # with open(output_path, 'w', encoding='utf-8') as f:
    #     json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ SUCCESS!")
    print(f"\nGenerated geography data:")
    print(f"   - State: 1 (Deutschland)")
    print(f"   - Bundesländer: {output['metadata']['records']['bundeslaender']}")
    print(f"   - Regierungsbezirke: {output['metadata']['records']['regierungsbezirke']}")
    print(f"   - Landkreise: {output['metadata']['records']['landkreise']}")
    print(f"   - Cities: {output['metadata']['records']['cities']}")
    print(f"   - Total regions: {output['metadata']['records']['total_regions']}")
    print(f"\n{'=' * 60}")
    print(f"[TODO] Script skeleton created. Implementation needed:")
    print(f"   1. Implement execute_sparql_query() with proper error handling")
    print(f"   2. Implement fetch_bundeslaender() with SPARQL query")
    print(f"   3. Implement fetch_regierungsbezirke() with SPARQL query")
    print(f"   4. Implement fetch_landkreise() with SPARQL query")
    print(f"   5. Implement fetch_major_cities() with SPARQL query")
    print(f"   6. Implement resolve_hierarchy() to build parent relationships")
    print(f"   7. Implement generate_region_id() for consistent IDs")
    print(f"   8. Implement generate_city_id() with slugification")
    print(f"   9. Implement parse_coordinates() for lat/lon extraction")
    print(f"   10. Test with real Wikidata queries")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
