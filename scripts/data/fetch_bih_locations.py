#!/usr/bin/env python3
"""
Fetch Bosnia and Herzegovina administrative LOV data from Wikipedia/Wikidata.

Outputs a structured JSON file under data/geo/bih_locations.json containing
state, region (entities/cantons/district) and city/municipality records with
local names, Wikidata IDs, and coordinates.
"""

from __future__ import annotations

import json
import math
import os
import re
import sys
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "data" / "geo" / "bih_locations.json"

WIKI_API = "https://bs.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
USER_AGENT = "pustikorijen-data-fetcher/0.1 (https://github.com/bohhem/pustikorijen)"

STATE_QID = "Q225"  # Bosna i Hercegovina
ENTITY_QIDS = {
    "Q11198": {"code": "FBiH", "name": "Federacija Bosne i Hercegovine"},
    "Q11196": {"code": "RS", "name": "Republika Srpska"},
    "Q194483": {"code": "BD", "name": "Brčko distrikt"},
}

CANTON_QIDS = {
    "Q18248": {"code": "USK", "name": "Unsko-sanski kanton", "seat": "Bihać"},
    "Q18249": {"code": "PK", "name": "Posavski kanton", "seat": "Orašje"},
    "Q18250": {"code": "TK", "name": "Tuzlanski kanton", "seat": "Tuzla"},
    "Q18253": {"code": "ZDK", "name": "Zeničko-dobojski kanton", "seat": "Zenica"},
    "Q18256": {"code": "BPK", "name": "Bosansko-podrinjski kanton Goražde", "seat": "Goražde"},
    "Q18262": {"code": "SBK", "name": "Srednjobosanski kanton", "seat": "Travnik"},
    "Q18273": {"code": "HNK", "name": "Hercegovačko-neretvanski kanton", "seat": "Mostar"},
    "Q18275": {"code": "ZHK", "name": "Zapadnohercegovački kanton", "seat": "Široki Brijeg"},
    "Q18276": {"code": "KS", "name": "Kanton Sarajevo", "seat": "Sarajevo"},
    "Q18277": {"code": "K10", "name": "Kanton 10", "seat": "Livno"},
}

MUNICIPALITY_TYPES = {
    "Q17268368",  # municipality of the Federation of Bosnia and Herzegovina
    "Q57315116",  # municipality of the Republika Srpska
    "Q2706302",  # municipality of Bosnia and Herzegovina
    "Q102104752",  # city of Bosnia and Herzegovina (administrative)
    "Q902814",  # city municipality of Republika Srpska
}
CANTON_TYPE = "Q18279"

CHAR_REPLACEMENTS = {
    "š": "s",
    "Š": "s",
    "č": "c",
    "Č": "c",
    "ć": "c",
    "Ć": "c",
    "ž": "z",
    "Ž": "z",
    "đ": "dj",
    "Đ": "dj",
    "á": "a",
    "Á": "a",
    "é": "e",
    "É": "e",
    "í": "i",
    "Í": "i",
    "ó": "o",
    "Ó": "o",
    "ú": "u",
    "Ú": "u",
}


def normalize_ascii(value: str) -> str:
    normalized = value
    for src, dst in CHAR_REPLACEMENTS.items():
        normalized = normalized.replace(src, dst)
    return normalized


def slugify(name: str) -> str:
    ascii_name = normalize_ascii(name)
    result = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_name.lower()).strip("-")
    return result


def generate_city_code(name: str, slug: Optional[str]) -> str:
    source = slug or slugify(name)
    ascii_source = normalize_ascii(source).upper()
    ascii_source = re.sub(r"[^A-Z0-9]", "", ascii_source)
    if not ascii_source:
        ascii_source = "BIH"
    code = ascii_source[:4] if len(ascii_source) >= 4 else ascii_source.ljust(3, ascii_source[-1])
    return code


def contains_cyrillic(text: str) -> bool:
    return any("\u0400" <= ch <= "\u04FF" for ch in text)


def request_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    resp = requests.get(url, params=params, headers={"User-Agent": USER_AGENT})
    resp.raise_for_status()
    return resp.json()


def parse_numeric_int(text: str) -> Optional[int]:
    cleaned = text.split("(")[0].strip()
    if not cleaned:
        return None
    cleaned = (
        cleaned.replace(".", "")
        .replace(",", "")
        .replace(" ", "")
        .replace("\xa0", "")
        .replace("\u00a0", "")
    )
    return int(cleaned) if cleaned.isdigit() else None


def parse_numeric_float(text: str) -> Optional[float]:
    cleaned = text.split("(")[0].strip()
    if not cleaned:
        return None
    cleaned = (
        cleaned.replace(".", "")
        .replace(" ", "")
        .replace("\xa0", "")
        .replace("\u00a0", "")
        .replace(",", ".")
    )
    try:
        return float(cleaned)
    except ValueError:
        return None


def fetch_municipality_rows() -> List[Dict[str, Any]]:
    html = request_json(
        WIKI_API,
        {
            "action": "parse",
            "page": "Općine_Bosne_i_Hercegovine",
            "prop": "text",
            "format": "json",
        },
    )["parse"]["text"]["*"]
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", {"class": "wikitable"})
    if table is None:
        raise RuntimeError("Could not find municipality table on Wikipedia page.")

    rows: List[Dict[str, Any]] = []
    for tr in table.find_all("tr"):
        cells = tr.find_all("td")
        if not cells:
            continue
        name_cell = cells[0]
        display_name = name_cell.get_text(" ", strip=True)
        link = name_cell.find("a")
        wiki_title = link["title"] if link else display_name
        wiki_link = link["href"] if link else None
        wiki_slug = None
        if wiki_link and wiki_link.startswith("/wiki/"):
            wiki_slug = wiki_link.split("/wiki/")[1]

        entry = {
            "display_name": display_name,
            "wiki_title": wiki_title,
            "wiki_slug": wiki_slug,
            "num_settlements": parse_numeric_int(cells[1].get_text(" ", strip=True)) if len(cells) > 1 else None,
            "population_2013": parse_numeric_int(cells[2].get_text(" ", strip=True)) if len(cells) > 2 else None,
            "density_per_km2": parse_numeric_float(cells[3].get_text(" ", strip=True)) if len(cells) > 3 else None,
            "area_km2": parse_numeric_float(cells[4].get_text(" ", strip=True)) if len(cells) > 4 else None,
            "is_official_city": tr.get("bgcolor", "").lower() == "#bbf3ff",
        }
        rows.append(entry)

    if not rows:
        raise RuntimeError("Municipality table parsing yielded zero rows.")
    return rows


def fetch_wikibase_ids(titles: List[str]) -> Dict[str, str]:
    title_to_qid: Dict[str, str] = {}
    chunk_size = 40
    for i in range(0, len(titles), chunk_size):
        chunk = titles[i : i + chunk_size]
        data = request_json(
            WIKI_API,
            {
                "action": "query",
                "prop": "pageprops",
                "ppprop": "wikibase_item",
                "titles": "|".join(chunk),
                "format": "json",
            },
        )
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            title = page.get("title")
            qid = page.get("pageprops", {}).get("wikibase_item")
            if title and qid:
                title_to_qid[title] = qid
    return title_to_qid


class WikidataResolver:
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}

    def ensure_entities(self, qids: Iterable[str]) -> None:
        qids = [qid for qid in qids if qid and qid not in self.cache]
        if not qids:
            return
        chunk_size = 40
        for i in range(0, len(qids), chunk_size):
            chunk = qids[i : i + chunk_size]
            data = request_json(
                WIKIDATA_API,
                {
                    "action": "wbgetentities",
                    "ids": "|".join(chunk),
                    "props": "labels|claims",
                    "languages": "bs|sh|hr|sr|en",
                    "format": "json",
                },
            )
            entities = data.get("entities", {})
            for qid, entity in entities.items():
                if "missing" not in entity:
                    self.cache[qid] = entity

    def get_entity(self, qid: str) -> Dict[str, Any]:
        if qid not in self.cache:
            self.ensure_entities([qid])
        if qid not in self.cache:
            raise KeyError(f"Wikidata entity {qid} not found")
        return self.cache[qid]

    def get_labels(self, qid: str) -> Dict[str, str]:
        entity = self.get_entity(qid)
        labels = entity.get("labels", {})
        return {lang: data["value"] for lang, data in labels.items()}

    def best_label(self, qid: Optional[str]) -> Optional[str]:
        if not qid:
            return None
        labels = self.get_labels(qid)
        for lang in ("bs", "sh", "hr", "sr", "en"):
            if lang in labels:
                return labels[lang]
        return next(iter(labels.values()), None)

    def get_types(self, qid: str) -> Set[str]:
        entity = self.get_entity(qid)
        types = set()
        for claim in entity.get("claims", {}).get("P31", []):
            target = claim.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
            if target:
                types.add(target)
        return types

    def get_parents(self, qid: str) -> List[str]:
        entity = self.get_entity(qid)
        parents = []
        for claim in entity.get("claims", {}).get("P131", []):
            target = claim.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
            if target:
                parents.append(target)
        return parents

    def get_coordinates(self, qid: str) -> Tuple[Optional[float], Optional[float]]:
        entity = self.get_entity(qid)
        coords_claims = entity.get("claims", {}).get("P625", [])
        if not coords_claims:
            return None, None
        coord_value = coords_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
        if not coord_value:
            return None, None
        return coord_value.get("latitude"), coord_value.get("longitude")


def resolve_hierarchy(resolver: WikidataResolver, qid: str) -> Dict[str, Optional[str]]:
    result = {"municipality": None, "region": None, "entity": None, "state": None}
    queue: deque[Tuple[str, int]] = deque([(qid, 0)])
    visited: Set[str] = set()

    while queue:
        current, depth = queue.popleft()
        if depth > 5 or current in visited:
            continue
        visited.add(current)
        try:
            types = resolver.get_types(current)
        except KeyError:
            continue

        if current != qid and not result["municipality"] and (types & MUNICIPALITY_TYPES):
            result["municipality"] = current

        if not result["region"]:
            if CANTON_TYPE in types:
                result["region"] = current
            elif current in ENTITY_QIDS or current == "Q194483":
                result["region"] = current

        if not result["entity"] and current in ENTITY_QIDS:
            result["entity"] = current

        if not result["state"] and current == STATE_QID:
            result["state"] = current

        for parent in resolver.get_parents(current):
            queue.append((parent, depth + 1))

    # Fallbacks
    if not result["entity"] and result["region"]:
        for parent in resolver.get_parents(result["region"]):
            if parent in ENTITY_QIDS:
                result["entity"] = parent
                break

    if not result["entity"]:
        # If municipality points to entity directly
        parents = resolver.get_parents(result["municipality"]) if result["municipality"] else []
        for parent in parents:
            if parent in ENTITY_QIDS:
                result["entity"] = parent
                break

    if not result["state"] and result["entity"]:
        parent_entities = resolver.get_parents(result["entity"])
        if STATE_QID in parent_entities or not parent_entities:
            result["state"] = STATE_QID

    if not result["municipality"]:
        result["municipality"] = qid
    if not result["region"]:
        result["region"] = result["entity"]
    if not result["entity"]:
        result["entity"] = "Q194483" if result["region"] == "Q194483" else None
    if not result["state"]:
        result["state"] = STATE_QID
    return result


def build_regions_payload(resolver: WikidataResolver) -> List[Dict[str, Any]]:
    regions: List[Dict[str, Any]] = []

    # Entities / district
    for qid, meta in ENTITY_QIDS.items():
        lat, lng = resolver.get_coordinates(qid)
        regions.append(
            {
                "region_id": f"bih-{meta['code'].lower()}",
                "state_id": "bih",
                "name": meta["name"],
                "code": meta["code"],
                "type": "entity" if qid != "Q194483" else "district",
                "wikidata_id": qid,
                "parent_region_id": None,
                "latitude": lat,
                "longitude": lng,
            }
        )

    # Cantons
    for qid, meta in CANTON_QIDS.items():
        lat, lng = resolver.get_coordinates(qid)
        regions.append(
            {
                "region_id": f"bih-fbih-{meta['code'].lower()}",
                "state_id": "bih",
                "name": meta["name"],
                "code": meta["code"],
                "type": "canton",
                "wikidata_id": qid,
                "parent_region_id": "bih-fbih",
                "seat": meta["seat"],
                "latitude": lat,
                "longitude": lng,
            }
        )
    return regions


def main() -> None:
    print("Fetching municipality table...", file=sys.stderr)
    rows = fetch_municipality_rows()
    title_to_qid = fetch_wikibase_ids([row["wiki_title"] for row in rows])
    missing_titles = [title for title in title_to_qid if not title_to_qid[title]]
    if missing_titles:
        raise RuntimeError(f"Missing Wikidata IDs for titles: {missing_titles}")

    for row in rows:
        row["wikidata_id"] = title_to_qid.get(row["wiki_title"])
        if not row["wikidata_id"]:
            raise RuntimeError(f"Wikidata ID missing for {row['wiki_title']}")
        row["slug"] = slugify(row["display_name"])
        row["code"] = generate_city_code(row["display_name"], row["slug"])

    resolver = WikidataResolver()
    resolver.ensure_entities([row["wikidata_id"] for row in rows])
    resolver.ensure_entities(list(ENTITY_QIDS.keys()))
    resolver.ensure_entities(list(CANTON_QIDS.keys()))
    resolver.ensure_entities([STATE_QID])

    processed: List[Dict[str, Any]] = []
    for row in rows:
        qid = row["wikidata_id"]
        lat, lng = resolver.get_coordinates(qid)
        hierarchy = resolve_hierarchy(resolver, qid)

        municipality_label = resolver.best_label(hierarchy["municipality"])
        region_qid = hierarchy["region"]
        entity_qid = hierarchy["entity"]

        if not region_qid:
            region_qid = entity_qid

        region_id = None
        region_type = None
        region_code = None
        if region_qid in CANTON_QIDS:
            region_code = CANTON_QIDS[region_qid]["code"]
            region_type = "canton"
            region_id = f"bih-fbih-{region_code.lower()}"
        elif region_qid in ENTITY_QIDS:
            region_code = ENTITY_QIDS[region_qid]["code"]
            region_type = "entity"
            region_id = f"bih-{region_code.lower()}"
        elif region_qid == "Q194483":
            region_code = "BD"
            region_type = "district"
            region_id = "bih-bd"

        entity_code = ENTITY_QIDS.get(entity_qid or "", {}).get("code")
        entity_id = f"bih-{entity_code.lower()}" if entity_code else None

        prefix = "Grad" if row["is_official_city"] else "Općina"
        fallback_muni_name = row["display_name"]
        if not fallback_muni_name.lower().startswith(prefix.lower()):
            fallback_muni_name = f"{prefix} {fallback_muni_name}"
        muni_label = municipality_label or fallback_muni_name
        if contains_cyrillic(muni_label):
            muni_label = fallback_muni_name

        processed.append(
            {
                "city_id": f"{entity_code or 'bih'}-{row['slug']}",
                "code": row["code"],
                "name": row["display_name"],
                "slug": row["slug"],
                "wikidata_id": qid,
                "wikipedia_title": row["wiki_title"],
                "metrics": {
                    "num_settlements": row["num_settlements"],
                    "population_2013": row["population_2013"],
                    "density_per_km2": row["density_per_km2"],
                    "area_km2": row["area_km2"],
                },
                "is_official_city": row["is_official_city"],
                "coordinates": {"latitude": lat, "longitude": lng},
                "municipality": {
                    "wikidata_id": hierarchy["municipality"],
                    "name": muni_label,
                },
                "region": {
                    "region_id": region_id,
                    "wikidata_id": region_qid,
                    "code": region_code,
                    "type": region_type,
                    "name": resolver.best_label(region_qid),
                },
                "entity": {
                    "region_id": entity_id,
                    "wikidata_id": entity_qid,
                    "code": entity_code,
                    "name": resolver.best_label(entity_qid),
                },
                "state_id": "bih",
            }
        )

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "https://bs.wikipedia.org/wiki/Općine_Bosne_i_Hercegovine",
            "records": len(processed),
        },
        "state": {
            "state_id": "bih",
            "name": "Bosna i Hercegovina",
            "iso2": "BA",
            "wikidata_id": STATE_QID,
        },
        "regions": build_regions_payload(resolver),
        "cities": processed,
    }

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"Wrote {len(processed)} city records to {DATA_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
