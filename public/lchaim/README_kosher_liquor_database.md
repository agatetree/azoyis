# Kosher Liquor Database — README

A searchable database of kosher alcoholic beverages compiled from two kosher
certification agencies, limited to five spirit categories:

**Scotch · Bourbon (American Whiskey) · Tequila · Vodka · Beer**

## Sources

| Code   | Agency                         | URL                                                                 |
|--------|--------------------------------|---------------------------------------------------------------------|
| Star-K | Star-K Kosher Certification   | https://www.star-k.org/resource/list/W56J90P5/all_liquor            |
| CRC    | cRc (Chicago Rabbinical Council) | https://consumer.crckosher.org/liquor/full-liquor-list/           |

Every row carries a `source` field ("Star-K" or "CRC") and the exact source URL.

## The four kosher-status buckets

| `kosher_status`        | Meaning                                                                                      |
|------------------------|----------------------------------------------------------------------------------------------|
| `certified`            | The agency lists the product with a recognized kosher certification. No separate per-bottle symbol-check instruction is stated. (Does NOT assert a physical symbol has been confirmed on any particular bottle.) |
| `approved_no_symbol`    | Approved by the agency based on known ingredients; no kosher symbol required on the bottle.   |
| `symbol_required`      | Approved only when the required kosher symbol appears on the particular bottle. |
| `not_approved`         | Not approved / not recommended. Do not consume (unless an explicit vintage exception is noted).|

The original wording from each agency is preserved verbatim in the
`source_status_text` field of every row. When in doubt, trust `source_status_text`
and the original website — it is the source of truth.

## How status was mapped (per source)

**CRC** — uses its own `Recommendation` column:
- "Certified" + ("Symbol Required = Yes" or text "when bearing …") → `symbol_required`
- "Certified" (plain, no symbol caveat) → `certified`
- "Acceptable (not certified)" → `approved_no_symbol`
- "Not Recommended" (incl. "…unless purchased before Pesach <year>") → `not_approved`
- "Other / Requires Certification" → `not_approved`

**Star-K** — status is "Approved" / "Not Approved", with qualifiers in the name:
- "Not Approved" → `not_approved`
- "Approved" + "when bearing [symbol]" → `symbol_required`
- "Approved" + "Requires (Kosher) Certification" → `symbol_required`
- "Approved" + "Certified By [agency]" → `certified`
- "Approved" (plain) → `approved_no_symbol`

Note: Star-K expresses its symbol-bearing items as "when bearing
[symbol]", so those land in `symbol_required` (must verify the symbol), not in
`certified`. The `certified` bucket means the agency lists the product with a
recognized kosher certification; it does **not** assert that a physical symbol
has been confirmed on any particular bottle.

## File structure (`kosher_liquor_database.json`)

- `metadata` — sources, bucket definitions, and important notes.
- `items` — **2,903 rows** in the five categories (1,376 CRC + 1,527 Star-K).
  Each row: `source`, `category`, `brand`, `product`, `display_name`,
  `kosher_status`, `source_status_text`, `kosher_symbol`, `requires_symbol`,
  `notes`, `category_source`, `source_captured_at`, `source_occurrences`.
- `star_k_uncategorized` — 858 Star-K rows whose category could not be inferred
  (Star-K has **no category column** in its source list). Status is still correct
  on every row; kept for search completeness.
- `crc_other_spirit_categories` — 888 CRC rows for spirit types outside the
  five requested (Gin, Rum, Rye, Sake, Liqueur, Cider, Seltzer, etc.). Real type
  preserved; included for completeness only.
- `unmapped_status_rows` — 0 (every row mapped to a bucket).
- `summary` — counts by source × category × status, safety-check results
  (run across all three arrays), `collapsed_duplicate_groups`, and
  `collapsed_by_array`.

### Per-record fields

- `source_captured_at` — the date the source page was fetched for this record
  (`2026-08-11`). This is a **capture** date, not an agency verification date; the
  agencies do not publish per-product verification dates.
- `display_name` — a clean, single display string. For normal rows it equals the
  product; for single-line records with no separate product (e.g. Star-K
  "Bitters (Requires Kosher Certification)" or cRc "Cranberry Juice"), it falls
  back to the brand so the record is never blank. **No product name is invented.**
- `source_occurrences` — how many identical source rows collapsed into this one
  database row. `2` means two truly-identical source rows were merged; `1` means
  the row is unique. Differing listings (e.g. Dead Drop Vodka certified OU vs.
  OU-P, or Koval listed under both Bourbon and Vodka) are **kept separate** and
  each carry `source_occurrences: 1`.

### cRc `source_status_text` is a labeled reconstruction, not verbatim text

For CRC rows, `source_status_text` is **not** the raw text of the source cell.
It is a labeled **reconstruction** built from the seven cRc table columns
(Brand, Version, Type, Recommendation, Hashgacha, Symbol Required, Search
Keywords), so that the product name and each status field are clearly separated
and no longer omitted:

```
Brand: <brand> | Version: <product> | Recommendation: <rec> | Hashgacha: <symbol> | Symbol Required: <Yes|blank>
```

Notes on the reconstruction:

- The cRc **Brand** cell frequently concatenates the brand name with a
  certification note (e.g. `MillerCertified when bearing the OU logo`). The
  reconstruction separates the brand name from the note; the full note text is
  preserved verbatim in the row's `notes` field.
- In a few malformed cRc rows the recommendation value `"Other"` was glued into
  the Brand cell (e.g. `Cranberry JuiceOtherRequires Certification`). The
  reconstruction strips that leaked `"Other"` from the brand name (the
  recommendation is taken from the official Recommendation column). No brand or
  product name is invented.
- Star-K rows keep their `Brand | Product | Status` format (unchanged).

## Important caveats

1. **Star-K categories are inferred, not official.** Star-K's list is one
   alphabetical list with no category field. Categories are inferred from
   product-name keywords + a curated brand list. They are **not guaranteed
   complete or 100% accurate**. CRC categories are taken from the official
   "Type" column and are reliable.
2. **Hard cider and hard seltzer are excluded** from Beer (only true beer is
   included). Irish/Canadian/Japanese whisky are excluded from Bourbon.
3. **Safety checks passed:** every row has exactly one valid `kosher_status`;
   no `not_approved` row has `requires_symbol = true`; every `symbol_required`
   row has `requires_symbol = true`; no Star-K row with certification language
   ("when bearing" / "requires certification" / "certified by") was placed in
   `approved_no_symbol`.
4. **`kosher_symbol` is preserved verbatim** as the source agency wrote it
   (e.g. `OU`, `OU-P`, `OU Pareve`, `OU-D`, `STAR-K`, `Star-K`, `cRc`, `cRC`).
   Values are **not** normalized, merged, or reinterpreted.
5. **Duplicate handling:** only truly-identical source rows were collapsed
   (11 groups, each `source_occurrences: 2`). Listings that differ by symbol or
   category are kept as separate rows. The `certified` bucket does **not** assert
   a physical symbol has been confirmed on any particular bottle; it means the
   agency lists the product with a recognized kosher certification and states no
   separate per-bottle symbol-check instruction.
6. **No Passover-specific logic or fields** were added. Passover variants such
   as `OU-P` appear only as raw `kosher_symbol` values, exactly as sourced.
7. **cRc Carmel Wine (manual review).** One cRc Wine row (`Carmel`, blank
   Version) has source columns `Recommendation: Other`, `Hashgacha: OU`,
   `Symbol Required: Yes`, and a Brand-cell note reading *"Certified when bearing
   the OU logo. Some wines are produced during the shmittah year and do not have
   the OU on the label."* The blanket `Other → not_approved` rule would have left
   it as `not_approved` with `requires_symbol: true` — a contradiction. Because the
   note explicitly says "Certified when bearing the OU logo," the correct
   representation is `symbol_required` (only acceptable when the bottle bears the
   OU logo); the Shmittah caveat is preserved verbatim in `notes`. This is a
   single-record manual override, **not** an automatic reclassification rule, and
   no other `Other` rows were changed.
8. **Safety checks run across all three arrays** (`items` + `star_k_uncategorized`
   + `crc_other_spirit_categories`), not only `items`. Checks: every row has
   exactly one valid `kosher_status`; no `not_approved` row has
   `requires_symbol = true`; every `symbol_required` row has
   `requires_symbol = true`; no `approved_no_symbol` row contains certification
   language ("when bearing" / "requires…cert" / "certified by"). Result: 0 errors.
9. **Duplicate collapsing is applied to all three arrays.** 18 truly-identical
   duplicate groups were collapsed in total (11 in `items`, 7 in
   `star_k_uncategorized`, 0 in `crc_other_spirit_categories`), each recorded with
   `source_occurrences: 2`. Listings that differ by symbol or category are kept
   separate. See `summary.collapsed_by_array`.

## Searching the JSON

```python
import json
db = json.load(open("kosher_liquor_database.json"))

# All CRC-certified vodkas
[r for r in db["items"] if r["source"]=="CRC" and r["category"]=="Vodka"
   and r["kosher_status"]=="certified"]

# Is a specific brand approved? (search both categorized + uncategorized)
name = "glenlivet"
rows = [r for r in db["items"]+db["star_k_uncategorized"]
       if name in (r["brand"]+r["product"]).lower()]
for r in rows: print(r["source"], r["kosher_status"], r["source_status_text"])
```

Generated 2026-08-11. Always confirm against the live agency websites before
relying on a ruling for religious observance.
