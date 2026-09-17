# LaoSence Phase 2 Spatial Intelligence Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to execute this approved plan task by task. Use `superpowers:test-driven-development` for aggregation and comparison logic, `superpowers:systematic-debugging` for unexpected failures, and `superpowers:verification-before-completion` before completion claims. Checkboxes track work, not permission requests. Sequential execution is recommended for a smaller model.

**Goal:** Replace the competition's raw wireless frontend with deterministic, privacy-reduced 250 m grid data, preset area intelligence, and factual area comparison.

**Architecture:** Private CSV → offline Node preprocessing → three public aggregate JSON files → shared spatial context → Map, Analytics, Compare. Identifiers exist only inside offline preprocessing. React/Vite, Leaflet, and Recharts remain in place.

**Tech Stack:** Existing React 19, TypeScript 5.8, Vite 7, React Leaflet 5, Leaflet 1.9, Recharts 2, PapaParse 5, Node built-in test runner; Windows PowerShell commands below.

**Spec:** The approved Phase 2 requirements are captured in the contracts, tasks, acceptance matrix, and final-report checklist in this file. This document is self-contained; the original conversation is not required for execution.

**Planning status:** This is an implementation handoff, not a claim that Phase 2 exists. Planning inspected the local repository on 2026-09-17 and confirmed HEAD `73cfb1c285eb7c0983a7295ad77c4093cfeb9259`, branch `laosence-phase1-stabilize`. No baseline install/build/test results were freshly established by writing this plan. Task 0 must establish them.

## 1. Global constraints

- Repository: `Anou01/LaoSence`. Start from commit `73cfb1c285eb7c0983a7295ad77c4093cfeb9259`; implement on `laosence-phase2-spatial-intelligence`, never `main`.
- This architecture is approved. Do not restart product brainstorming or request approval for each reversible implementation step.
- Use only Chanthabuly as input. Do not merge `ZONE A2.csv` or the other surveys.
- One accepted CSV row is one **Observation**, not one router, physical access point, or unique network.
- Public data must have no SSID, BSSID, MAC hashes, MAC-like identifiers, individual observation coordinates/timestamps, raw rows, or per-device manufacturer information.
- A UI phrase explaining “Unique BSSID-derived identifiers counted during preprocessing” is allowed; actual identifiers and JSON identifier fields are not.
- Sparse-cell suppression is a privacy-reduction heuristic, not an anonymity guarantee. Historical public Git commits remain a known limitation.
- Do not add H3, AI/ML, Kriging, clustering algorithms, business scores, recommendations, hardware integration, live ingestion, databases, new backend architecture, or authentication rewrites.
- Never interpret these indicators as measured population, customers, footfall, sales, purchasing power, property value, bandwidth, speed, or congestion.
- Keep game JSON and unrelated game/admin functionality. Never rewrite Git history, change repository visibility, or push/deploy without an instruction to do so.
- No new production dependency is needed. Keep the lockfile stable unless a demonstrated compatibility problem requires a narrowly documented change. Do not use `--force` or `--legacy-peer-deps` to hide install failures.
- Preserve existing `AGENTS.md`. Its statement about no tests is stale: `tests/wifi.test.cjs` contains five tests at this baseline.
- Commit scoped files; never use `git add .` while private data exists locally.

## 2. How to give this plan to a smaller model

สำหรับผู้สั่งงาน: ส่งไฟล์นี้ให้โมเดล แล้วใช้ prompt ด้านล่าง ให้ทำทีละ Task และส่งผลตรวจจริงกลับมาก่อนสั่งต่อ ไม่ต้องให้โมเดลออกแบบระบบใหม่ ส่วนคำสั่งและสัญญาข้อมูลเขียนเป็นภาษาอังกฤษเพื่อให้ใช้ชื่อไฟล์/ฟังก์ชันตรงกันตลอดงาน

Read sections 1–5 once, then execute one numbered task per turn. Each task has a bounded file scope, explicit interface, checks, and a completion gate. Do not rewrite finished tasks because a later task suggests a stylistic preference.

Copy this prompt into the implementing model:

```text
Execute docs/superpowers/plans/2026-09-17-laosence-phase2-spatial-intelligence.md.
This is an approved Phase 2 specification. Use executing-plans if available.
Read AGENTS.md and the global/data contracts, then implement Task 0 only.
Do not start later tasks in this turn. Run the listed checks and report actual results.
Record a checkpoint with branch, SHA, changed files, commands, results, and next task.
Never invent passing tests, counts, screenshots, or browser verification.
Do not change scope, delete raw data early, push, deploy, or start Phase 3.
```

For subsequent turns:

```text
Continue the same Phase 2 plan. Read the latest checkpoint and git status.
Execute the next unfinished numbered task only, including its tests and commit gate.
Keep existing interfaces from section 5. Do not repeat completed implementation.
Finish with evidence and the next task number; stop if a required dependency is blocked.
```

Use `docs/phase2-progress.md` for concise checkpoints, without raw data. Each entry records task, status, branch/SHA, scoped files, command exit codes, exact test counts, remaining issue, next task. Keep detailed logs/screenshots under `artifacts/phase2/`. Do not commit private paths, usernames, raw rows, or screenshots of raw data. A task boundary is a resume point, not a new permission request. If instructed to finish all tasks, continue sequentially through Task 12.

## 3. Repository facts and migration traps

| Current file | Existing behavior | Phase 2 action |
|---|---|---|
| `src/main.tsx` | Global `WiFiDataProvider`; public and admin routes | Replace provider after all mounted consumers are migrated; add Compare |
| `src/App.tsx` | Home displays MapPage | Retain home-to-map flow |
| `src/context/WiFiDataContext.tsx` | Fetches raw primary CSV on mount | Remove from mounted application tree |
| `src/constants/dataset.ts` | Raw Chanthabuly path | May remain only in unmounted legacy code/tests |
| `src/utils/csvParser.ts` | Lowercase measurements, negative signal or null | Preserve Phase 1 API/tests; implement offline normalization with parity tests |
| `src/type/wifi.ts` | Individual observation type | Do not overload with aggregates |
| `src/components/MapComponent.tsx` | Raw search/filter and marker rendering | Remove from competition and mounted admin dependency paths |
| `src/components/map/WiFiMarkers.tsx` | Individual marker/cluster implementation | Leave unmounted; no optimization work |
| `src/pages/MapPage.tsx` | Raw row filters and counts | Replace with grid/preset/panel composition |
| `src/pages/AnalysisPage.tsx` | Reads `useWiFiData` | Read dataset summary |
| `src/components/analysis/AllChartContainer.tsx` | Composes six raw-data charts | Supply summary-derived chart props |
| `src/components/NavBar.tsx` | Map and Analytics | Add Compare |
| `src/pages/admin/AdminMapPage.tsx` | Mounts old MapComponent | Reuse aggregate MapPage |
| `src/pages/admin/AdminUploadPage.tsx` | Also mounts old MapComponent | Remove raw-map preview, retain unrelated upload processing |
| `src/pages/admin/AdminAnalysisPage.tsx` | Mounts AllChartContainer | Reuse aggregate AnalysisPage |
| `tests/wifi.test.cjs` | Fifth test reads tracked Chanthabuly CSV | Replace only that fixture dependency before raw removal |
| `server.js` | Legacy game API | No Phase 2 change |

The chart filename is **`EncryptionTypeChar.tsx`**, not `EncryptionTypeChart.tsx`. The duplicate implementation in AuthenticationChart has already been removed. Do not recreate it.

Read-only planning probe, using valid coordinates and finite negative lowercase signal:

| Measurement | Planning reference, not a hardcoded output |
|---|---:|
| Input observations | 32,165 |
| Accepted observations | 32,164 |
| Rejected unusable signal | 1 |
| Distinct accepted identifiers | 25,291 |
| Published cells, threshold ≥5 | 380 |
| Suppressed occupied cells | 39 |
| Candidate 3×3 blocks containing ≥5 published cells | 381 |

These numbers explain the one-row change from Phase 1. The executor must regenerate and verify them. Do not preserve 32,165 as the accepted total by fabricating a signal or ignoring rejection rules.

## 4. File boundaries and task dependencies

```text
Task 0 baseline/private copy
  → Task 1 normalization + aggregation
  → Task 2 deterministic preset selection + CLI + generated JSON
  → Task 3 privacy tests + portable Phase 1 tests
  → Task 4 spatial types/context
  → Task 5 grid map
  → Task 6 panel + presets
  → Task 7 comparison
  → Task 8 summary charts + root migration
  → Task 9 raw-file removal + regeneration docs
  → Task 10 browser/performance verification
  → Task 11 fresh final checks
  → Task 12 final report and stop
```

New files and responsibilities:

- `scripts/lib/spatial.cjs`: pure normalization, grid geometry, aggregation, deterministic presets, public projection. No filesystem writes or browser imports.
- `scripts/generate-demo-data.cjs`: explicit CLI arguments, PapaParse, generation, validation, three JSON writes. Runs only under `require.main === module`.
- `tests/spatial.test.cjs`: synthetic aggregation, geometry, determinism, privacy, and checked-in output tests.
- `tests/spatial-ui.test.cjs`: pure frontend presentation/interpretation tests through TypeScript transpilation.
- `src/type/spatial.ts`: public aggregate contracts below.
- `src/utils/spatialMetrics.ts`: band shares, display thresholds, factual comparison, chart adapters. Runtime imports must be unnecessary; use type-only imports to simplify Node tests.
- `src/context/spatialContext.ts`: context object and `useSpatialData` hook.
- `src/context/SpatialDataContext.tsx`: provider component only; avoid React Refresh mixed-export warnings.
- `src/utils/loadSpatialData.ts`: validated, cached three-file loader with retry invalidation.
- `src/components/map/GridIntelligenceLayer.tsx`: rectangles and selection callbacks.
- `src/components/map/GridLegend.tsx`: truthful threshold labels and no-data color.
- `src/components/map/AreaIntelligencePanel.tsx`: one aggregate renderer for a cell/preset.
- `src/components/map/PresetAreaControls.tsx`: three accessible buttons.
- `src/pages/ComparePage.tsx`: selectors, side-by-side metrics, interpretation.
- `src/components/DatasetLimitations.tsx`: reusable approved copy.
- `docs/demo-data.md`: local regeneration and privacy limitations.

Do not add additional architectural layers unless a concrete build/runtime problem requires one. Existing six chart files are adapted, not replaced by another dashboard framework.

## 5. Frozen data and function contracts

### 5.1 Normalization and counting

The offline `normalizeRawRow(row)` returns `{ observation, rejection }`. Exactly one is non-null. Rejection is `invalidCoordinates` or `invalidSignal`; check coordinates first so rejection totals do not double-count a row.

Internal observation shape, never serialize directly:

```js
// Internal only; no SSID/manufacturer/timestamp is needed.
// bssid is trimmed lowercase, or '' when missing.
// channel is a positive integer or null; frequency is MHz or null.
// signal is finite and strictly negative; preserve actual values.
// authentication/encryption/radioType are sanitized category labels.
({ bssid, latitude, longitude, signal, frequency, channel,
   authentication, encryption, radioType })
```

- Numeric parser: trim strings; blank/null/undefined → null; `Number(value)` must be finite. Never let `Number('')` become zero.
- Coordinates: use lowercase `latitude` and `longitude`; reject out-of-range, nonnumeric, and `(0,0)`. Do not use uppercase zero-filled columns.
- Signal: lowercase `signal` only; reject null/nonfinite/zero/positive values. No arbitrary negative cutoff or invented RSSI. Phase 1 may keep null signal; offline Phase 2 deliberately rejects it.
- Frequency: usable lowercase `frequency` first, then usable uppercase `FREQUENCY` only if lowercase is absent/unusable. Never infer frequency from channel.
- BSSID: `String(row.BSSID ?? row.bssid ?? '').trim().toLowerCase()`. Missing identifiers contribute observations but not distinct count. Do not generate replacement identifiers.
- Text aliases: `RADIO TYPE`, `RADIO_TYPE`, `radioType`; trim all strings.
- Band: `2400 <= MHz < 2500` → `2.4GHz`; `4900 <= MHz < 5925` → `5GHz`; otherwise `otherUnknown`. No invented 6 GHz bin.
- Authentication: case-insensitive trim and normalize hyphen/space aliases to WPA2 Personal, WPA2 Enterprise, WPA Personal, WPA Enterprise, WPA3 Personal, WPA3 Enterprise, OWE, Open; all other input → Other / Unknown. OWE remains OWE. Do not publish arbitrary CSV strings.
- Encryption allowlist: CCMP, TKIP, AES, WEP, GCMP, TKIP+CCMP, None, Other / Unknown. Normalize case/separators; `CCMP+TKIP` maps to `TKIP+CCMP`; unknown/blank → Other / Unknown. Never infer None from blank.
- Radio allowlist: 802.11a/b/g/n/ac/ax/be as individual labels; unrecognized or combined unsupported values → Other / Unknown. Document this coarse classification; do not invent 802.11n records.
- Counts use accepted observations. Dataset unique count uses a Set of all nonempty normalized identifiers. Cell unique counts use independent per-cell sets. Presets use independent area-wide sets.
- `median([]) → null`; sort numbers ascending, return middle value or mean of two middle values. Do not round before aggregation.
- Signal histogram bins: `< -100 dBm`, `[-100,-90)`, `[-90,-80)`, `[-80,-70)`, `[-70,-60)`, `[-60,-50)`, `[-50,-40)`, `[-40,-30)`, `[-30,-20)`, `[-20,-10)`, `[-10,0)`. Labels must clearly state dBm. Every accepted signal belongs to exactly one bin.
- `topChannels` includes all recorded positive-integer channels, ordered observations descending, channel ascending on ties. UI may show top 15 with “Most observed channels (top 15)”. Keep full counts in summary.

### 5.2 Grid geometry and pure API

Export from `scripts/lib/spatial.cjs`:

```js
const GRID_SIZE_METERS = 250;
const MIN_UNIQUE_NETWORKS_PER_CELL = 5;
const REFERENCE_LATITUDE = 18;
const LAT_STEP = 250 / 111320;
const LNG_STEP = 250 / (111320 * Math.cos(18 * Math.PI / 180));
// gridAddress(latitude, longitude) -> { row, col, cellId }
// cellGeometry(row, col) -> { bounds, center }
// normalizeRawRow(row) -> { observation, rejection }
// aggregateObservations(observations) -> AggregateMetrics
// knownBandShares(bandCounts) -> { twoPointFour: number|null, five: number|null }
// buildSpatialData(rawRows) -> { grid, presets, summary }
// selectPresetBlocks(publishedCells) -> { blocks, selection }
// validatePublicOutputs({ grid, presets, summary }) -> void, throws on violation
```

Core geometry implementation:

```js
function gridAddress(latitude, longitude) {
  const row = Math.floor(latitude / LAT_STEP);
  const col = Math.floor(longitude / LNG_STEP);
  return { row, col, cellId: `${row}_${col}` };
}
function cellGeometry(row, col) {
  return {
    bounds: { south: row * LAT_STEP, west: col * LNG_STEP,
      north: (row + 1) * LAT_STEP, east: (col + 1) * LNG_STEP },
    center: { lat: (row + 0.5) * LAT_STEP, lng: (col + 0.5) * LNG_STEP },
  };
}
function knownBandShares(bands) {
  const denominator = bands['2.4GHz'] + bands['5GHz'];
  return denominator === 0
    ? { twoPointFour: null, five: null }
    : { twoPointFour: bands['2.4GHz'] / denominator,
        five: bands['5GHz'] / denominator };
}
```

Only occupied cells with `uniqueNetworkCount >= 5` appear in `grid.cells`. Suppressed count means occupied accepted-observation cells below threshold, not empty cells across the bounding rectangle. Geometry uses lattice arithmetic even when it has many decimal digits; it never uses average observation positions.

### 5.3 Deterministic preset selection

Implementation choices resolving “sufficient coverage” in the approved spec:

1. Work in integer row/column space. Get published-cell min/max extents; full bounding rectangle ends at max+1.
2. Third centers have column positions `minCol + width * (1/6, 1/2, 5/6)` and shared row position `minRow + height/2`.
3. Enumerate candidate lower-left anchors from every published cell minus offsets `(0..2,0..2)`; deduplicate anchors. This considers every 3×3 block containing at least one published cell without scanning an enormous empty rectangle.
4. Count published coverage in each candidate using exactly nine Set lookups. Primary sufficient coverage is **at least 5 of 9 published cells**. This criterion concerns survey coverage, not business metrics.
5. Assign candidates to longitude thirds by block center `(col+1.5)`, using half-open thirds and a closed last third. Rank each third by squared distance to its target center, then numeric row, then numeric column. No network count, RSSI, security, or business-looking metric is a tie-breaker.
6. Select A west, B center, C east while requiring nonoverlap. Before committing a choice, look ahead for a remaining compatible B/C candidate so a greedy dead end does not cause unnecessary fallback. Three lists permit a simple bounded nested search, stopping at the first complete valid triple in ranked order.
7. Blocks overlap iff both `abs(rowA-rowB) < 3` and `abs(colA-colB) < 3`. Shared edges are permitted.
8. If no triple exists, retry per-third coverage thresholds 4, 3, 2, 1 in that order. If still impossible, use all candidates for each target center, keeping coverage ≥1, deterministic ranking, and nonoverlap. Report this global spatial fallback explicitly.
9. If no three distinct disjoint blocks exist even then, fail generation with an actionable error. Do not manufacture presets or pick locations manually.
10. Record the chosen method, minimum published coverage, whether fallback was used, and a plain-text reason in preset metadata; log it to the developer. Never silently fallback.

Each preset has exactly nine **geometric** cell IDs, including empty/suppressed positions if present; these reveal only its allowed coarse block. Do not publish any suppressed per-cell metrics. Aggregate all accepted raw observations in those nine cells, including suppressed occupied cells, into a whole-preset Set and raw signal list. Preset metrics cannot be derived correctly from published-cell totals alone. Dataset/preset totals may include suppressed observations; document this and residual differencing risks without claiming full anonymity.

### 5.4 Public TypeScript schema

Use this contract in `src/type/spatial.ts` and match JSON exactly:

```ts
export interface Bounds { south: number; west: number; north: number; east: number }
export interface BandCounts { '2.4GHz': number; '5GHz': number; otherUnknown: number }
export interface ChannelCount { channel: number; observations: number }
export interface HistogramBin { label: string; observations: number }
export interface AggregateMetrics {
  observationCount: number;
  uniqueNetworkCount: number;
  medianSignalDbm: number | null;
  bandCounts: BandCounts;
  authenticationCounts: Record<string, number>;
  encryptionCounts: Record<string, number>;
  topChannels: ChannelCount[];
}
export interface GridCell extends AggregateMetrics {
  cellId: string; row: number; col: number;
  bounds: Bounds; center: { lat: number; lng: number };
}
export interface PresetArea extends AggregateMetrics {
  id: 'area-a' | 'area-b' | 'area-c';
  name: 'Area A' | 'Area B' | 'Area C';
  dimensions: { rows: 3; cols: 3 };
  areaKm2Approx: number; // 0.5625; UI formats 0.56
  cellIds: string[]; // exactly nine deterministic lattice IDs
  bounds: Bounds;
  publishedCellCount: number;
}
export interface DatasetSummary extends AggregateMetrics {
  schemaVersion: 1;
  sourceLabel: string;
  historicalSurveyPeriod: string;
  inputObservationCount: number;
  rejectedObservationCount: number;
  rejectionCounts: { invalidCoordinates: number; invalidSignal: number };
  publishedCellCount: number;
  suppressedCellCount: number;
  signalHistogram: HistogramBin[];
  radioTypeCounts: Record<string, number>;
}
export interface GridDocument {
  metadata: { schemaVersion: 1; gridSizeMeters: 250;
    minimumUniqueNetworksPerCell: 5; referenceLatitude: 18;
    metricDefinition: string };
  cells: GridCell[];
}
export interface PresetDocument {
  metadata: { schemaVersion: 1; selection: {
    method: 'longitude-thirds' | 'global-spatial-fallback';
    minimumPublishedCells: number; fallbackUsed: boolean; reason: string;
  } };
  areas: PresetArea[];
}
export type SpatialMetric = 'infrastructure' | 'fiveGhzShare' | 'medianSignal';
export interface SpatialData {
  gridCells: GridCell[]; presetAreas: PresetArea[]; datasetSummary: DatasetSummary;
}
export interface SpatialDataState {
  gridCells: GridCell[]; presetAreas: PresetArea[];
  datasetSummary: DatasetSummary | null;
  loading: boolean; error: string | null; retry: () => void;
}
```

Public files: `grid-cells.json` is GridDocument, `preset-areas.json` is PresetDocument, `dataset-summary.json` is DatasetSummary. Source label: `Chanthabuly historical survey dataset`. Period: `Approximately November 2024 – March 2025`. This is approved descriptive metadata, not fabricated per-device timestamps.

Serialize explicit allowlisted objects, never `{ ...rawRow }` or internal Sets. Sort cells by numeric row/col; presets A/B/C; category keys alphabetically; channels by count descending then numeric channel. Do not include generation time, random IDs, absolute input paths, or raw data in errors. Same input/config must give byte-identical JSON with a final newline.

## Task 0 — Confirm baseline and protect local input

**Files:** Read `AGENTS.md`, package/lock/config, files in section 3; create `docs/phase2-progress.md`; append ignore entries to `.gitignore`; create ignored local input copy.

**Interface:** Produces correct isolated branch, fresh baseline evidence, and readable ignored primary input. No application behavior changes.

- [ ] Run each command and record output/exit code; stop if HEAD differs or unrelated edits would be overwritten. An untracked copy of this plan is expected and can be carried onto the new branch.

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git remote -v
git switch -c laosence-phase2-spatial-intelligence 73cfb1c285eb7c0983a7295ad77c4093cfeb9259
npm.cmd ci
npm.cmd run build
npm.cmd run lint
node --test tests/wifi.test.cjs
```

- [ ] Check `$LASTEXITCODE` immediately after each native command. Do not infer earlier success from the final command. Record dependency advisories and bundle warnings separately from failures. Diagnose baseline failure before continuing; do not reset user changes or blindly upgrade packages.
- [ ] Append these exact ignore entries before creating private files:

```gitignore
/private-data/
/public/CSV_FILE/
/src/assets/CSV_FILE/
/artifacts/phase2/
```

- [ ] Make a local copy, never overwrite an existing private input without checking its hash:

```powershell
New-Item -ItemType Directory -Force -Path private-data
$surveySource = 'public/CSV_FILE/Chanthabuly merge all zone.csv'
$surveyPrivate = 'private-data/Chanthabuly merge all zone.csv'
if (-not (Test-Path -LiteralPath $surveyPrivate)) {
  Copy-Item -LiteralPath $surveySource -Destination $surveyPrivate
}
Get-FileHash -LiteralPath $surveySource, $surveyPrivate -Algorithm SHA256
git check-ignore -- "private-data/Chanthabuly merge all zone.csv"
```

Require identical SHA256 values and an ignored private path. Do not print CSV contents. Ignore entries do not untrack the original files; removal is intentionally delayed until Task 9.

- [ ] Checkpoint baseline and stage only `.gitignore`, this plan, and progress document. Commit `chore: prepare isolated Phase 2 workflow`. No raw files removed yet.

## Task 1 — Pure offline normalization and aggregation

**Files:** Create `scripts/lib/spatial.cjs`, `tests/spatial.test.cjs`.

**Interface:** Consumes PapaParse-style records. Produces `normalizeRawRow`, `gridAddress`, `cellGeometry`, `aggregateObservations`, `knownBandShares` from section 5.

- [ ] Start tests with Node `test`/`assert`, import the new module, and use synthetic addresses only. A fixture helper makes measurements at cell centers without actual survey coordinates:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const spatial = require('../scripts/lib/spatial.cjs');
function fixture(row, col, id, signal = -60, frequency = 2412) {
  const { center } = spatial.cellGeometry(row, col);
  return { BSSID: id, latitude: String(center.lat), longitude: String(center.lng),
    signal: String(signal), frequency: String(frequency), CHANNEL: '1',
    AUTHENTICATION: 'WPA2-Personal', ENCRYPTION: 'CCMP', RADIO_TYPE: '802.11n' };
}
test('address is stable and uses independent lattice origin', () => {
  const { center } = spatial.cellGeometry(8000, 43000);
  assert.deepEqual(spatial.gridAddress(center.lat, center.lng),
    { row: 8000, col: 43000, cellId: '8000_43000' });
});
test('unknown frequencies are excluded from known-band denominator', () => {
  assert.deepEqual(spatial.knownBandShares({ '2.4GHz': 2, '5GHz': 6, otherUnknown: 92 }),
    { twoPointFour: 0.25, five: 0.75 });
  assert.deepEqual(spatial.knownBandShares({ '2.4GHz': 0, '5GHz': 0, otherUnknown: 3 }),
    { twoPointFour: null, five: null });
});
```

- [ ] Run `node --test tests/spatial.test.cjs` and confirm new tests fail because implementation is absent, not because fixtures are malformed.
- [ ] Implement section 5 normalization and geometry. Add table-driven tests rejecting blank/nonnumeric/out-of-range coordinates, zero/zero, blank/zero/positive/nonfinite signal; verify uppercase SIGNAL never replaces lowercase RSSI, lowercase frequency wins, OWE survives, and schema aliases work.
- [ ] Implement aggregation in one pass: observation count, Set of nonempty identifiers, signal array, numeric/categorical counters; median sort after accumulation. For empty input return zero counts and null median.
- [ ] Verify trimmed mixed-case duplicates count once. Test signals `[-90,-80,-50,-40]` median `-65`, unknown channel omitted, and sorted tied channel counts.
- [ ] Run new spatial tests, existing five WiFi tests, build, lint. Commit `feat: add deterministic wireless aggregation primitives` after checks pass.

## Task 2 — Preset selection, generator, and aggregate outputs

**Files:** Extend `scripts/lib/spatial.cjs`, `tests/spatial.test.cjs`; create `scripts/generate-demo-data.cjs`; generate three files in `public/data/`.

**Interface:** `buildSpatialData(rawRows)` returns `{ grid: GridDocument, presets: PresetDocument, summary: DatasetSummary }`. CLI maps these to the three filenames. Uses section 5 selection exactly.

- [ ] Add failing tests for suppression threshold and preset-wide deduplication/median. Construct three separated 3×3 groups, e.g. anchors `(8000,43000)`, `(8000,43010)`, `(8000,43020)`, each cell containing five synthetic unique identifiers. Reuse one identifier across two cells; whole-preset distinct count must be smaller than summed cell uniques.
- [ ] Include this unbalanced-median fixture, independent of preset selection, to reject averaging medians:

```js
test('whole-area median uses observations rather than cell medians', () => {
  const raw = [fixture(8000, 43000, 'left', -90),
    ...Array.from({ length: 9 }, (_, i) => fixture(8000, 43001, `right-${i}`, -40))];
  const observations = raw.map(row => spatial.normalizeRawRow(row).observation);
  assert.equal(spatial.aggregateObservations(observations).medianSignalDbm, -40);
  // An incorrect mean of cell medians would be -65.
});
```

- [ ] Implement accepted-row grouping once into `Map<cellId, observation[]>`; use this for cells and the three whole-preset aggregates. Dataset aggregate operates on all accepted observations, never cell aggregate sums.
- [ ] Implement selection and fallback metadata. Test equal sizes, exactly nine IDs, nonoverlap, deterministic tie-breaks, documented fallback on narrow coverage, and explicit failure with insufficient coverage.
- [ ] Implement CLI parsing with required `--input` and `--out`; unknown/duplicate/missing arguments fail nonzero. Resolve input, require a regular file, and refuse an output path equal to the input path. Do not auto-discover/merge other CSVs.
- [ ] Parse with PapaParse: `header:true`, `skipEmptyLines:'greedy'`, `transformHeader: h => h.trim().replace(/^\uFEFF/, '')`; preserve original string values for explicit numeric normalization. Any structural parse error fails before output writes. Error messages give row number/category, not row contents.
- [ ] Implement the initial `validatePublicOutputs` now: enforce section 5.4 allowed keys, finite numeric values, nonnegative integer counts, exactly three presets, minimum cell counts, no identifier keys/MAC strings, and lattice geometry. Task 3 adds adversarial coverage and strengthens this same function. Build and validate all three documents in memory before writing any file. Create output directory, write UTF-8 `JSON.stringify(document, null, 2) + '\n'`. Avoid partial outputs on known validation errors; no need for a new storage framework.
- [ ] Generate from ignored copy and independently regenerate to an ignored second directory:

```powershell
node scripts/generate-demo-data.cjs --input "private-data/Chanthabuly merge all zone.csv" --out public/data
node scripts/generate-demo-data.cjs --input "private-data/Chanthabuly merge all zone.csv" --out private-data/verification-output
Get-FileHash public/data/*.json
Get-FileHash private-data/verification-output/*.json
node --test tests/spatial.test.cjs
```

- [ ] Match hashes per filename. Print only aggregate counts, selection method, A/B/C metrics, rejected-row totals. Investigate differences from the planning probe; never force counts. Include determinism test using reversed input rows too.
- [ ] Commit only script/library/tests and three generated documents: `feat: generate privacy-safe spatial demo data`.

## Task 3 — Privacy gates and portable regression tests

**Files:** Extend `tests/spatial.test.cjs`, `scripts/lib/spatial.cjs`; modify `tests/wifi.test.cjs`, `package.json`.

**Interface:** `validatePublicOutputs` rejects non-allowlisted shapes and privacy violations before generator writes. Tests require no private CSV.

- [ ] Add a recursive forbidden-key scan and serialized value scan:

```js
function assertNoIdentifiers(value) {
  if (Array.isArray(value)) return value.forEach(assertNoIdentifiers);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assert.equal(/^(ssid|bssid)$/i.test(key), false, `forbidden key: ${key}`);
      assertNoIdentifiers(child);
    }
  }
}
function assertNoMac(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i.test(serialized), false);
  assert.equal(/\b(?:[0-9a-f]{2}-){5}[0-9a-f]{2}\b/i.test(serialized), false);
}
```

- [ ] Strengthen with exact public schema allowlists: reject unknown top-level/nested fields, raw observation arrays, identifier/hash lists, per-device timestamps, and manufacturer fields. Allow bounds/center only in grid and presets as declared. Geometry must equal row/column-derived values within `1e-10`; do not mistake coarse decimal geometry for raw GPS.
- [ ] Add malicious category-string fixtures containing MAC syntax and confirm they become Other / Unknown. Validate actual checked-in `public/data/*.json`, not only synthetic outputs.
- [ ] Test every published cell ≥5, suppressed cell IDs absent from grid cells, count partitions/sums, area/dataset cross-cell deduplication, and no signal values outside histogram coverage. A dataset unique count must equal raw distinct values in synthetic fixtures, not sum of per-cell counts.
- [ ] Replace only the fifth WiFi test's real-file dependency with a synthetic inline CSV while preserving fetch/path encoding and Phase 1 null-signal semantics. Example body:

```js
const csv = [
  'SSID,BSSID,latitude,longitude,signal,frequency,AUTHENTICATION',
  'Synthetic One,TEST-A,18,102,-65,2412,OWE',
  'Synthetic Two,test-a,18.001,102.001,-75,5180,Open',
  'Synthetic Three,TEST-B,18.002,102.002,,2412,WPA2-Personal',
].join('\n');
// Existing global.fetch mock returns { ok: true, text: async () => csv }.
// Keep its encoded PRIMARY_DATASET assertion; no real filesystem read.
// Assert observationCount=3, uniqueBssidCount=2, exactly one null signal.
```

- [ ] Retain the other four tests and parser behavior. Use `try/finally` to restore global.fetch. Do not replace tests with skipped/always-true assertions. Add `"test": "node --test tests/*.test.cjs"` to package scripts; no dependency change.
- [ ] Run `npm.cmd test`, build, lint. Commit `test: enforce spatial privacy and portable WiFi regressions`.

## Task 4 — Types, cached loader, context, and shared presentation helpers

**Files:** Create `src/type/spatial.ts`, `src/utils/loadSpatialData.ts`, `src/context/spatialContext.ts`, `src/context/SpatialDataContext.tsx`, `src/utils/spatialMetrics.ts`, `tests/spatial-ui.test.cjs`, `src/components/DatasetLimitations.tsx`.

**Interface:** Provider exposes SpatialDataState via `useSpatialData()`. `loadSpatialData(): Promise<SpatialData>` and `invalidateSpatialData(): void`; exactly three aggregate URLs. Do not switch root provider yet.

- [ ] Copy section 5.4 types. Implement a dependency-free `knownBandShares` with the same numeric contract as offline code; test denominator parity using `{2,6,92}` and all-unknown cases.
- [ ] Loader uses `Promise.all` for `/data/grid-cells.json`, `/data/preset-areas.json`, `/data/dataset-summary.json`. Check `response.ok`, parse unknown JSON, verify schemaVersion and expected arrays/counts/geometry/three unique preset IDs; malformed input throws a readable aggregate-data error. Never catch and substitute empty success data or raw CSV.
- [ ] Cache the in-flight/result promise at module scope; clear cache on rejection. Provider uses an effect with an active/unmounted guard; retry clears cache and increments a reload token. React StrictMode remounts share the promise. Never abort a shared request from one subscriber's cleanup.

```ts
let pending: Promise<SpatialData> | null = null;
export function invalidateSpatialData(): void { pending = null; }
// loadSpatialData assigns pending once, resets it in catch, and rethrows.
// Provider effect: let active = true; load -> set only if active;
// cleanup: active = false. Retry resets error/loading and reload token.
```

- [ ] Keep context/hook in `.ts` and provider-only export in `.tsx`. Provider default is empty arrays, null summary, loading true, error null. Hook outside provider throws a clear programmer error.
- [ ] Keep spatialMetrics limited to implemented helpers in this task. The frozen future APIs are `metricValue(metrics: AggregateMetrics, metric: SpatialMetric): number|null` and `buildIntensityScale(cells: GridCell[]): IntensityScale` in Task 5; `interpretAreas(a: PresetArea,b: PresetArea): string[]` in Task 7; and `summaryChartData(summary: DatasetSummary): SummaryChartData` in Task 8. Do not add incomplete function declarations or fabricated return values now. Each later task introduces its types and working implementation together.
- [ ] Shared disclaimer must include: “Metrics describe wireless infrastructure observed by this survey. They do not directly measure population, customer footfall, internet speed, sales, or property value. This is historical survey coverage, not live citywide coverage.” Also state minimum-five-cell suppression is not an anonymity guarantee.
- [ ] Test loader failure/retry, schema rejection, and same-promise dedup using mocked fetch and transpiled TS as existing tests do. Restore globals. Keep Node test TS helper local; avoid production test-only exports.
- [ ] Run npm test, build, lint; commit `feat: add aggregate spatial data context`.

## Task 5 — Grid map and truthful legend

**Files:** Create `GridIntelligenceLayer.tsx`, `GridLegend.tsx`; modify `src/pages/MapPage.tsx`, `src/utils/spatialMetrics.ts`, `tests/spatial-ui.test.cjs`.

**Interface:** Layer props `{ cells: GridCell[]; selectedCellId: string|null; onSelect: (cell: GridCell) => void; metric: SpatialMetric }`. GridLegend consumes the same scale as the layer. MapPage consumes spatial context.

- [ ] Define these return contracts in spatialMetrics, then implement the functions. `metricValue` returns uniqueNetworkCount for infrastructure, knownBandShares(...).five for fiveGhzShare, and medianSignalDbm for medianSignal. Shares remain fractions internally; only UI formatting multiplies by 100.

```ts
export interface IntensityBin {
  upperInclusive: number | null; // null is the final unbounded bin
  label: string;
  color: string;
}
export interface IntensityScale {
  minimum: number | null;
  maximum: number | null;
  bins: IntensityBin[];
}
// Empty cells -> { minimum: null, maximum: null, bins: [] }.
// All equal -> one final bin labelled with the observed value.
// Fixed palette, low to high: #d1fae5 #6ee7b7 #34d399 #059669 #065f46.
// Every rectangle and legend uses the same bins; never recompute separate thresholds.
```

- [ ] Implement intensity quantiles from sorted unique-count observations: q20/q40/q60/q80 index `Math.ceil(q*n)-1`; collapse duplicate boundaries and omit thresholds at max. Assign values with the first `value <= upperBound` match, or final bin. Equal values always get equal colors. Empty/all-equal data yields an honest one-bin legend, not five fictitious ranges.
- [ ] Add tests for `[5,5,5,5]`, `[5,5,10,10,100]`, empty arrays, and exact threshold equality. For five bins use Very Low/Low/Medium/High/Very High; for fewer bins display explicit numeric ranges and “within this survey” instead of misleading five-level labels.
- [ ] Render Leaflet Rectangle children, no Marker or clustering import:

```tsx
<Rectangle
  key={cell.cellId}
  bounds={[[cell.bounds.south, cell.bounds.west], [cell.bounds.north, cell.bounds.east]]}
  pathOptions={{ color: selected ? '#0f172a' : '#ffffff', weight: selected ? 3 : 1,
    fillColor: color, fillOpacity: 0.65 }}
  eventHandlers={{ click: () => onSelect(cell) }}
>
  <Tooltip>Cell {cell.cellId}: {cell.uniqueNetworkCount} observed network identifiers</Tooltip>
</Rectangle>
```

- [ ] MapPage uses existing tile attribution, a definite responsive map height, center near `[17.997,102.608]`, and published bounds for initial fit. Remove competition raw SSID search, BSSID search, auth marker filters, and district placeholder controls. Avoid browser geolocation unless explicitly selected by the user; it is unnecessary for this demo.
- [ ] State uses selected ID, not a duplicated aggregate object; derive selected cell through memoized lookup. Memoize scale and rectangle styles by cells/metric. Selection should not refetch data or reset the map camera.
- [ ] Default metric is infrastructure. Legend title exactly “Wireless Infrastructure Intensity”; helper “Based on unique network identifiers observed per survey cell”. Empty grid shows “No published survey cells”; errors provide Retry.
- [ ] Optional selector: only add if tests/build stay simple. Use fixed bands 0/25/50/75/100% for known-band 5 GHz share and signal boundaries -90/-80/-70/-60 dBm. Unknown is a separate neutral color. Never label stronger measured signal as faster internet. If deferred, keep the union type but render no unfinished selector and record deferral.
- [ ] Verify rendering in a temporary spatial-provider wrapper on MapPage if the root is still legacy. Remove that wrapper at Task 8; do not leave duplicate permanent providers.
- [ ] Run tests/build/lint; commit `feat: add LaoSence grid intelligence map`.

## Task 6 — Cell panel and deterministic preset controls

**Files:** Create `AreaIntelligencePanel.tsx`, `PresetAreaControls.tsx`; modify `MapPage.tsx`, `GridIntelligenceLayer.tsx` as needed.

**Interface:** Panel props `{ title: string; metrics: AggregateMetrics; area?: PresetArea }`. Controls props `{ areas: PresetArea[]; selectedId: string|null; onSelect: (area: PresetArea) => void }`.

- [ ] Panel displays Observed network identifiers, Observations, Median recorded signal (dBm), 2.4 GHz share, 5 GHz share, Advertised security mix, Most observed channels. Explain known-band denominator and show unknown-band observation count. Use `value === null`, not truthiness, when formatting zero shares.
- [ ] Add stable selectors: `data-testid="grid-map"`, `data-testid="area-intelligence"`, `data-testid="selected-cell-id"`. Controls have accessible names exactly Area A/Area B/Area C. Give the selected preset button `aria-pressed`.
- [ ] Null median → “No recorded data”; no known band denominator → “Unknown”; empty channel list → “No recorded channels”. Security percentage denominator is all observations, including Other / Unknown; Open is not described as vulnerable.
- [ ] Map state is a discriminated selection: `{kind:'cell',id}` or `{kind:'preset',id}` or null. Preset selection clears cell highlight; cell selection clears preset outline. Render a Rectangle for the full preset bounds, including unpublished geometric positions.
- [ ] Fit preset with a small child component using `useMap()` and an effect keyed to selected preset ID; call `map.fitBounds(bounds,{padding:[24,24]})`. Do not fit on every render or when merely switching color metric.
- [ ] Verify each preset UI metric equals its JSON record, not summed selected cells. Show `750 m × 750 m · approximately 0.56 km²` and published coverage `x/9 cells`. Provide a Compare link.
- [ ] Check narrow viewport panel remains readable and controls do not cover map interactions. Run tests/build/lint and commit `feat: add preset area intelligence`.

## Task 7 — Factual comparison page

**Files:** Create `ComparePage.tsx`; modify `spatialMetrics.ts`, `tests/spatial-ui.test.cjs`; add route/NavBar link when root integration is ready in Task 8.

**Interface:** `interpretAreas(a: PresetArea,b: PresetArea): string[]` returns one to three descriptive sentences. Comparison consumes preset aggregates only.

- [ ] Test threshold boundaries: identifier relative difference below/at10%; band/Open below/at5 percentage points; median below/at5dB; all-null denominators; equal metrics; no more than three statements.
- [ ] Implement fixed statement priority: identifiers, 5 GHz share, Open share, median signal. Identifier relative difference is `abs(a-b)/min(a,b)` when minimum>0; if one count is zero and the other positive, report the factual difference without an invented percent. Both zero means no statement.
- [ ] Shares are fractions; compare absolute difference to `0.05` with small floating tolerance `1e-12`. Open share uses `authenticationCounts.Open / observationCount`; zero observations gives null. Median compares finite known values only.

```ts
// Permitted outputs; insert actual selected names and measured difference:
// `${higher.name} shows a higher number of observed network identifiers within the same geographic survey area.`
// `${higher.name} shows a larger observed 5 GHz share.`
// `${higher.name} has a higher share of advertised Open networks.`
// `The median recorded signal differs by ${difference} dB between these areas.`
// No triggered thresholds:
// 'The selected areas show broadly similar values across these surveyed wireless indicators.'
```

- [ ] Default selected IDs are area-a and area-b. Native labeled selects “Area A selection” and “Area B selection” offer A/B/C; disable the other selected option. A defensive state guard still prevents identical IDs. Changing selectors updates both cards and interpretation without data fetch.
- [ ] Side-by-side metrics use the same panel/formatters: equal area size, identifiers, observations, median, both band shares, advertised security. No winner, location recommendation, combined score, or green “best area” treatment.
- [ ] Always show: “These indicators describe the surveyed wireless environment. They are intended as supplementary site-screening information and do not directly measure footfall, sales, internet performance, or property value.”
- [ ] Include product copy: “LaoSence adds a digital-infrastructure layer to traditional site-screening data such as rent, access, POIs and demographics.”
- [ ] Run tests/build/lint; commit `feat: add factual area comparison`.

## Task 8 — Aggregate charts and root integration

**Files:** Modify `src/pages/AnalysisPage.tsx`, `src/components/analysis/AllChartContainer.tsx`, `AuthenticationChart.tsx`, `EncryptionTypeChar.tsx`, `SignalStrengthChart.tsx`, `FrequencyChart.tsx`, `ChannelChart.tsx`, `RadioTypesChart.tsx`, `src/main.tsx`, `src/components/NavBar.tsx`, three admin pages in section 3, `src/utils/spatialMetrics.ts`, `tests/spatial-ui.test.cjs`.

**Interface:** `summaryChartData(summary)` returns six small arrays matching the existing chart data shapes below. Charts receive data props and stop calling `useWiFiData`.

```ts
export interface SummaryChartData {
  authentication: { method: string; count: number }[];
  encryption: { browser: string; observations: number }[];
  frequency: { band: string; count: number }[];
  signal: { bin: string; count: number }[];
  channel: { bin: string; count: number }[]; // top 15 by observations
  radio: { radioType: string; count: number }[];
}
```

- [ ] Test adapters directly from a tiny DatasetSummary: sums match observations, OWE present, no hardcoded encryption/radio, channel sorting count-first, top15 wording correct. Never expand counts into artificial WiFiData rows to reuse old helpers.
- [ ] Preserve existing chart styling and dataKeys where practical. All row-count tooltips say Observations. Missing/empty data shows No recorded data. Band chart includes Other / Unknown; known-band percentage explanation remains separate from all-observation distributions.
- [ ] Analysis cards use summary observationCount and uniqueNetworkCount. Show source/period and accepted-versus-rejected observation context when rejected count>0. Include DatasetLimitations. Do not hardcode reference totals.
- [ ] AllChartContainer accepts `{ summary: DatasetSummary }`. Pass chart-specific arrays to each chart. AdminAnalysisPage can simply reuse AnalysisPage instead of providing fake rows.
- [ ] Replace root WiFiDataProvider with SpatialDataProvider and add `/compare`. Remove temporary MapPage provider wrapper. Home and `/map` share the same aggregate map; add Map/Analytics/Compare in NavBar. Remove stray literal `q` after messaging route while touching main.
- [ ] AdminMapPage renders MapPage. AdminUploadPage retains local upload utilities but replaces old MapComponent preview with a concise link to the aggregate Map and text explaining that competition maps use generated aggregates. Do not add a raw provider to satisfy legacy hooks. Avoid auth/game redesign.
- [ ] Trace every mounted consumer:

```powershell
rg -n 'WiFiDataProvider|useWiFiData|MapComponent|WiFiMarkers|loadCSVFromPath|CSV_FILE' src
rg -n 'Networks|WiFi networks|Access points|Congestion|Winner|Best Location' src/pages src/components
```

Legacy unmounted definitions may remain, but no mounted route can trigger a raw request or crash due to missing WiFi context. Check imports, not only text hits. Remove unreachable imports from active root/page graphs where practical.

- [ ] Browse `/`, `/map`, `/analysis`, `/compare` with request logging before raw deletion. All competition data requests must be three aggregate URLs. Tile images, fonts, JS/CSS are allowed; “only aggregates” refers to wireless data sources.
- [ ] Run tests/build/lint; commit `refactor: use aggregate data throughout competition routes`.

## Task 9 — Remove raw wireless files from current tree

**Files:** Remove seven raw files below; create `docs/demo-data.md`; confirm `.gitignore` and portable tests.

**Gate:** Do not run removal until Task 8 works and the private input hash/copy from Task 0 exists. Removal is authorized by the approved Phase 2 specification; no additional architecture approval is required.

```text
public/CSV_FILE/Chanthabuly merge all zone.csv
public/CSV_FILE/LPB-result.csv
public/CSV_FILE/result-VTE.csv
public/CSV_FILE/result_FOEN.csv
public/CSV_FILE/ZONE A2.csv
src/assets/CSV_FILE/Chanthabuly merge all zone.csv
src/assets/CSV_FILE/ZONE A2.csv
```

- [ ] Verify repository root with `git rev-parse --show-toplevel`. List tracked targets with `git ls-files -- public/CSV_FILE src/assets/CSV_FILE`. Confirm these are the seven survey files above. Do not recursively remove any computed directory.
- [ ] Recheck private input exists and hash matches original. Use explicit Git paths:

```powershell
git rm -- "public/CSV_FILE/Chanthabuly merge all zone.csv" "public/CSV_FILE/LPB-result.csv" "public/CSV_FILE/result-VTE.csv" "public/CSV_FILE/result_FOEN.csv" "public/CSV_FILE/ZONE A2.csv" "src/assets/CSV_FILE/Chanthabuly merge all zone.csv" "src/assets/CSV_FILE/ZONE A2.csv"
git ls-files -- public/CSV_FILE src/assets/CSV_FILE
git check-ignore -- "private-data/Chanthabuly merge all zone.csv"
```

- [ ] Inventory other `public/` and imported asset files for additional raw wireless data, including JSON/backups. Preserve game JSON. Do not assume `.gitignore` removes previously tracked files or stale built copies.
- [ ] Document regeneration exactly:

```powershell
node scripts/generate-demo-data.cjs --input "private-data/Chanthabuly merge all zone.csv" --out public/data
npm.cmd test
npm.cmd run build
```

Developers place authorized raw input in ignored private-data, generate locally, and commit only aggregate JSON. Do not tell them to download an old public commit. Explain accepted signal rejection, geometry approximation, coverage-biased sampling, canonical category grouping, sparse suppression, residual differencing risks, historical Git exposure, and no live citywide claims.

- [ ] Run tests/build/lint after removal. Confirm new `dist/` contains no CSV_FILE directory/raw wireless files; Vite's rebuilt output must replace old copied raw assets. Preview raw URLs must not return raw CSV bytes (SPA HTML fallback is not a data file).
- [ ] Review staged filenames then commit `chore: remove raw wireless datasets from current tree`. Confirm `git ls-tree -r --name-only HEAD -- public/CSV_FILE src/assets/CSV_FILE` is empty.

## Task 10 — Browser, error-state, and performance verification

**Files:** Screenshots/logs in ignored `artifacts/phase2/`; fix only demonstrated defects in their owning files. Progress evidence in `docs/phase2-progress.md`.

**Interface:** Concrete browser evidence for production preview and the final report. Use available browser tooling; use `webapp-testing` skill if applicable. No pretend browser checks from static code searches.

- [ ] Start preview from the freshly built app:

```powershell
npm.cmd run preview -- --host 127.0.0.1
```

- [ ] In browser instrumentation, attach request/pageerror/console-error observers **before** navigation. Clear per-route logs. Test direct loads and navigation for `/`, `/map`, `/analysis`, `/compare`. Record all wireless data URLs; reject `/CSV_FILE/`, case-insensitive wireless `.csv`, and Chanthabuly raw filename requests.
- [ ] Assert grid rectangles render and no individual marker cloud appears. Select a visible rectangle by actual Leaflet layer/bounds or a browser-visible cell target; verify selected-cell-id and panel values equal that cell's JSON. Do not infer click success merely from panel existence.
- [ ] Click Area A, B, C in turn. Verify button selection, outline, viewport change, name, exact JSON metrics, equal 3×3 dimensions. Confirm mathematical nonoverlap through tests and visually plausible distinct blocks.
- [ ] Compare defaults A vs B; select C on each side in separate actions, confirm the other option is disabled and interpretation updates. Verify no Winner/Best Location/sales or footfall prediction claim.
- [ ] Verify analytics charts/card values against summary, every row tooltip says Observations, and historical limitations are visible. No raw SSID/BSSID values or AP coordinates in any competition UI.
- [ ] Capture four screenshots:

```text
artifacts/phase2/grid-map.png
artifacts/phase2/cell-area-intelligence.png
artifacts/phase2/preset-area.png
artifacts/phase2/compare-area-a-vs-b.png
```

- [ ] Exercise failure states with browser request interception (not committed malformed data): aggregate URL 500, malformed JSON, empty cells, null median, all-unknown band, empty channels. Verify honest message, working Retry after restoring responses, no page-breaking error. Restore normal data before screenshots.
- [ ] Performance evidence: record published rectangle count, three JSON byte sizes, initial aggregate fetch/parse duration, and click-to-panel/preset/compare responsiveness on the actual machine. Aim for interactions under roughly 200 ms after load; report measured lag rather than claiming a universal SLA. Separate tile latency from aggregate data and rendering.
- [ ] Keep preprocessing roughly O(N + per-cell signal sorting + candidate coverage checks); use nine-cell lookups rather than rescanning all raw rows for every candidate. For this survey ~380 published cells, SVG rectangles are sufficient; only adopt existing Leaflet Canvas preference if profiling shows a problem. No new renderer library, marker clustering, or optimization of legacy code.
- [ ] Memoize indexes/scales; derive charts once per loaded summary; never duplicate JSON fetches on selection/navigation. Do not force React.lazy/code splitting solely to remove an inherited bundle warning unless measured performance requires it.
- [ ] If browser tools are unavailable, mark browser acceptance blocked with the exact limitation. Do not claim Phase 2 complete. Preserve the commands/checklist for a human/browser-capable model.

## Task 11 — Fresh final verification and final commit

**Files:** Final tests and evidence; no new feature work.

- [ ] Stop the preview/dev process you started before `npm ci` if Windows locks native modules. Stop only the owned process/session, never kill all Node processes globally.
- [ ] Run the entire verification fresh, sequentially, record every exit code and exact test counts:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run lint
node --test tests/wifi.test.cjs
node --test tests/spatial.test.cjs
node --test tests/spatial-ui.test.cjs
npm.cmd test
```

- [ ] All must pass. Build/lint warnings and dependency advisories are reported separately; do not silently omit them. Existing WiFi suite should still have five meaningful passing tests. Do not prescribe a fabricated total for new tests; read Node's actual summary.
- [ ] Regenerate into ignored verification-output again if private input is available; compare all three file hashes. If a clean clone lacks private data, committed-output/synthetic tests must still pass; disclose that regeneration was not repeated there.
- [ ] Run privacy scans against actual generated files and built `dist/data` copies. Assert schema allowlist, forbidden keys/MAC syntax absent, no raw row arrays, lattice geometry correct, all published cells≥5, preset dimensions/nonoverlap correct. Scan tracked public/source assets for raw files. Verify no raw files in build.
- [ ] Restart fresh preview and repeat four-route smoke/network checks from Task 10 against the final build. If any code changes after checks, rerun relevant tests plus final build/lint and affected browser checks.
- [ ] Commit scoped final tests/fixes/evidence as `test: verify spatial aggregation and privacy`. Do not commit screenshot/log artifacts that contain sensitive information. Do not fabricate an empty commit if no files changed; report the preceding meaningful commit.
- [ ] Record final state:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git log --oneline 73cfb1c285eb7c0983a7295ad77c4093cfeb9259..HEAD
git diff --name-status 73cfb1c285eb7c0983a7295ad77c4093cfeb9259..HEAD
git ls-tree -r --name-only HEAD -- public/CSV_FILE src/assets/CSV_FILE
```

Do not amend solely to put a commit's own SHA inside itself. Final report can reference the SHA externally. No local squash, merge to main, push, deploy, or Phase 3 work.

## Task 12 — Acceptance audit and handoff report

**Interface:** Evidence-based final report. Mark incomplete items explicitly; no success claim until all required rows pass.

| Acceptance requirement | Evidence owner |
|---|---|
| Correct baseline/branch and fresh baseline commands | Task 0 |
| Explicit input, deterministic generated JSON, no ZONE merge | Tasks 1–2 |
| 250 m independent-origin grid and suppression≥5 | Tasks 1–3 |
| Accepted/rejected observation semantics and real negative RSSI | Tasks 1–3 |
| Dataset/preset distinct counts from whole raw scope | Tasks 1–3 |
| Preset median uses raw signals, not cell medians | Tasks 2–3 |
| A/B/C equal geometry, nine positions, nonoverlap, declared selection/fallback | Tasks 2–3 |
| No public identifiers, hashes, raw timestamps/rows/AP coordinates | Tasks 3, 9, 11 |
| Grid default intensity, honest legend, no marker cloud | Tasks 5, 10 |
| Cell interaction and all three preset buttons/panels | Tasks 6, 10 |
| Compare defaults/selectors/descriptive thresholds/no winner | Tasks 7, 10 |
| Analytics uses actual aggregate distributions/Observations wording | Tasks 8, 10 |
| Root/legacy routes do not trigger raw data or missing-provider crashes | Tasks 8, 10 |
| Current HEAD and fresh build contain no raw wireless CSV | Tasks 9, 11 |
| All four routes make no raw requests or page-breaking errors | Tasks 10–11 |
| Empty/loading/failure/null-data states and Retry | Tasks 4, 6, 10 |
| Visible historical/survey/business/privacy limitations | Tasks 6–10 |
| Fresh install/build/lint/all tests passing | Task 11 |
| Four screenshots and measured performance evidence | Task 10 |

Final report must include all of the following:

1. Branch name.
2. Starting commit.
3. Final commit SHA.
4. Reviewable commit list.
5. Files created.
6. Files modified.
7. Exact raw files removed.
8. Three aggregate dataset paths.
9. Published grid-cell count.
10. Suppressed occupied-cell count.
11. Area A: area size, published coverage, identifiers, observations, median, band/security counts.
12. Same metrics for Area B.
13. Same metrics for Area C.
14. Equal dimensions/nonoverlap evidence and selection/fallback method.
15. Fresh build result, including warnings.
16. Fresh lint result.
17. Exact passed/failed/skipped test counts for each suite and npm test.
18. Browser pages/interactions actually verified.
19. Recorded wireless request URLs confirming no raw CSV requests.
20. Privacy scan result and geometry validation.
21. Remaining warnings/limitations, optional selector deferral if any, old-history exposure.
22. Screenshot paths.

Conclude with a concise **BEFORE → AFTER**: raw CSV and individual markers → private preprocessing and aggregate grid/preset/summary views. No claim that aggregates guarantee anonymity or directly measure business outcomes. Stop after Phase 2.
