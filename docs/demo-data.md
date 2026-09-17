# Demo aggregate data

The competition UI reads only three checked-in aggregate files in `public/data/`: `grid-cells.json`, `preset-areas.json`, and `dataset-summary.json`. The generator uses the authorized Chanthabuly historical survey as its sole input. Do not put raw wireless CSV files in `public/`, `src/assets/`, or a commit.

## Regenerate locally

Place an authorized copy of `Chanthabuly merge all zone.csv` at `private-data/Chanthabuly merge all zone.csv`. The repository ignores `private-data/`; keep the original input there and do not commit or publish it. From the repository root, run:

```powershell
node scripts/generate-demo-data.cjs --input "private-data/Chanthabuly merge all zone.csv" --out public/data
npm.cmd test
npm.cmd run build
```

The generator validates all three output documents before writing them. The test suite validates the checked-in aggregate documents and can run without the private CSV. Review the three JSON changes before committing; commit aggregate JSON only, never the source CSV or a raw-data backup. The CLI requires explicit `--input` and `--out` paths, and the same input and configuration produce deterministic output.

## What the indicators mean and do not mean

- One accepted source row is one **Observation**, not one physical access point. Rows with invalid coordinates or missing, zero, positive, or otherwise unusable signal are rejected before aggregation; accepted and rejected totals are reported in the summary.
- The 250 m grid is an approximate geographic lattice based on a fixed reference latitude, not a survey of exact property boundaries. The map shows only occupied cells meeting the minimum of five unique BSSID-derived identifiers. Empty cells and occupied cells below that threshold are not published individually.
- Area A/B/C are equal-size, nonoverlapping 3×3 grid blocks selected deterministically for geographic spread and sufficient published-cell coverage. They are not selected as the best sites. Their aggregate metrics include accepted observations in unpublished cells inside each whole block, so preset counts and medians must not be reconstructed by adding published cell unique counts or averaging cell medians.
- Authentication, encryption, and radio labels are grouped into a fixed set of categories. Unsupported or unrecognized values become `Other / Unknown`; this coarse grouping can hide device-level distinctions. Unknown bands are explicit, and known-band shares exclude those observations from their denominator.
- Sparse-cell suppression reduces detail but does **not** guarantee anonymity. Publishing overlapping dataset, cell, and preset aggregates can leave residual differencing risks. Source identifiers, individual coordinates, timestamps, and raw rows must never be copied into public outputs.
- The source is a historical, coverage-biased Chanthabuly survey (approximately November 2024–March 2025), not a live or citywide census. The indicators describe the surveyed wireless environment; they do not directly measure footfall, customers, sales, internet speed, congestion, property value, or suitability of a business location.
- Removing raw files from the current tree does not erase earlier Git commits or any copies already distributed. This task does not rewrite history; treat historical exposure as an ongoing privacy limitation.
