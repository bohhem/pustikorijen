# German Geography LOV System - Implementation Plan

**Status**: 📋 Planning Phase
**Created**: 2025-11-04
**Scope**: Add German administrative geography to support German family branches

---

## 1. Overview

This document outlines the plan to add German geography support to the existing LOV (List of Values) system, following the same architecture as the Bosnia & Herzegovina implementation.

### 1.1 Goals
- Support German family branches with proper geographic disambiguation
- Provide 4-level administrative hierarchy: State → Bundesland → Regierungsbezirk → Landkreis/City
- Reuse existing database schema without modifications
- Follow proven BiH methodology using Wikidata as primary data source

### 1.2 Scope
- **Included**:
  - 16 Bundesländer (federal states)
  - 19 Regierungsbezirke (government districts, only in 4 states)
  - 401 Landkreise and Kreisfreie Städte (rural districts + independent cities)
  - ~500 major cities with population >50,000
  - GPS coordinates for all levels
  - Population and area data
  - Wikidata IDs for reference

- **Excluded** (Future Enhancements):
  - Postal codes (PLZ) - 8,200+ codes, can be added later
  - Small municipalities (<50k population) - ~10,500 additional entries
  - NUTS codes - EU statistical regions
  - OSM boundary polygons

---

## 2. German Administrative Structure

### 2.1 Hierarchy

```
Deutschland (Germany) - Q183
├── Bundesländer (16 federal states)
│   ├── Regierungsbezirke (19 admin districts) *only in 4 Bundesländer
│   │   ├── Landkreise (294 rural districts)
│   │   └── Kreisfreie Städte (107 independent cities)
│   └── Gemeinden (~11,000 municipalities)
```

### 2.2 The 16 Bundesländer

| Code | Name | Capital | Wikidata QID | Has Regierungsbezirke? | ISO 3166-2 |
|------|------|---------|--------------|------------------------|------------|
| BW | Baden-Württemberg | Stuttgart | Q985 | ✅ Yes (4) | DE-BW |
| BY | Bayern (Bavaria) | München | Q980 | ✅ Yes (7) | DE-BY |
| BE | Berlin | Berlin | Q64 | ❌ No | DE-BE |
| BB | Brandenburg | Potsdam | Q1208 | ❌ No | DE-BB |
| HB | Bremen | Bremen | Q24879 | ❌ No | DE-HB |
| HH | Hamburg | Hamburg | Q1055 | ❌ No | DE-HH |
| HE | Hessen (Hesse) | Wiesbaden | Q1199 | ✅ Yes (3) | DE-HE |
| MV | Mecklenburg-Vorpommern | Schwerin | Q1196 | ❌ No | DE-MV |
| NI | Niedersachsen | Hannover | Q1197 | ❌ No | DE-NI |
| NW | Nordrhein-Westfalen | Düsseldorf | Q1198 | ✅ Yes (5) | DE-NW |
| RP | Rheinland-Pfalz | Mainz | Q1200 | ❌ No | DE-RP |
| SL | Saarland | Saarbrücken | Q1201 | ❌ No | DE-SL |
| SN | Sachsen (Saxony) | Dresden | Q1202 | ❌ No | DE-SN |
| ST | Sachsen-Anhalt | Magdeburg | Q1206 | ❌ No | DE-ST |
| SH | Schleswig-Holstein | Kiel | Q1194 | ❌ No | DE-SH |
| TH | Thüringen (Thuringia) | Erfurt | Q1205 | ❌ No | DE-TH |

### 2.3 Regierungsbezirke (19 total, only in 4 states)

**Baden-Württemberg (4):**
- Freiburg (Q8206)
- Karlsruhe (Q8203)
- Stuttgart (Q8204)
- Tübingen (Q8205)

**Bayern (7):**
- Oberbayern (Q10439)
- Niederbayern (Q10443)
- Oberpfalz (Q10555)
- Oberfranken (Q10553)
- Mittelfranken (Q10557)
- Unterfranken (Q10559)
- Schwaben (Q10547)

**Hessen (3):**
- Darmstadt (Q7927)
- Gießen (Q7954)
- Kassel (Q7949)

**Nordrhein-Westfalen (5):**
- Düsseldorf (Q8164)
- Köln (Q7929)
- Münster (Q7924)
- Detmold (Q7959)
- Arnsberg (Q7925)

### 2.4 Districts (401 total)
- **294 Landkreise** (rural districts) - Wikidata: P31=Q1221156
- **107 Kreisfreie Städte** (independent cities) - Wikidata: P31=Q22865

Each has a unique **AGS code** (Amtlicher Gemeindeschlüssel) - official municipal key.

### 2.5 Cities
- Target: ~500 major cities with population >50,000
- Each city belongs to a Landkreis (or is itself a Kreisfreie Stadt)
- Cities have Wikidata QIDs for reliable identification

### 2.6 Special Cases

**City-States (Stadtstaaten):**
Berlin, Hamburg, and Bremen are both Bundesland AND city:
- Create **both** a region entry (type=bundesland) AND a city entry
- Link city to its own Bundesland region

**District-Free Cities (Kreisfreie Städte):**
107 cities are administratively independent from Landkreise:
- Treat as both district (region entry) AND city
- Set `parent_region_id` to Bundesland or Regierungsbezirk

---

## 3. Data Source: Wikidata

### 3.1 Why Wikidata?

✅ **Free and Open**: CC0 license (Public Domain)
✅ **Comprehensive**: Complete administrative hierarchy
✅ **Maintained**: Active community updates
✅ **Structured**: Well-defined properties
✅ **GPS Coordinates**: Available for all levels
✅ **Proven**: Same approach as BiH implementation
✅ **Commercial Use**: No restrictions

### 3.2 Key Wikidata Properties

| Property | Code | Description | Example |
|----------|------|-------------|---------|
| Instance of | P31 | Type of entity | Q1221156 (Bundesland) |
| Country | P17 | Germany = Q183 | Q183 |
| Located in | P131 | Administrative hierarchy | Bayern → Deutschland |
| ISO 3166-2 | P300 | Official state code | DE-BY |
| Coordinate location | P625 | GPS lat/lon | 48.1374°N, 11.5755°E |
| Population | P1082 | Number of inhabitants | 1,471,508 |
| Area | P2046 | Area in km² | 310.7 |
| AGS code | P439 | Official municipal key | 09162000 |
| Capital | P36 | Administrative center | München |
| Wikidata ID | - | Unique identifier | Q1726 |

### 3.3 Wikidata SPARQL Queries

#### Query 1: Fetch All 16 Bundesländer

```sparql
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
```

#### Query 2: Fetch Regierungsbezirke with Hierarchy

```sparql
SELECT ?district ?districtLabel ?parent ?parentLabel ?seat ?coordinates WHERE {
  ?district wdt:P31 wd:Q106658.         # instance of Regierungsbezirk
  ?district wdt:P17 wd:Q183.            # country: Germany
  OPTIONAL { ?district wdt:P131 ?parent. }  # located in (parent)
  OPTIONAL { ?district wdt:P36 ?seat. }     # seat/capital
  OPTIONAL { ?district wdt:P625 ?coordinates. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
```

#### Query 3: Fetch Landkreise and Kreisfreie Städte

```sparql
SELECT ?district ?districtLabel ?parent ?parentLabel ?ags ?coordinates ?population ?area WHERE {
  {
    ?district wdt:P31 wd:Q1221156.      # Landkreis
  }
  UNION
  {
    ?district wdt:P31 wd:Q22865.        # Kreisfreie Stadt
  }
  ?district wdt:P17 wd:Q183.            # country: Germany
  OPTIONAL { ?district wdt:P131 ?parent. }     # located in
  OPTIONAL { ?district wdt:P439 ?ags. }        # AGS code
  OPTIONAL { ?district wdt:P625 ?coordinates. }
  OPTIONAL { ?district wdt:P1082 ?population. }
  OPTIONAL { ?district wdt:P2046 ?area. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
```

#### Query 4: Fetch Major Cities (>50k population)

```sparql
SELECT ?city ?cityLabel ?district ?districtLabel ?bundesland ?bundeslandLabel
       ?population ?coordinates ?area WHERE {
  ?city wdt:P31/wdt:P279* wd:Q515.     # instance of city
  ?city wdt:P17 wd:Q183.                # country: Germany
  ?city wdt:P1082 ?population.
  FILTER(?population > 50000)
  OPTIONAL { ?city wdt:P131 ?district. }
  OPTIONAL { ?district wdt:P131 ?bundesland. }
  OPTIONAL { ?city wdt:P625 ?coordinates. }
  OPTIONAL { ?city wdt:P2046 ?area. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
ORDER BY DESC(?population)
```

### 3.4 Supplementary Data Source

**GitHub: corona-hub-germany/landkreise-deutschland**
- URL: https://github.com/corona-hub-germany/landkreise-deutschland
- License: CC-BY-4.0 ✅
- Use case: Cross-reference AGS codes and NUTS3 mappings
- Data as of: Dec 31, 2018 (slightly dated but still useful)

---

## 4. Database Schema Mapping

**Good news**: No schema changes needed! The existing `geo_states`, `geo_regions`, `geo_cities` tables support Germany's structure perfectly.

### 4.1 geo_states Table

```sql
-- Single entry for Germany
INSERT INTO geo_states (state_id, name, iso2, iso3, wikidata_id, latitude, longitude)
VALUES ('de', 'Deutschland', 'DE', 'DEU', 'Q183', 51.1657, 10.4515);
```

### 4.2 geo_regions Table (3 Levels)

#### Level 1: Bundesländer (16 entries)

```sql
-- Example: Bayern
INSERT INTO geo_regions (
  region_id, state_id, parent_region_id, name, name_native,
  code, type, seat, wikidata_id, latitude, longitude
) VALUES (
  'de-by',           -- region_id
  'de',              -- state_id
  NULL,              -- parent_region_id (top level)
  'Bayern',          -- name
  'Freistaat Bayern',-- name_native
  'DE-BY',           -- ISO code
  'bundesland',      -- type
  'München',         -- seat
  'Q980',            -- wikidata_id
  48.7904,           -- latitude
  11.4979            -- longitude
);
```

#### Level 2: Regierungsbezirke (19 entries, only in BW, BY, HE, NW)

```sql
-- Example: Oberbayern (Upper Bavaria)
INSERT INTO geo_regions (
  region_id, state_id, parent_region_id, name, code, type, seat, wikidata_id
) VALUES (
  'de-by-obb',       -- region_id
  'de',              -- state_id
  'de-by',           -- parent_region_id (Bayern)
  'Oberbayern',      -- name
  'BY-OBB',          -- custom code
  'regierungsbezirk',-- type
  'München',         -- seat
  'Q10439'           -- wikidata_id
);
```

#### Level 3: Landkreise (401 entries)

```sql
-- Example: Landkreis München (rural district around München city)
INSERT INTO geo_regions (
  region_id, state_id, parent_region_id, name, code, type, wikidata_id
) VALUES (
  'de-by-lkmuc',     -- region_id
  'de',              -- state_id
  'de-by-obb',       -- parent (Oberbayern) or 'de-by' if no Regierungsbezirk
  'Landkreis München',
  '09184',           -- AGS code
  'landkreis',       -- type
  'Q10562'           -- wikidata_id
);

-- Example: München city (Kreisfreie Stadt)
INSERT INTO geo_regions (
  region_id, state_id, parent_region_id, name, code, type, wikidata_id
) VALUES (
  'de-by-muc',       -- region_id
  'de',              -- state_id
  'de-by-obb',       -- parent
  'München',
  '09162',           -- AGS code
  'kreisfreie_stadt',-- type
  'Q1726'            -- wikidata_id
);
```

### 4.3 geo_cities Table (~500 major cities)

```sql
-- Example: München city entry
INSERT INTO geo_cities (
  city_id, state_id, region_id, entity_region_id,
  name, slug, city_code, wikidata_id, is_official_city,
  latitude, longitude, population_2013, area_km2, density_per_km2
) VALUES (
  'de-by-muenchen',  -- city_id
  'de',              -- state_id
  'de-by-muc',       -- region_id (Kreisfreie Stadt München)
  'de-by',           -- entity_region_id (Bundesland Bayern)
  'München',         -- name
  'muenchen',        -- slug
  '09162',           -- AGS code
  'Q1726',           -- wikidata_id
  true,              -- is_official_city
  48.1374,           -- latitude
  11.5755,           -- longitude
  1471508,           -- population
  310.7,             -- area_km2
  4736.0             -- density_per_km2
);
```

### 4.4 Hierarchy Resolution Logic

**For states with Regierungsbezirke (BW, BY, HE, NW):**
```
City → Landkreis → Regierungsbezirk → Bundesland → State
```

**For states without Regierungsbezirke (other 12):**
```
City → Landkreis → Bundesland → State
```

**For Kreisfreie Städte:**
```
City = Landkreis → Regierungsbezirk/Bundesland → State
```

---

## 5. Data Generation Script

### 5.1 Script Location
`/home/bohhem/projects/pustikorijen/scripts/data/fetch_germany_locations.py`

### 5.2 Script Structure (Skeleton)

```python
#!/usr/bin/env python3
"""
Fetch German geography data from Wikidata and generate JSON for seeding.
Similar to fetch_bih_locations.py but adapted for German administrative structure.
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Optional

# Wikidata SPARQL endpoint
WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql"

# Germany Wikidata QID
GERMANY_QID = "Q183"

# 16 Bundesländer with metadata
BUNDESLAENDER = {
    "Q985": {"code": "BW", "iso": "DE-BW", "name": "Baden-Württemberg"},
    "Q980": {"code": "BY", "iso": "DE-BY", "name": "Bayern"},
    "Q64": {"code": "BE", "iso": "DE-BE", "name": "Berlin"},
    "Q1208": {"code": "BB", "iso": "DE-BB", "name": "Brandenburg"},
    "Q24879": {"code": "HB", "iso": "DE-HB", "name": "Bremen"},
    "Q1055": {"code": "HH", "iso": "DE-HH", "name": "Hamburg"},
    "Q1199": {"code": "HE", "iso": "DE-HE", "name": "Hessen"},
    "Q1196": {"code": "MV", "iso": "DE-MV", "name": "Mecklenburg-Vorpommern"},
    "Q1197": {"code": "NI", "iso": "DE-NI", "name": "Niedersachsen"},
    "Q1198": {"code": "NW", "iso": "DE-NW", "name": "Nordrhein-Westfalen"},
    "Q1200": {"code": "RP", "iso": "DE-RP", "name": "Rheinland-Pfalz"},
    "Q1201": {"code": "SL", "iso": "DE-SL", "name": "Saarland"},
    "Q1202": {"code": "SN", "iso": "DE-SN", "name": "Sachsen"},
    "Q1206": {"code": "ST", "iso": "DE-ST", "name": "Sachsen-Anhalt"},
    "Q1194": {"code": "SH", "iso": "DE-SH", "name": "Schleswig-Holstein"},
    "Q1205": {"code": "TH", "iso": "DE-TH", "name": "Thüringen"},
}

# Regierungsbezirke (only in 4 Bundesländer)
REGIERUNGSBEZIRKE = {
    # Baden-Württemberg (4)
    "Q8206": {"code": "FR", "parent": "Q985", "name": "Freiburg"},
    "Q8203": {"code": "KA", "parent": "Q985", "name": "Karlsruhe"},
    "Q8204": {"code": "S", "parent": "Q985", "name": "Stuttgart"},
    "Q8205": {"code": "TÜ", "parent": "Q985", "name": "Tübingen"},
    # Bayern (7)
    "Q10439": {"code": "OBB", "parent": "Q980", "name": "Oberbayern"},
    "Q10443": {"code": "NB", "parent": "Q980", "name": "Niederbayern"},
    "Q10555": {"code": "OPF", "parent": "Q980", "name": "Oberpfalz"},
    "Q10553": {"code": "OFR", "parent": "Q980", "name": "Oberfranken"},
    "Q10557": {"code": "MFR", "parent": "Q980", "name": "Mittelfranken"},
    "Q10559": {"code": "UFR", "parent": "Q980", "name": "Unterfranken"},
    "Q10547": {"code": "SW", "parent": "Q980", "name": "Schwaben"},
    # Hessen (3)
    "Q7927": {"code": "DA", "parent": "Q1199", "name": "Darmstadt"},
    "Q7954": {"code": "GI", "parent": "Q1199", "name": "Gießen"},
    "Q7949": {"code": "KS", "parent": "Q1199", "name": "Kassel"},
    # Nordrhein-Westfalen (5)
    "Q8164": {"code": "D", "parent": "Q1198", "name": "Düsseldorf"},
    "Q7929": {"code": "K", "parent": "Q1198", "name": "Köln"},
    "Q7924": {"code": "MS", "parent": "Q1198", "name": "Münster"},
    "Q7959": {"code": "DT", "parent": "Q1198", "name": "Detmold"},
    "Q7925": {"code": "A", "parent": "Q1198", "name": "Arnsberg"},
}

def execute_sparql_query(query: str) -> List[Dict]:
    """Execute SPARQL query against Wikidata endpoint."""
    # TODO: Implement with error handling and retries
    pass

def fetch_bundeslaender() -> List[Dict]:
    """Fetch all 16 German Bundesländer from Wikidata."""
    # TODO: Use SPARQL query from section 3.3
    pass

def fetch_regierungsbezirke() -> List[Dict]:
    """Fetch 19 Regierungsbezirke from Wikidata."""
    # TODO: Use SPARQL query from section 3.3
    pass

def fetch_landkreise() -> List[Dict]:
    """Fetch 401 Landkreise and Kreisfreie Städte from Wikidata."""
    # TODO: Use SPARQL query from section 3.3
    pass

def fetch_major_cities(min_population: int = 50000) -> List[Dict]:
    """Fetch cities with population > threshold."""
    # TODO: Use SPARQL query from section 3.3
    pass

def resolve_hierarchy(regions: List[Dict], cities: List[Dict]) -> tuple:
    """Walk P131 (located in) relationships to build parent hierarchy."""
    # TODO: Link cities → districts → regierungsbezirke → bundesländer
    pass

def generate_region_id(name: str, code: str, type: str) -> str:
    """Generate consistent region_id (e.g., 'de-by-obb')."""
    # TODO: Implement slugification logic
    pass

def generate_city_id(name: str, bundesland_code: str) -> str:
    """Generate consistent city_id (e.g., 'de-by-muenchen')."""
    # TODO: Implement slugification logic
    pass

def main():
    """Main data generation workflow."""
    print("Fetching German geography data from Wikidata...")

    # Fetch all levels
    bundeslaender = fetch_bundeslaender()
    regierungsbezirke = fetch_regierungsbezirke()
    landkreise = fetch_landkreise()
    cities = fetch_major_cities(min_population=50000)

    # Resolve hierarchical relationships
    regions_resolved, cities_resolved = resolve_hierarchy(
        bundeslaender + regierungsbezirke + landkreise,
        cities
    )

    # Generate output JSON
    output = {
        "metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "source": "Wikidata",
            "country": "Germany",
            "records": {
                "bundeslaender": len(bundeslaender),
                "regierungsbezirke": len(regierungsbezirke),
                "landkreise": len(landkreise),
                "cities": len(cities),
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

    # Write to file
    output_path = "../../data/geo/germany_locations.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {output_path}")
    print(f"   - {len(regions_resolved)} regions")
    print(f"   - {len(cities_resolved)} cities")

if __name__ == "__main__":
    main()
```

### 5.3 Expected Output Format

`/home/bohhem/projects/pustikorijen/data/geo/germany_locations.json`

```json
{
  "metadata": {
    "generated_at": "2025-11-04T12:00:00.000Z",
    "source": "Wikidata",
    "country": "Germany",
    "records": {
      "bundeslaender": 16,
      "regierungsbezirke": 19,
      "landkreise": 401,
      "cities": 500
    }
  },
  "state": {
    "state_id": "de",
    "name": "Deutschland",
    "iso2": "DE",
    "iso3": "DEU",
    "wikidata_id": "Q183",
    "latitude": 51.1657,
    "longitude": 10.4515
  },
  "regions": [
    {
      "region_id": "de-by",
      "state_id": "de",
      "parent_region_id": null,
      "name": "Bayern",
      "name_native": "Freistaat Bayern",
      "code": "DE-BY",
      "type": "bundesland",
      "seat": "München",
      "wikidata_id": "Q980",
      "latitude": 48.7904,
      "longitude": 11.4979
    },
    {
      "region_id": "de-by-obb",
      "state_id": "de",
      "parent_region_id": "de-by",
      "name": "Oberbayern",
      "code": "BY-OBB",
      "type": "regierungsbezirk",
      "seat": "München",
      "wikidata_id": "Q10439",
      "latitude": 48.1,
      "longitude": 11.5
    },
    {
      "region_id": "de-by-muc",
      "state_id": "de",
      "parent_region_id": "de-by-obb",
      "name": "München",
      "code": "09162",
      "type": "kreisfreie_stadt",
      "wikidata_id": "Q1726",
      "latitude": 48.1374,
      "longitude": 11.5755
    }
  ],
  "cities": [
    {
      "city_id": "de-by-muenchen",
      "state_id": "de",
      "region_id": "de-by-muc",
      "entity_region_id": "de-by",
      "name": "München",
      "slug": "muenchen",
      "city_code": "09162",
      "wikidata_id": "Q1726",
      "is_official_city": true,
      "latitude": 48.1374,
      "longitude": 11.5755,
      "population_2013": 1471508,
      "area_km2": 310.7,
      "density_per_km2": 4736.0
    }
  ]
}
```

---

## 6. Backend Integration

### 6.1 Seed Script Updates

**File**: `/home/bohhem/projects/pustikorijen/backend/prisma/seed.ts`

**Changes needed**:

```typescript
// Add function to load Germany data
async function loadGermanyGeoData() {
  console.log('Loading Germany geography data...');

  const germanyDataPath = path.join(__dirname, '../../data/geo/germany_locations.json');
  const germanyData = JSON.parse(fs.readFileSync(germanyDataPath, 'utf-8'));

  await seedGeoLov(germanyData);

  console.log('✅ Germany geography data loaded');
}

// Update main() function
async function main() {
  // ... existing code ...

  // Seed geography data
  await loadBiHGeoData();
  await loadGermanyGeoData();  // ← Add this line

  // ... rest of seed logic ...
}
```

### 6.2 API Endpoints

**No changes needed!** The existing geo service and controller are already generic:

- `GET /geo/states` - Will return both BiH and Germany
- `GET /geo/states/de/regions` - Will return German Bundesländer
- `GET /geo/regions/de-by/cities` - Will return Bavarian cities
- All hierarchy queries work as-is

### 6.3 Service Layer

**File**: `/home/bohhem/projects/pustikorijen/backend/src/services/geo.service.ts`

**No changes needed** - existing functions handle Germany's structure:
- `listRegionsByState()` filters by `state_id`
- `listCitiesByRegion()` handles hierarchical queries
- The service doesn't assume BiH-specific structure

---

## 7. Frontend Integration

### 7.1 GeoLocationSelector Component Updates

**File**: `/home/bohhem/projects/pustikorijen/frontend/src/components/geo/GeoLocationSelector.tsx`

**Current BiH logic**:
```
State (BiH) → Entity (FBiH/RS/BD) → Canton (if FBiH) → City
```

**New Germany logic**:
```
State (DE) → Bundesland → Regierungsbezirk (if BW/BY/HE/NW) → Landkreis → City
```

**Changes needed**:

```typescript
// Add state detection
const isGermany = selectedStateId === 'de';
const isBosnia = selectedStateId === 'bih';

// Germany-specific: Determine if Regierungsbezirk selection is needed
const requiresRegierungsbezirk =
  isGermany && ['de-bw', 'de-by', 'de-he', 'de-nw'].includes(selectedBundeslandId);

// Render conditional dropdowns
{isGermany && (
  <>
    {/* Bundesland dropdown */}
    <select value={selectedBundeslandId} onChange={handleBundeslandChange}>
      <option value="">{t('geoSelector.selectBundesland')}</option>
      {bundeslaender.map(bl => (
        <option key={bl.regionId} value={bl.regionId}>{bl.name}</option>
      ))}
    </select>

    {/* Regierungsbezirk dropdown (conditional) */}
    {requiresRegierungsbezirk && (
      <select value={selectedRegierungsbezirkId} onChange={handleRegierungsbezirkChange}>
        <option value="">{t('geoSelector.selectRegierungsbezirk')}</option>
        {regierungsbezirke.map(rb => (
          <option key={rb.regionId} value={rb.regionId}>{rb.name}</option>
        ))}
      </select>
    )}

    {/* Landkreis dropdown */}
    <select value={selectedLandkreisId} onChange={handleLandkreisChange}>
      <option value="">{t('geoSelector.selectLandkreis')}</option>
      {landkreise.map(lk => (
        <option key={lk.regionId} value={lk.regionId}>{lk.name}</option>
      ))}
    </select>

    {/* City dropdown */}
    <select value={selectedCityId} onChange={handleCityChange}>
      <option value="">{t('geoSelector.selectCity')}</option>
      {cities.map(city => (
        <option key={city.cityId} value={city.cityId}>{city.name}</option>
      ))}
    </select>
  </>
)}
```

### 7.2 Cascade Logic Updates

**Key behaviors**:
1. When Bundesland changes:
   - Clear Regierungsbezirk, Landkreis, City selections
   - Load Regierungsbezirke if applicable (BW/BY/HE/NW)
   - Load Landkreise directly if not applicable

2. When Regierungsbezirk changes (if shown):
   - Clear Landkreis, City selections
   - Load Landkreise under this Regierungsbezirk

3. When Landkreis changes:
   - Clear City selection
   - Load cities in this Landkreis

### 7.3 Initial Value Restoration

When editing a branch with `geo_city_id` set to a German city:
1. Fetch city details via `GET /geo/cities/:cityId`
2. Walk up hierarchy using `region_id` and `entity_region_id`
3. Pre-populate all dropdowns in correct order
4. Show/hide Regierungsbezirk dropdown based on Bundesland

---

## 8. Internationalization (i18n)

### 8.1 New Translation Keys Needed

**English** (`frontend/src/i18n/locales/en/translation.json`):
```json
{
  "geoSelector": {
    "selectState": "Select Country",
    "selectBundesland": "Select Federal State",
    "selectRegierungsbezirk": "Select Administrative District",
    "selectLandkreis": "Select District",
    "selectCity": "Select City",
    "bundesland": "Federal State (Bundesland)",
    "regierungsbezirk": "Admin District (Regierungsbezirk)",
    "landkreis": "District (Landkreis)",
    "kreisfreieStadt": "Independent City",
    "city": "City"
  }
}
```

**German** (`frontend/src/i18n/locales/de/translation.json`):
```json
{
  "geoSelector": {
    "selectState": "Land auswählen",
    "selectBundesland": "Bundesland auswählen",
    "selectRegierungsbezirk": "Regierungsbezirk auswählen",
    "selectLandkreis": "Landkreis auswählen",
    "selectCity": "Stadt auswählen",
    "bundesland": "Bundesland",
    "regierungsbezirk": "Regierungsbezirk",
    "landkreis": "Landkreis",
    "kreisfreieStadt": "Kreisfreie Stadt",
    "city": "Stadt"
  }
}
```

**Bosnian** (`frontend/src/i18n/locales/bs/translation.json`):
```json
{
  "geoSelector": {
    "selectState": "Izaberite državu",
    "selectBundesland": "Izaberite saveznu državu",
    "selectRegierungsbezirk": "Izaberite upravni okrug",
    "selectLandkreis": "Izaberite okrug",
    "selectCity": "Izaberite grad",
    "bundesland": "Savezna država (Bundesland)",
    "regierungsbezirk": "Upravni okrug (Regierungsbezirk)",
    "landkreis": "Okrug (Landkreis)",
    "kreisfreieStadt": "Nezavisni grad",
    "city": "Grad"
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Data Generation (2-3 days)

**Tasks**:
- [ ] Create `fetch_germany_locations.py` script
- [ ] Implement Wikidata SPARQL queries for all 4 levels
- [ ] Fetch 16 Bundesländer with coordinates and metadata
- [ ] Fetch 19 Regierungsbezirke with parent relationships
- [ ] Fetch 401 Landkreise and Kreisfreie Städte with AGS codes
- [ ] Fetch ~500 major cities (population >50k)
- [ ] Resolve hierarchical relationships (P131 walking)
- [ ] Generate `germany_locations.json` matching BiH format
- [ ] Validate JSON structure and completeness
- [ ] Test script with sample queries

**Deliverable**: `data/geo/germany_locations.json` (~2MB file)

---

### Phase 2: Database Seeding (1 day)

**Tasks**:
- [ ] Update `backend/prisma/seed.ts` to load Germany data
- [ ] Add `loadGermanyGeoData()` function
- [ ] Run seed script on dev database
- [ ] Verify all 16 Bundesländer inserted
- [ ] Verify all 19 Regierungsbezirke linked correctly
- [ ] Verify all 401 Landkreise with parent relationships
- [ ] Verify ~500 cities linked to regions
- [ ] Test foreign key constraints
- [ ] Validate hierarchy queries via Prisma Studio
- [ ] Create database backup before production deployment

**Deliverable**: Germany geography data in database

---

### Phase 3: Frontend Updates (2-3 days)

**Tasks**:
- [ ] Update `GeoLocationSelector.tsx` component
  - [ ] Add state detection logic (BiH vs Germany)
  - [ ] Implement Bundesland dropdown
  - [ ] Implement conditional Regierungsbezirk dropdown (BW/BY/HE/NW only)
  - [ ] Implement Landkreis dropdown
  - [ ] Implement City dropdown
  - [ ] Update cascade logic for 4-level hierarchy
  - [ ] Fix initial value restoration for German cities
- [ ] Add i18n translations (de, en, bs)
  - [ ] Add geoSelector keys
  - [ ] Add region type labels
- [ ] Test cascading selections
- [ ] Test with existing BiH branches (regression)
- [ ] Test Regierungsbezirk show/hide logic
- [ ] Mobile responsive testing

**Deliverable**: Functional Germany geography selector

---

### Phase 4: Testing & Documentation (2 days)

**Tasks**:
- [ ] Integration tests for German geo hierarchy
- [ ] Test API endpoints with German state_id
- [ ] Test branch creation with German cities
- [ ] Test branch editing with German locations
- [ ] Verify Google Maps integration with German coordinates
- [ ] User acceptance testing
  - [ ] Create test branch in Bayern
  - [ ] Create test branch in Berlin (no Regierungsbezirk)
  - [ ] Verify location display formatting
- [ ] Update API documentation
- [ ] Update user guide with German examples
- [ ] Performance testing with larger dataset

**Deliverable**: Tested, documented Germany geography support

---

## 10. File Modification Checklist

### New Files to Create
```
✅ /docs/geo-germany-plan.md (this document)
✅ /scripts/data/fetch_germany_locations.py
⏳ /data/geo/germany_locations.json (generated by script)
```

### Files to Modify

#### Backend
```
⏳ /backend/prisma/seed.ts
   - Add loadGermanyGeoData() function
   - Call in main()

⏳ /backend/src/services/geo.service.ts
   - No changes needed (already generic)

⏳ /backend/src/controllers/geo.controller.ts
   - No changes needed (already generic)
```

#### Frontend
```
⏳ /frontend/src/components/geo/GeoLocationSelector.tsx
   - Add state detection logic
   - Add Bundesland/Regierungsbezirk/Landkreis dropdowns
   - Update cascade logic
   - Fix initial value restoration

⏳ /frontend/src/i18n/locales/en/translation.json
   - Add geoSelector.bundesland, regierungsbezirk, landkreis keys

⏳ /frontend/src/i18n/locales/de/translation.json
   - Add German translations

⏳ /frontend/src/i18n/locales/bs/translation.json
   - Add Bosnian translations
```

#### Database
```
⏳ No schema migrations needed
⏳ Run seed script to populate data
```

---

## 11. Challenges & Solutions

### Challenge 1: Regierungsbezirke Complexity
**Problem**: Only 4 of 16 Bundesländer have Regierungsbezirke
**Solution**: Make Regierungsbezirk dropdown conditional. Check selected Bundesland against whitelist `['de-bw', 'de-by', 'de-he', 'de-nw']`. Backend `parent_region_id` already supports optional middle layer.

### Challenge 2: City-States (Berlin, Hamburg, Bremen)
**Problem**: City-states are both Bundesland AND city
**Solution**: Create both region entry (type=bundesland) and city entry. Set city's `entity_region_id` to itself.

### Challenge 3: Dataset Size
**Problem**: ~500 cities is much larger than BiH's 145
**Solution**: Add search/autocomplete for city dropdown if performance issues arise. Current approach should work fine.

### Challenge 4: Wikidata Hierarchy Ambiguity
**Problem**: Some entities have multiple P131 relationships
**Solution**: Prioritize official AGS codes. Use Wikidata P131 property but validate against known structure. Cross-reference with corona-hub-germany dataset.

### Challenge 5: Data Freshness
**Problem**: Administrative boundaries change (mergers, splits)
**Solution**: Include generation timestamp in JSON metadata. Document re-run procedure. Wikidata updates automatically.

### Challenge 6: Initial Value Restoration
**Problem**: Need to reconstruct full hierarchy from city_id
**Solution**: Walk up tree using `region_id` → `parent_region_id` → `entity_region_id`. Fetch all parent regions with single query.

### Challenge 7: Multilingual Names
**Problem**: German uses both common and official names ("Bayern" vs "Freistaat Bayern")
**Solution**: Store common name in `name` field. Store official/formal name in `name_native` field. Display common name in dropdowns.

---

## 12. Future Enhancements (Out of Scope)

### 12.1 Postal Codes (PLZ)
- Add `geo_postal_codes` table
- Link to `geo_cities` or `geo_regions`
- ~8,200 PLZ codes from WZB plz_geocoord dataset
- Use for address autocomplete

### 12.2 Small Municipalities
- Add remaining ~10,500 municipalities (<50k population)
- Useful for rural family branches
- Requires pagination/autocomplete in UI

### 12.3 NUTS Codes
- Add NUTS1/NUTS2/NUTS3 codes for EU statistics
- Useful for demographic analysis
- Available from Eurostat

### 12.4 OSM Boundary Polygons
- Add GeoJSON boundary data from OpenStreetMap
- Enable map visualization of Bundesländer/Landkreise
- Useful for "families in this region" feature

### 12.5 Historical Boundaries
- Add temporal dimension to track boundary changes
- Link to historical dates (e.g., East/West Germany split)
- Useful for genealogy research

---

## 13. Testing Scenarios

### 13.1 Unit Tests
- Test Wikidata SPARQL query construction
- Test region_id generation from slugs
- Test hierarchy resolution algorithm
- Test JSON schema validation

### 13.2 Integration Tests
- Test geo API endpoints with German data
- Test branch creation with German city
- Test cascade dropdowns in GeoLocationSelector
- Test initial value restoration from city_id

### 13.3 Manual Testing Checklist

**Scenario 1: Create Branch in Bayern (with Regierungsbezirk)**
1. Create new branch
2. Select State: Deutschland
3. Select Bundesland: Bayern
4. Verify Regierungsbezirk dropdown appears
5. Select: Oberbayern
6. Select Landkreis: München
7. Select City: München
8. Save and verify location stored correctly

**Scenario 2: Create Branch in Berlin (no Regierungsbezirk)**
1. Create new branch
2. Select State: Deutschland
3. Select Bundesland: Berlin
4. Verify Regierungsbezirk dropdown is hidden
5. Verify Landkreis dropdown shows "Berlin" (Kreisfreie Stadt)
6. Select City: Berlin
7. Save and verify

**Scenario 3: Edit Branch with German Location**
1. Edit existing branch with German city
2. Verify all dropdowns pre-populated correctly
3. Verify Regierungsbezirk shown/hidden appropriately
4. Change to different Bundesland
5. Verify cascading reset works

**Scenario 4: Regression Test BiH Branches**
1. Create/edit BiH branch
2. Verify BiH-specific logic still works
3. Verify Entity → Canton cascade unchanged
4. Ensure German additions didn't break BiH

---

## 14. Rollout Plan

### 14.1 Development Environment
1. Run `fetch_germany_locations.py` to generate JSON
2. Run `npm run seed:dev` to populate dev database
3. Test frontend changes locally
4. Verify all scenarios pass

### 14.2 Staging Environment
1. Deploy code changes to staging
2. Run seed script on staging database
3. Perform full regression testing
4. UAT with sample German branches

### 14.3 Production Deployment
1. Create database backup
2. Run seed script on production database
3. Deploy frontend/backend changes
4. Monitor error logs for 24 hours
5. Create announcement post (if public-facing)

### 14.4 Rollback Plan
If issues arise:
1. Revert frontend/backend code deployments
2. Restore database backup (if data corruption)
3. German data remains in DB (no harm, just inactive)
4. BiH functionality continues unaffected

---

## 15. Success Metrics

- ✅ All 16 Bundesländer loaded successfully
- ✅ All 19 Regierungsbezirke linked to correct parents
- ✅ All 401 Landkreise present with AGS codes
- ✅ ~500 major cities with coordinates
- ✅ Zero schema changes required
- ✅ BiH functionality unaffected (regression tests pass)
- ✅ German branches can be created and edited
- ✅ Location selector cascade works in all 16 Bundesländer
- ✅ Mobile-responsive UI
- ✅ Multilingual support (de, en, bs)

---

## 16. Resources

### Wikidata Resources
- SPARQL Query Service: https://query.wikidata.org/
- Germany (Q183): https://www.wikidata.org/wiki/Q183
- Bundesland (Q1221156): https://www.wikidata.org/wiki/Q1221156
- Regierungsbezirk (Q106658): https://www.wikidata.org/wiki/Q106658
- Landkreis (Q22865): https://www.wikidata.org/wiki/Q22865

### Data Sources
- corona-hub-germany/landkreise-deutschland: https://github.com/corona-hub-germany/landkreise-deutschland
- WZB plz_geocoord: https://github.com/WZBSocialScienceCenter/plz_geocoord
- OpenPLZ API: https://www.openplzapi.org/en/

### Official Sources
- Destatis (German Federal Statistical Office): https://www.destatis.de/
- German Administrative Structure: https://en.wikipedia.org/wiki/States_of_Germany

---

## 17. Next Steps

1. **Review this plan** - Ensure all stakeholders agree on scope and approach
2. **Set timeline** - Assign dates to each phase
3. **Allocate resources** - Assign developers to tasks
4. **Create tickets** - Break down into actionable tasks
5. **Start Phase 1** - Begin data generation script development

---

**Document Status**: ✅ Complete - Ready for implementation
**Last Updated**: 2025-11-04
**Author**: Claude Code
**Estimated Total Effort**: 1.5-2 weeks (full-time)
