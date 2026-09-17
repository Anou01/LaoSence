# LaoSence Phase 2 Progress

## Task 0 — Confirm baseline and protect local input

- Status: complete
- Branch: `laosence-phase2-spatial-intelligence`
- Starting/Task 0 commit: `73cfb1c285eb7c0983a7295ad77c4093cfeb9259`
- Baseline before branch creation: branch `laosence-phase1-stabilize`; the only pre-existing change was the expected untracked Phase 2 plan file.
- Scoped files: `.gitignore`, `docs/superpowers/plans/2026-09-17-laosence-phase2-spatial-intelligence.md`, `docs/phase2-progress.md`
- Private input: ignored local copy created; source and copy SHA-256 both equal `CFB0F722820DF7D3B7CA074ADA198C6D5D693782DFABABB91D4298941FAC3E36`; `git check-ignore` exit `0`.
- Raw wireless files: retained. No raw CSV was removed or modified.

### Baseline commands

| Command | Exit | Result |
|---|---:|---|
| `npm.cmd ci` | 0 | Passed after stopping the repository's existing `npm run dev:all` Vite/API processes that held a native dependency file. npm reported 18 audit vulnerabilities: 1 low, 3 moderate, 13 high, 1 critical. |
| `npm.cmd run build` | 0 | Passed. Vite reported the existing warning that the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| `node --test tests/wifi.test.cjs` | 0 | 5 tests passed; 0 failed, 0 skipped, 0 todo. |

The first two `npm.cmd ci` attempts exited `1` with `EPERM` while unlinking `node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node`; after the repository-local dev processes were stopped, the required clean install completed successfully. The initial build also exited `1` because the partial install left `tsc` unavailable; the post-install build passed.

Next task: **Task 1 — Pure offline normalization and aggregation**.

## Task 1 — Pure offline normalization and aggregation

- Status: complete
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `a9b3824184eb5c1b403e1666fdc2beea1520ebf9`
- Commit message: `feat: add deterministic wireless aggregation primitives`
- Scoped files: `scripts/lib/spatial.cjs`, `tests/spatial.test.cjs`, `docs/phase2-progress.md`
- Frontend: unchanged. Raw CSV files: retained; no raw data was removed or modified.
- Interfaces implemented: `normalizeRawRow`, `gridAddress`, `cellGeometry`, `aggregateObservations`, `knownBandShares`.
- TDD evidence: the new suite first failed with the expected missing-module error; the first implementation run exposed the `None` encryption mapping issue, which was fixed before the final checks.

### Task 1 checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial.test.cjs` | 0 | 8 tests passed; 0 failed, 0 skipped, 0 todo. |
| `node --test tests/wifi.test.cjs` | 0 | 5 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing Vite warning remains: the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |

The implementation accepts only finite, strictly negative lowercase `signal`, normalizes identifiers with trim/lowercase before counting, keeps observation and unique-identifier counts separate, uses the fixed lattice origin, computes median from observation signals, and excludes `otherUnknown` from known-band share denominators.

Remaining issue: none for Task 1.

Next task: **Task 2 — Preset selection, generator, and aggregate outputs**. Do not start it in the Task 1 turn.

## Task 2 — Preset selection, generator, and aggregate outputs

- Status: complete
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `a64c5bf40c99983dc344525e603f1ba49bb51109`
- Commit message: `feat: generate privacy-safe spatial demo data`
- Scoped files: `scripts/lib/spatial.cjs`, `scripts/generate-demo-data.cjs`, `tests/spatial.test.cjs`, `public/data/grid-cells.json`, `public/data/preset-areas.json`, `public/data/dataset-summary.json`, `docs/phase2-progress.md`
- Frontend: unchanged. Raw CSV files: retained; no raw data was removed or modified.
- Generated summary: input `32165`, accepted `32164`, rejected `1` (`invalidCoordinates=0`, `invalidSignal=1`), unique identifiers `25291`, published cells `380`, suppressed occupied cells `39`.
- Selection: `longitude-thirds`, minimum published coverage `5`, fallback `false`; candidate 3x3 blocks with coverage at least 5: `381`.
- Presets: each has 3x3 dimensions and 9 geometric cell IDs; union contains `27` IDs and overlap count is `0`. Area A: published `5`, observations `46`, identifiers `46`, median `-79.5` dBm. Area B: published `8`, observations `391`, identifiers `391`, median `-77` dBm. Area C: published `8`, observations `447`, identifiers `394`, median `-69` dBm.
- Determinism: forward and reversed input produced byte-identical serialized data (`366391` bytes each). The two generator runs produced matching hashes:
  - `dataset-summary.json`: `5E4E7A1FCFAC59B46B0B19BF1200DFD2E12519DC440263481C7DCA2BA2D703D9`
  - `grid-cells.json`: `3024F10AFF22216EA3512E9A8C429036D0F1658945D1BA6D2411C08527D78E2D`
  - `preset-areas.json`: `F40151332A5CAF42D5E95609305AE8EB1F5364588CC5293DECF636F048F4F9A8`

### Task 2 checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial.test.cjs` | 0 | 16 tests passed; 0 failed, 0 skipped, 0 todo. |
| generator to `public/data` | 0 | Generated all three aggregate documents. |
| generator to ignored verification output | 0 | Regenerated all three documents. |
| per-file SHA-256 comparison | 0 | All three public and verification hashes matched. |
| reversed-input deterministic serialization check | 0 | Forward/reversed output was byte-identical. |
| invalid CLI cases: missing, unknown, duplicate, same input/output path | 1 each | All rejected as required. |
| `node --test tests/wifi.test.cjs` | 0 | 5 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing Vite warning remains: the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |

Remaining issue: none for Task 2.

## Task 3 - Privacy gates and portable regression tests

- Status: complete
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `4e8a0d9ada6059b1f322b0f5f9cfdb4a3398c4ce`
- Commit message: `test: enforce spatial privacy and portable WiFi regressions`
- Scoped files: `scripts/lib/spatial.cjs`, `tests/spatial.test.cjs`, `tests/wifi.test.cjs`, `package.json`, `docs/phase2-progress.md`
- Frontend: unchanged. Raw CSV files: retained; no raw data was removed or modified.
- Validator gates: preset cell overlap, count partitions, MAC patterns in keys and values, category allowlists, unique-count bounds, negative medians, histogram/radio partitions, and fixed-lattice geometry tolerance (`1e-10`).
- Public JSON: checked-in `public/data` documents validated successfully. The current output has `380` published cells and `39` suppressed cells; selection is `longitude-thirds`, minimum coverage `5`, with `fallbackUsed: false`.
- Portable Wi-Fi regression: the primary dataset path assertion now uses a three-row synthetic CSV fixture, including case-insensitive BSSID deduplication and one null signal, without reading the raw CSV.

### Task 3 checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial.test.cjs` | 0 | 25 tests passed; 0 failed, 0 skipped, 0 todo. Includes synthetic adversarial validator fixtures and checked-in public JSON validation. |
| `node --test tests/wifi.test.cjs` | 0 | 5 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd test` | 0 | 30 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing Vite warning remains: the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| Direct `validatePublicOutputs()` check on all three checked-in JSON documents | 0 | Passed; `380` published cells, `39` suppressed cells, no selection fallback. |

Remaining issue: none for Task 3.

## Task 4 - Types, cached loader, context, and shared presentation helpers

- Status: complete
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `d8d4e9294153942d45845434d467a37666e67c61`
- Commit message: `feat: add aggregate spatial data context`
- Scoped files: `src/type/spatial.ts`, `src/utils/loadSpatialData.ts`, `src/context/spatialContext.ts`, `src/context/SpatialDataContext.tsx`, `src/utils/spatialMetrics.ts`, `src/components/DatasetLimitations.tsx`, `tests/spatial-ui.test.cjs`, `docs/phase2-progress.md`
- Frontend migration: no root provider change, no Grid Map, and no mounted route changes. Raw CSV files: retained; no raw data was removed or modified.
- Loader: requests only the three aggregate JSON URLs, validates runtime schema/geometry/counts/privacy before returning data, caches in-flight and resolved promises, and clears the cache after rejection for retry.
- Context: exposes `SpatialDataState` through `useSpatialData()` with an active effect guard and retry invalidation; no request is aborted during shared cleanup.
- Shared copy: `DatasetLimitations` includes the approved historical survey and suppression disclaimer.

### Task 4 checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial-ui.test.cjs` | 0 | 5 tests passed; 0 failed, 0 skipped, 0 todo. Covers band-share parity, three aggregate URLs, schema/geometry/private-field rejection, retry after HTTP failure, and same-promise deduplication. |
| `npm.cmd test` | 0 | 35 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing Vite warning remains: the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| `git diff --check` | 0 | Passed. |

Remaining issue: none for Task 4.

## Task 5 - Grid map, shared intensity scale, and truthful legend

- Status: implemented; browser verification unavailable in this environment
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `bac00b0f43d1ce1ce1fb305dfd061dbb5260507a`
- Commit message: `feat: add LaoSence grid intelligence map`
- Scoped files: `src/components/map/GridIntelligenceLayer.tsx`, `src/components/map/GridLegend.tsx`, `src/pages/MapPage.tsx`, `src/utils/spatialMetrics.ts`, `tests/spatial-ui.test.cjs`, `docs/phase2-progress.md`
- Map behavior: MapPage uses a temporary `SpatialDataProvider` wrapper while the root provider remains unchanged. The map renders aggregate `GridCell` rectangles, defaults to Wireless Infrastructure Intensity, fits the published-cell bounds once, and keeps selection as a cell ID without refetching or resetting the camera.
- Scale behavior: layer and legend receive the same memoized intensity scale. Quantile boundaries use the specified `Math.ceil(q*n)-1` rule, collapse duplicates, handle empty/all-equal data honestly, and use the fixed five-color palette.
- Loading/error states: aggregate loading, empty published cells, and Retry error states are visible in MapPage. No preset panel, Compare page, root provider migration, or raw CSV removal was started.
- Browser check: the required Playwright script could not run because Python `playwright` is not installed. CUA inventory reported no available browser surface, so browser rendering and interaction are not claimed as verified.
- Raw CSV files: retained; no raw data was removed or modified. No push performed.

### Task 5 checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial-ui.test.cjs` | 0 | 10 tests passed; 0 failed, 0 skipped, 0 todo. Covers metric mapping, empty/all-equal scales, duplicate quantile boundaries, exact threshold assignment, loader behavior, and retry/dedup. |
| `npm.cmd test` | 0 | 40 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing Vite warning remains: the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| `git diff --check` | 0 | Passed. |
| `python .../with_server.py ... task5_browser_check.py` | 1 | Blocked before browser actions: `ModuleNotFoundError: No module named 'playwright'`. CUA fallback had no browser surface. |

Remaining issue: browser rendering/interaction verification must be rerun in an environment with Playwright or an available browser surface.

## Task 5 fix - sparse intensity boundary handling

- Status: complete with sparse-boundary fix; browser verification remains unavailable in this environment
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `932c03296a9da6feda55f1209578e30ecdee8f06`
- Commit message: `fix: handle sparse grid intensity boundaries`
- Scoped files: `src/utils/spatialMetrics.ts`, `tests/spatial-ui.test.cjs`, `docs/phase2-progress.md`
- Regression: added coverage for unique-network counts `[5, 100, 100, 100, 100, 100]`; the new test reproduced the previous `formatValue(undefined)` crash before the implementation change.
- Fix behavior: when all quantile boundaries collapse to the maximum while the minimum differs, the scale returns one defined bin with the observed range label `5–100 within this survey`. Both endpoints resolve to that bin's color, and labels contain no `undefined` or `NaN`.
- Browser check: still not verified because the required Python Playwright package is unavailable and CUA reports no browser surface. Browser rendering and interaction are not claimed as verified.
- Raw CSV files: retained; no raw data was removed or modified. No push performed.

### Task 5 fix checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial-ui.test.cjs` | 0 | 11 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd test` | 0 | 41 tests passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing Vite warning remains: the main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| `git diff --check` | 0 | Passed. |

Remaining issue: browser rendering/interaction verification remains unavailable until an environment provides Playwright or a browser surface.

Next task: **Task 6**. Do not start it in the Task 5 fix turn.

## Task 6 - Cell panel and deterministic preset controls

- Status: complete for Task 6; browser rendering and interactions verified on production preview.
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `47dd6f78768670e54c1084439d51f8b3a34841e1`
- Commit message: `feat: add preset area intelligence`
- Scoped files: `src/components/map/AreaIntelligencePanel.tsx`, `src/components/map/PresetAreaControls.tsx`, `src/components/map/GridIntelligenceLayer.tsx`, `src/pages/MapPage.tsx`, `src/utils/areaPresentation.ts`, `tests/spatial-ui.test.cjs`, `docs/phase2-progress.md`.
- Metrics: clicked cells use their own aggregate record; Area A/B/C use each preset JSON record directly. No cell unique counts are added and no cell medians are averaged. The UI uses Observed network identifiers and Observations, known-band denominators, all-observation advertised-security percentages, explicit unknown-band counts, and factual missing-data labels.
- Selection: one discriminated cell/preset selection ensures mutual clearing. Preset outline uses the complete 3x3 bounds, including unpublished positions; selecting a preset fits those bounds. Selection does not trigger a data fetch.
- Accessibility and layout: stable `grid-map`, `area-intelligence`, and `selected-cell-id` test IDs; named map/sidebar regions; Area A/B/C button names and `aria-pressed`; a scrollable panel beneath the usable map on narrow screens.
- Browser tooling: installed Python Playwright 1.63.0 in the local environment and used installed Chrome with the production preview. The browser script and screenshots are ignored under `artifacts/phase2/` and are not committed.
- Browser evidence: `/map` at 1280x800 and 375x667. Initial map showed 380 SVG grid paths, a truthful intensity legend, and no Leaflet marker icons. Clicking A, B, C showed JSON identifier, observation, median, band, unknown-band, channel, and published-coverage values; one full-block outline remained visible and fit in the viewport. Clicking visible cell `8013_43458` showed its JSON counts/median, removed the preset outline, and cleared all pressed buttons. Aggregate request count remained exactly three during those selections; no page errors. At 375px width, the Leaflet container was 352px tall and the readable panel sat below the map. Screenshots: `artifacts/phase2/task5-grid-map.png`, `task6-desktop.png`, `task6-narrow.png`.
- Task 5 browser follow-up: grid rectangle rendering, initial view, legend, and absence of a marker cloud are now browser-verified. This does not claim the later Phase 2 four-route, failure-state, privacy/network, or performance acceptance checks from Task 10.
- Raw CSV files retained; root provider unchanged; no ComparePage, push, or Task 7 work.

### Task 6 checks

| Command | Exit | Result |
|---|---:|---|
| `npm.cmd test` | 0 | 42 passed; 0 failed, 0 skipped, 0 todo. The new test checks JSON preset values, demonstrates Area C cannot be computed from published cell unique-count sums or median averages, and covers null median, unknown band, empty channels, and zero percentages. |
| `npm.cmd run build` | 0 | Passed. Existing warning remains: main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| Production preview browser check | 0 | Chrome/Playwright assertions passed for desktop and narrow viewport; three aggregate requests and zero page errors. |
| `git diff --check` | 0 | Passed. |

Remaining issue: the Compare link points to `/compare`, which is scheduled for Task 7/8 and is not a mounted route yet. Task 10 still owns full error-state and four-route browser acceptance.

Next task: **Task 7**. Do not start it in the Task 6 turn.

## Task 7 - Factual comparison page

- Status: complete for Task 7; page is intentionally not connected to a route until Task 8.
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `fb4ac30d3b14b5d217cf9e05a4573d4a79c993c1`
- Commit message: `feat: add factual area comparison`
- Scoped files: `src/pages/ComparePage.tsx`, `src/utils/spatialMetrics.ts`, `src/components/map/AreaIntelligencePanel.tsx`, `tests/spatial-ui.test.cjs`, `docs/phase2-progress.md`.
- Logic: `interpretAreas(a,b)` consumes preset aggregates only, in identifier / 5 GHz / advertised Open / median order, returns at most three factual statements, and uses the plan's 10%, 5 percentage-point, and 5 dB thresholds. A zero-versus-positive identifier count is described without a percent. Unknown band and zero-observation denominators produce no share comparison; null or non-finite medians produce no signal comparison. Equal/below-threshold values produce the plan's similarity sentence.
- Page: defaults to Area A vs Area B; native labeled selectors disable the other side's option and handlers guard against identical IDs. Both sides reuse `AreaIntelligencePanel` and its preset formatting, without its Compare link. Selector changes update local state and do not fetch. The required site-screening product copy, exact supplementary-indicator limitation, and `DatasetLimitations` are present. No winner, best-location recommendation, or business score is shown.
- Browser evidence: mounted `ComparePage` in an ignored, temporary Vite test harness without editing routes. Chrome/Playwright showed A/B defaults, changes to C/B and C/A, disabled duplicate choices, two metric panels, no page errors, and exactly three aggregate requests before and after selector changes. Desktop and 375px screenshots are ignored at `artifacts/phase2/task7-compare-isolated.png` and `task7-compare-narrow.png`. This is isolated component verification, not a production `/compare` route check.
- Root provider and NavBar remain unchanged; `/compare` route is not mounted. Raw CSV retained. No push or Task 8 work.

### Task 7 checks

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/spatial-ui.test.cjs` | 0 | 17 passed; 0 failed, 0 skipped, 0 todo. New regressions cover thresholds below/at boundaries, floating-point share tolerance, null/zero denominators, equal metrics, statement priority/cap, A/B defaults, and duplicate-option disabled state. |
| `npm.cmd test` | 0 | 47 passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed. Existing warning remains: main JS chunk is larger than 500 kB after minification. |
| `npm.cmd run lint` | 0 | Passed with no lint output. |
| Isolated Vite browser check | 0 | A/B to C/B to C/A selection passed; three aggregate requests throughout; zero page errors; desktop and 375px inspected. |
| `git diff --check` | 0 | Passed. |

Remaining issue: Task 8 must mount `/compare`, link NavBar, and replace the root provider before production-route verification. Task 10 still owns full four-route and failure-state browser acceptance.

Next task: **Task 8**. Do not start it in the Task 7 turn.

## Task 8 - Aggregate data across competition routes

- Status: complete for Task 8; production routes and interactions verified in Chrome against the built preview.
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `84b00566a08e5643107b1d50d28291e2f814b214`
- Commit message: `refactor: use aggregate data throughout competition routes`
- Scope: `src/main.tsx`, `src/components/NavBar.tsx`, `src/pages/{MapPage,AnalysisPage}.tsx`, mounted admin pages, analysis chart components/adapters, `src/utils/spatialMetrics.ts`, `tests/spatial-ui.test.cjs`, and this checkpoint.
- Root routing: `SpatialDataProvider` now wraps the app; MapPage no longer creates a temporary provider. `/compare` mounts ComparePage and NavBar links to it. The mounted admin analysis/map screens reuse aggregate pages, while upload retains its controls and links to the aggregate map instead of mounting the raw preview.
- Analytics: totals, source period, accepted/rejected context, and chart series come from `dataset-summary.json`. Charts accept aggregate count-series props; no synthetic `WiFiData` rows are created. Observation-based count labels and tooltips say Observations. Added regression coverage for summary-to-chart partitions, unknown band, signal histogram, and top-15 channel ordering.
- Navigation fix: disabling Leaflet zoom animation prevents a delayed zoom-transition callback from throwing after Map unmounts during navigation to Analysis.
- Production preview: request and page-error listeners were attached before each direct load of `/`, `/map`, `/analysis`, and `/compare`. Each loaded exactly `/data/grid-cells.json`, `/data/preset-areas.json`, and `/data/dataset-summary.json`; none requested `/CSV_FILE/`, `.csv`, or the raw wireless file. No page-breaking errors occurred. On `/`, the browser reported a nonbreaking `favicon.ico` 404.
- Navigation and interactions: `/` to `/map` to `/analysis` to `/compare` added no wireless-data requests. Compare defaulted to A/B; changing to C/B and C/A blocked duplicate choices and added no request. Returning to Map and selecting preset C then cell `8013_43458` added no request. Map displayed 380 SVG grid paths without marker icons. Analytics showed 32,164 Observations and 25,291 Observed network identifiers, matching the summary JSON; its six chart titles and source/accepted context rendered.
- Browser artifacts: ignored `artifacts/phase2/task8_browser_check.py` and route screenshots remain local and are not part of the commit.
- Seven tracked raw CSV paths remain untouched. No push performed. Task 9 has not been started. Task 10 still owns the full failure-state and performance acceptance checks.

### Task 8 checks

| Command | Exit | Result |
|---|---:|---|
| `npm.cmd test` | 0 | 49 passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed; existing Vite warning remains for a main JS chunk larger than 500 kB. |
| `npm.cmd run lint` | 0 | Passed. |
| Production preview browser check | 0 | Four direct routes, client navigation, selectors, map selections, request capture, and zero page errors passed. |
| `git diff --check` | 0 | Passed. |

Next task: **Task 9**. Do not start it in the Task 8 turn.

## Task 9 - Remove raw wireless files from the current tree

- Status: complete for Task 9; current source and production build no longer contain raw wireless CSV. Historical Git exposure remains.
- Branch: `laosence-phase2-spatial-intelligence`
- Base SHA: `8c0b21d90fa2c6cf67f37bdb24e0106498e0349b`
- Commit message: `chore: remove raw wireless datasets from current tree`
- Scoped changes: `git rm` of exactly the five files under `public/CSV_FILE/` and two under `src/assets/CSV_FILE/` listed in the Task 9 plan; new `docs/demo-data.md`; this checkpoint. Game JSON and other assets were retained.
- Removal gate: verified repository root and the exact seven tracked paths. The ignored private Chanthabuly input exists and its SHA-256 equals the then-tracked public original: `CFB0F722820DF7D3B7CA074ADA198C6D5D693782DFABABB91D4298941FAC3E36`. `git check-ignore -v` identifies `/private-data/` in `.gitignore`. The private copy was not deleted or staged.
- Aggregate gate: `validatePublicOutputs()` passed on all three checked-in JSON documents before removal: 380 published cells, three presets, 32,164 accepted Observations. No aggregate JSON was changed.
- Inventory: after removal, recursive `public/` and `src/assets/` inspection found no remaining `.csv` or matching raw wireless filename. The remaining public JSON comprises the three validated aggregates and the unrelated game `question.json`/`result.json`; game files were preserved. Rebuilt `dist/` has no `CSV_FILE` directory, CSV files, or matching raw filenames.
- Regeneration guide: `docs/demo-data.md` documents authorized ignored input, exact CLI/test/build commands, accepted-signal rejection, 250 m lattice approximation, coverage-biased preset selection, canonical categories, suppression and residual differencing risks, historical Git exposure, and historical/non-citywide/non-business limitations.
- Production preview after deletion: Chrome direct loads of `/`, `/map`, `/analysis`, `/compare` and client navigation/Compare and Map selection checks passed. Request listeners were installed before navigation. Each direct load requested only the three aggregate wireless JSON URLs; no raw CSV request or page error occurred. Navigation and selections added no wireless-data request. One home-load console captured a nonbreaking `favicon.ico` 404 and transient OpenStreetMap tile `ERR_NETWORK_CHANGED` errors.
- All seven old raw URLs were probed against production preview. Each returned HTTP 200 with `text/html` SPA fallback, **not CSV data**. A 200 status alone would therefore be misleading; the response body was HTML.
- Browser scripts and screenshots remain ignored under `artifacts/phase2/`. No private copy deletion, history rewrite, push, or Task 10 work was done.

### Task 9 checks

| Command | Exit | Result |
|---|---:|---|
| `npm.cmd test` | 0 | 49 passed; 0 failed, 0 skipped, 0 todo. |
| `npm.cmd run build` | 0 | Passed; existing main-JS chunk warning above 500 kB remains. |
| `npm.cmd run lint` | 0 | Passed. |
| Recursive source/build raw-file inventory | 0 | No raw wireless CSV remains in `public/`, `src/assets/`, or rebuilt `dist/`. |
| Production preview browser checks | 0 | Four direct routes, client navigation/selections, no raw requests or page errors; all seven old raw URLs returned SPA HTML rather than CSV. |
| `git diff --check` | 0 | Passed. |

Next task: **Task 10**. Do not start it in the Task 9 turn.
