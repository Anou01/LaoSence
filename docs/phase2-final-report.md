# LaoSence Phase 2 — final acceptance report

This is the Task 12 evidence audit of the Phase 2 implementation, based on the plan, checked-in aggregate files, Git tree, and Task 0–11 checkpoints. Task 12 changes documentation only: it did **not** rerun npm installation, tests, build, lint, or browser automation. Task 11's clean snapshot and production preview tested implementation commit `2922be934088d3dc9bc11e7174fc8b993417389a`; the intervening `310e77c` checkpoint changed documentation only. Results below retain their original task provenance. The local browser evidence is from a production **preview**, not a deployed site.

## Acceptance checklist

| # | Requirement | Finding and evidence |
|---:|---|---|
| 1 | Correct baseline/branch and fresh baseline commands | **Pass.** Task 0 began at `73cfb1c285eb7c0983a7295ad77c4093cfeb9259` on the Phase 2 branch. After initial Windows file-lock failures, baseline `npm ci`, build, lint, and the five Wi-Fi tests passed; see [Task 0 checkpoint](phase2-progress.md). |
| 2 | Explicit input, deterministic JSON, no ZONE merge | **Pass.** The generator used only the private Chanthabuly copy. Task 2 showed byte-identical forward/reversed generation; Task 11 regenerated all three outputs with matching hashes. No `ZONE A2.csv` input was merged. |
| 3 | 250 m independent-origin grid and suppression ≥5 | **Pass.** The fixed lattice origin, cell geometry, and threshold are covered by spatial tests; Task 11 validated lattice geometry and every published cell's minimum five distinct identifiers. |
| 4 | Accepted/rejected Observation semantics and negative RSSI | **Pass.** One accepted row is one Observation. Task 11 regeneration counted 32,165 input, 32,164 accepted, and one rejected for invalid signal; normalization tests require finite negative lowercase `signal`. |
| 5 | Dataset/preset distinct counts from whole raw scope | **Pass.** Spatial regressions compare whole-scope distinct identifiers against sums of cell counts; public summary has 25,291 observed identifiers and 32,164 Observations. The preset JSON holds its own distinct counts, not sums of cell unique counts. |
| 6 | Preset median from raw signals, not cell medians | **Pass.** A spatial regression distinguishes a preset's raw-observation median from the average of its cell medians; A/B/C use the generated preset values. |
| 7 | A/B/C equal geometry, nine positions, nonoverlap, declared selection/fallback | **Pass.** All three are 3×3 blocks of 250 m cells, each 0.5625 km², with 27 distinct positions total. Preset metadata records `longitude-thirds`, minimum published coverage five, and `fallbackUsed: false`; fallback behavior has a synthetic regression. |
| 8 | No public identifiers, hashes, raw timestamps/rows/AP coordinates | **Pass for current outputs/tree.** Task 11 `validatePublicOutputs()` passed on public JSON, rebuilt `dist/data`, a clean-snapshot build, and regenerated JSON; allowlists, private-field/MAC checks, and raw-row rejection passed. This does not erase historical commits or guarantee anonymity. |
| 9 | Grid default intensity, honest legend, no marker cloud | **Pass.** Task 10 browser check saw 380 grid rectangles and zero individual marker icons; the intensity legend and within-survey labeling were checked. The optional metric selector was deferred (item 21). |
| 10 | Cell interaction and A/B/C buttons/panels | **Pass.** Task 10 clicked all presets and cell `8013_43458`, matched panel metrics to JSON, verified whole-block outline/fit and mutually exclusive cell/preset selection; Task 11 repeated the interaction smoke check. |
| 11 | Compare defaults/selectors/descriptive thresholds/no winner | **Pass.** Task 7 regression tests cover threshold boundaries, null/zero denominators, distinct A/B default, and duplicate prevention. Task 10–11 browser checks exercised A/B, C/B, C/A without refetch and found at most three factual statements, no winner or business score. |
| 12 | Analytics distributions and Observations wording | **Pass.** Task 10–11 browser checks matched 32,164 Observations and 25,291 Observed network identifiers to the summary; six charts and six Observations tooltips were exercised. |
| 13 | Root/legacy routes free of raw provider requests/crashes | **Pass in local preview.** Task 8 mounted the spatial provider and migrated mounted admin consumers. Task 10–11 four-route browser checks found no raw wireless requests or page-breaking errors. |
| 14 | Current HEAD and fresh build free of raw wireless CSV | **Pass.** Task 11 found no tracked file in the two original CSV folders and no raw wireless CSV in public/source/build inventories; Task 12 read-only Git inventory remained empty. |
| 15 | All four routes free of raw requests/page-breaking errors | **Pass in local preview.** Task 11 attached listeners before direct navigation to `/`, `/map`, `/analysis`, `/compare`; client navigation and selections added no wireless-data fetches. See item 19 for the recorded data paths. |
| 16 | Empty/loading/failure/null-data and Retry | **Pass.** Task 10–11 intercepted HTTP 500, malformed presets, and inconsistent empty-grid data, saw truthful loading/error states and successful Retry; null median, unknown band, and empty channels used explicit missing-data messages. |
| 17 | Historical/survey/business/privacy limitations visible | **Pass.** Shared limitations and Compare copy describe historical, coverage-biased observations and exclude direct inferences about footfall, sales, speed, property value, or suitability; suppression is explicitly not an anonymity guarantee. |
| 18 | Fresh install/build/lint/all tests | **Qualified pass.** Task 11's clean ignored snapshot of implementation commit `2922be9` passed `npm ci`, build, lint, all three suites, and `npm test`. The main checkout's `npm ci` failed with `EPERM` because existing Vite processes held a native module; after repair, its test/build/lint passed. This report does not turn that checkout install failure into a pass. |
| 19 | Four screenshots and measured performance | **Pass as local evidence.** Four ignored screenshots exist (item 22). Task 10 measured a 3,398.3 ms navigation-to-grid-ready sample, 86.2 ms from last aggregate response to rendered grid, and 25.9–67.3 ms map selection / 6.7–11.5 ms Compare changes. These are machine-specific samples, not SLAs or pure parse timings. Task 11 retook the grid screenshot after 12/12 visible tiles loaded. |

The 19 required rows have 18 evidence passes and one qualified pass (fresh installation). That qualification is a real checkout failure, not a skipped result. The only browser checks were local production previews from Tasks 10–11; Task 12 did not independently rerun them. Hosted-production behavior, remediation of npm advisories, and future external-tile availability remain unverified. The optional metric selector was explicitly optional and is deferred, not counted as a completed feature.

## Required handoff record — 22 items

1. **Branch:** `laosence-phase2-spatial-intelligence` (confirmed at the Task 12 starting HEAD).
2. **Starting commit:** Phase 2 baseline `73cfb1c285eb7c0983a7295ad77c4093cfeb9259`; Task 12 started at `310e77cbb7ffc329bc3e09fd0accf8fcfbf109e6` with a clean working tree.
3. **Final commit SHA:** The containing Task 12 documentation commit is reported in the final handoff message. A commit cannot contain its own final SHA without changing that SHA; the plan explicitly permits the external reference.
4. **Reviewable commit list, baseline to pre-report HEAD:**

   | SHA | Subject |
   |---|---|
   | `a9b3824` | Prepare isolated Phase 2 workflow |
   | `a64c5bf` | Deterministic wireless aggregation primitives |
   | `4e8a0d9` | Privacy-reduced spatial demo data generation |
   | `d8d4e92` | Spatial privacy and portable Wi-Fi regressions |
   | `bac00b0` | Aggregate spatial data context |
   | `932c032` | Grid intelligence map |
   | `47dd6f7` | Sparse grid intensity boundary fix |
   | `fb4ac30` | Preset area intelligence |
   | `84b0056` | Factual area comparison |
   | `8c0b21d` | Aggregate data across competition routes |
   | `df09cb4` | Remove raw wireless datasets from current tree |
   | `2922be9` | Record browser acceptance evidence |
   | `310e77c` | Verify spatial aggregation and privacy |
   | Final SHA | This Task 12 report/checkpoint commit; see final handoff |

5. **Files created:** `docs/demo-data.md`, this report, `docs/phase2-progress.md`, `docs/superpowers/plans/2026-09-17-laosence-phase2-spatial-intelligence.md`; the three JSON files in item 8; `scripts/generate-demo-data.cjs`, `scripts/lib/spatial.cjs`; `src/components/DatasetLimitations.tsx`, `src/components/map/AreaIntelligencePanel.tsx`, `src/components/map/GridIntelligenceLayer.tsx`, `src/components/map/GridLegend.tsx`, `src/components/map/PresetAreaControls.tsx`; `src/context/SpatialDataContext.tsx`, `src/context/spatialContext.ts`; `src/pages/ComparePage.tsx`; `src/type/spatial.ts`; `src/utils/areaPresentation.ts`, `src/utils/loadSpatialData.ts`, `src/utils/spatialMetrics.ts`; `tests/spatial.test.cjs`, `tests/spatial-ui.test.cjs`. The four screenshots are ignored local artifacts, not committed files.
6. **Files modified:** `.gitignore`, `package.json`, `src/components/NavBar.tsx`, `src/components/analysis/{AllChartContainer,AuthenticationChart,ChannelChart,EncryptionTypeChar,FrequencyChart,RadioTypesChart,SignalStrengthChart}.tsx`, `src/main.tsx`, `src/pages/{AnalysisPage,MapPage}.tsx`, `src/pages/admin/{AdminAnalysisPage,AdminMapPage,AdminUploadPage}.tsx`, `tests/wifi.test.cjs`; this task also appends the final checkpoint to `docs/phase2-progress.md`.
7. **Exact raw files removed from the current tree:**

   - `public/CSV_FILE/Chanthabuly merge all zone.csv`
   - `public/CSV_FILE/LPB-result.csv`
   - `public/CSV_FILE/ZONE A2.csv`
   - `public/CSV_FILE/result-VTE.csv`
   - `public/CSV_FILE/result_FOEN.csv`
   - `src/assets/CSV_FILE/Chanthabuly merge all zone.csv`
   - `src/assets/CSV_FILE/ZONE A2.csv`

8. **Aggregate paths:** `public/data/grid-cells.json`, `public/data/preset-areas.json`, and `public/data/dataset-summary.json`. Task 11 regeneration SHA-256 values, reconfirmed from the current files by a Task 12 read-only hash check, were respectively `3024F10AFF22216EA3512E9A8C429036D0F1658945D1BA6D2411C08527D78E2D`, `F40151332A5CAF42D5E95609305AE8EB1F5364588CC5293DECF636F048F4F9A8`, and `5E4E7A1FCFAC59B46B0B19BF1200DFD2E12519DC440263481C7DCA2BA2D703D9`.
9. **Published cells:** 380 (`dataset-summary.json`).
10. **Suppressed occupied cells:** 39 (`dataset-summary.json`); suppressed locations are not published individually.
11. **Area A:** 750 m × 750 m, approximately 0.5625 km²; 5/9 published cells; 46 observed identifiers, 46 Observations; median −79.5 dBm; bands 2.4 GHz 33, 5 GHz 13, other/unknown 0; authentication Open 2, WPA2 Personal 44; encryption CCMP 44, Other/Unknown 2.
12. **Area B:** Same area size; 8/9 published; 391 identifiers, 391 Observations; median −77 dBm; bands 2.4 GHz 267, 5 GHz 124, other/unknown 0; authentication OWE 3, Open 18, WPA Personal 1, WPA2 Personal 369; encryption CCMP 373, Other/Unknown 18.
13. **Area C:** Same area size; 8/9 published; 394 identifiers, 447 Observations; median −69 dBm; bands 2.4 GHz 316, 5 GHz 131, other/unknown 0; authentication OWE 9, Open 6, WPA Personal 3, WPA2 Enterprise 1, WPA2 Personal 428; encryption CCMP 439, Other/Unknown 6, TKIP 2. These are preset metrics computed from raw observations in their whole areas, not sums/averages of displayed cell metrics.
14. **Geometry and selection:** Each preset lists nine 250 m lattice positions in a 3×3 block; their 27 cell IDs are distinct. The deterministic method ranks candidate blocks within longitude thirds using geometric location and requires at least five published cells. The actual dataset used no fallback (`fallbackUsed: false`); a narrow-coverage fallback is tested synthetically.
15. **Fresh build:** Task 11 clean-snapshot and repaired-checkout `npm.cmd run build` both exited 0. The inherited Vite warning for a main JavaScript chunk above 500 kB remains. No Task 12 build was run because only docs changed.
16. **Fresh lint:** Task 11 clean-snapshot and repaired-checkout `npm.cmd run lint` both exited 0. No Task 12 lint was run.
17. **Exact Task 11 test results:** `node --test tests/wifi.test.cjs`: 5 passed / 0 failed / 0 skipped; `tests/spatial.test.cjs`: 25 / 0 / 0; `tests/spatial-ui.test.cjs`: 19 / 0 / 0; clean-snapshot `npm.cmd test`: 49 / 0 / 0. The repaired checkout also ran `npm.cmd test`: 49 / 0 / 0. These counts were **not rerun in Task 12**.
18. **Browser pages/interactions verified:** Task 11 clean-build production preview directly loaded `/`, `/map`, `/analysis`, `/compare`; exercised client navigation, A/B/C preset and cell selection, Compare C/B and C/A selectors, Analytics totals/six chart tooltips, HTTP 500/malformed/empty-grid Retry, and null-median/unknown-band/empty-channel cases. No page-breaking error was reported. This is local preview evidence, not an external production-deployment test.
19. **Recorded wireless request URLs:** On each direct route, the Task 11 browser listener (attached before navigation) recorded only `/data/grid-cells.json`, `/data/preset-areas.json`, and `/data/dataset-summary.json` as wireless data requests. Navigation and Map/Compare selections made zero additional wireless-data requests. No `/CSV_FILE/` or wireless `.csv` request was seen. Task 9 also checked that the seven old raw URLs returned SPA HTML (`text/html`, HTTP 200 fallback), **not CSV**; an HTTP 200 by itself is therefore not proof of exposed raw data.
20. **Privacy and geometry validation:** Task 11 `validatePublicOutputs()` passed on checked-in public data, freshly rebuilt checkout `dist/data`, clean-snapshot `dist/data`, and regenerated outputs. It checked allowlisted schemas, forbidden private fields/MAC-like values, no raw rows, lattice/cell geometry, threshold ≥5, equal preset dimensions, and nonoverlap. Source/build inventories and the tracked HEAD tree found no raw wireless CSV in either former raw folder or `dist`. The clean-snapshot archive changed JSON line endings to CRLF: its raw dist hashes differed, but LF-normalized bytes, parsed values, and validation matched; the rebuilt main `dist/data` matched public JSON byte-for-byte.
21. **Warnings, limits, deferred/unverified:** Task 11 clean `npm ci` reported **18 dependency advisories** (1 low, 3 moderate, 13 high, 1 critical); no upgrade was made. The main checkout's `npm ci` remained an `EPERM` failure under pre-existing Windows Vite file locks, although the clean snapshot install and repaired-checkout checks passed. The inherited >500 kB bundle warning remains. A missing favicon produces a nonbreaking 404 on `/`. The map depends on external OpenStreetMap tiles; Task 11 captured the final grid screenshot only after 12/12 visible tiles loaded, which does not guarantee future tile availability. The optional map metric selector was **deferred**; the default infrastructure-intensity metric works, but there is no unfinished selector in the UI. Survey coverage is historical and biased, not live/citywide; wireless metrics do not measure business outcomes. Suppression reduces exposure but **does not guarantee anonymity**. Removing current-tree CSV does not remove any raw data that may remain in earlier Git history or previously distributed copies. No hosted-production, security-remediation, or future-tile-availability verification is claimed.
22. **Screenshot paths (ignored local artifacts, not committed):** `artifacts/phase2/grid-map.png` (retaken Task 11 with complete visible tiles), `artifacts/phase2/cell-area-intelligence.png`, `artifacts/phase2/preset-area.png`, `artifacts/phase2/compare-area-a-vs-b.png`. Task 12 confirmed these paths existed but did not recapture them; a fresh checkout needs the ignored artifacts supplied separately to view them.

**BEFORE → AFTER:** Public raw wireless CSV and individual map markers → ignored private Chanthabuly preprocessing input, three validated aggregate JSON outputs, and grid/preset/summary-based Map, Analytics, and Compare views. This is a descriptive, privacy-reduced survey presentation—not guaranteed anonymity, live coverage, or a business-location recommendation.
