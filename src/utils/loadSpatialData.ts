import type {
  AggregateMetrics,
  Bounds,
  DatasetSummary,
  GridDocument,
  PresetDocument,
  SpatialData,
} from '@/type/spatial';

const GRID_SIZE_METERS = 250;
const MIN_UNIQUE_NETWORKS_PER_CELL = 5;
const REFERENCE_LATITUDE = 18;
const LAT_STEP = GRID_SIZE_METERS / 111320;
const LNG_STEP = GRID_SIZE_METERS /
  (111320 * Math.cos(REFERENCE_LATITUDE * Math.PI / 180));
const GEOMETRY_TOLERANCE = 1e-10;

const AGGREGATE_URLS = [
  '/data/grid-cells.json',
  '/data/preset-areas.json',
  '/data/dataset-summary.json',
] as const;

const AGGREGATE_KEYS = [
  'observationCount',
  'uniqueNetworkCount',
  'medianSignalDbm',
  'bandCounts',
  'authenticationCounts',
  'encryptionCounts',
  'topChannels',
] as const;
const BAND_KEYS = ['2.4GHz', '5GHz', 'otherUnknown'] as const;
const AUTHENTICATION_LABELS = new Set([
  'OWE',
  'Open',
  'WPA Personal',
  'WPA Enterprise',
  'WPA2 Personal',
  'WPA2 Enterprise',
  'WPA3 Personal',
  'WPA3 Enterprise',
  'Other / Unknown',
]);
const ENCRYPTION_LABELS = new Set([
  'CCMP',
  'TKIP',
  'AES',
  'WEP',
  'GCMP',
  'TKIP+CCMP',
  'None',
  'Other / Unknown',
]);
const RADIO_LABELS = new Set([
  '802.11a',
  '802.11b',
  '802.11g',
  '802.11n',
  '802.11ac',
  '802.11ax',
  '802.11be',
  'Other / Unknown',
]);
const SIGNAL_HISTOGRAM_LABELS = [
  '< -100 dBm',
  '[-100,-90) dBm',
  '[-90,-80) dBm',
  '[-80,-70) dBm',
  '[-70,-60) dBm',
  '[-60,-50) dBm',
  '[-50,-40) dBm',
  '[-40,-30) dBm',
  '[-30,-20) dBm',
  '[-20,-10) dBm',
  '[-10,0) dBm',
] as const;
const MAC_PATTERNS = [
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
  /\b(?:[0-9a-f]{2}-){5}[0-9a-f]{2}\b/i,
  /\b[0-9a-f]{12}\b/i,
];

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: unknown, expectedKeys: readonly string[], label: string): asserts value is JsonRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} has invalid schema keys`);
  }
}

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function assertNonNegativeInteger(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
}

function assertClose(actual: unknown, expected: number, label: string): void {
  assertFiniteNumber(actual, label);
  if (Math.abs(actual - expected) > GEOMETRY_TOLERANCE) {
    throw new Error(`${label} is not on the fixed lattice`);
  }
}

function validateCountRecord(value: unknown, label: string, allowedLabels: Set<string>): number {
  if (!isRecord(value)) throw new Error(`${label} must be a count record`);
  let total = 0;
  for (const [key, count] of Object.entries(value)) {
    if (!allowedLabels.has(key)) throw new Error(`${label} contains an unknown category`);
    assertNonNegativeInteger(count, `${label}.${key}`);
    total += count;
  }
  return total;
}

function validateBounds(value: unknown, label: string): Bounds {
  assertExactKeys(value, ['south', 'west', 'north', 'east'], label);
  const south = value.south;
  const west = value.west;
  const north = value.north;
  const east = value.east;
  assertFiniteNumber(south, `${label}.south`);
  assertFiniteNumber(west, `${label}.west`);
  assertFiniteNumber(north, `${label}.north`);
  assertFiniteNumber(east, `${label}.east`);
  if (south >= north || west >= east) {
    throw new Error(`${label} must have positive dimensions`);
  }
  return { south, west, north, east };
}

function validateAggregateMetrics(value: unknown, label: string): AggregateMetrics {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const observationCount = value.observationCount;
  const uniqueNetworkCount = value.uniqueNetworkCount;
  assertNonNegativeInteger(observationCount, `${label}.observationCount`);
  assertNonNegativeInteger(uniqueNetworkCount, `${label}.uniqueNetworkCount`);
  if (uniqueNetworkCount > observationCount) {
    throw new Error(`${label}.uniqueNetworkCount cannot exceed observationCount`);
  }
  if (value.medianSignalDbm !== null) {
    assertFiniteNumber(value.medianSignalDbm, `${label}.medianSignalDbm`);
    if (value.medianSignalDbm >= 0) throw new Error(`${label}.medianSignalDbm must be negative`);
  }

  const bandCounts = value.bandCounts;
  assertExactKeys(bandCounts, BAND_KEYS, `${label}.bandCounts`);
  let bandTotal = 0;
  for (const key of BAND_KEYS) {
    const count = bandCounts[key];
    assertNonNegativeInteger(count, `${label}.bandCounts.${key}`);
    bandTotal += count;
  }
  if (bandTotal !== observationCount) throw new Error(`${label}.bandCounts do not match observations`);

  const authenticationTotal = validateCountRecord(
    value.authenticationCounts,
    `${label}.authenticationCounts`,
    AUTHENTICATION_LABELS,
  );
  if (authenticationTotal !== observationCount) {
    throw new Error(`${label}.authenticationCounts do not match observations`);
  }
  const encryptionTotal = validateCountRecord(
    value.encryptionCounts,
    `${label}.encryptionCounts`,
    ENCRYPTION_LABELS,
  );
  if (encryptionTotal !== observationCount) {
    throw new Error(`${label}.encryptionCounts do not match observations`);
  }

  if (!Array.isArray(value.topChannels)) throw new Error(`${label}.topChannels must be an array`);
  for (const [index, channel] of value.topChannels.entries()) {
    assertExactKeys(channel, ['channel', 'observations'], `${label}.topChannels[${index}]`);
    if (typeof channel.channel !== 'number' || !Number.isInteger(channel.channel) || channel.channel <= 0) {
      throw new Error(`${label}.topChannels[${index}].channel must be positive`);
    }
    assertNonNegativeInteger(channel.observations, `${label}.topChannels[${index}].observations`);
    if (channel.observations > observationCount) {
      throw new Error(`${label}.topChannels[${index}].observations exceeds observations`);
    }
  }
  return value as unknown as AggregateMetrics;
}

function cellGeometry(row: number, col: number): { bounds: Bounds; center: { lat: number; lng: number } } {
  return {
    bounds: {
      south: row * LAT_STEP,
      west: col * LNG_STEP,
      north: (row + 1) * LAT_STEP,
      east: (col + 1) * LNG_STEP,
    },
    center: {
      lat: (row + 0.5) * LAT_STEP,
      lng: (col + 0.5) * LNG_STEP,
    },
  };
}

function blockCellIds(row: number, col: number): string[] {
  const cellIds: string[] = [];
  for (let currentRow = row; currentRow < row + 3; currentRow += 1) {
    for (let currentCol = col; currentCol < col + 3; currentCol += 1) {
      cellIds.push(`${currentRow}_${currentCol}`);
    }
  }
  return cellIds;
}

function parseCellId(cellId: string, label: string): { row: number; col: number } {
  const match = /^(-?\d+)_(-?\d+)$/.exec(cellId);
  if (!match) throw new Error(`${label} must be a lattice cell ID`);
  return { row: Number(match[1]), col: Number(match[2]) };
}

function validateGridDocument(value: unknown): GridDocument {
  assertExactKeys(value, ['metadata', 'cells'], 'grid document');
  const metadata = value.metadata;
  assertExactKeys(metadata, [
    'schemaVersion',
    'gridSizeMeters',
    'minimumUniqueNetworksPerCell',
    'referenceLatitude',
    'metricDefinition',
  ], 'grid.metadata');
  if (metadata.schemaVersion !== 1 || metadata.gridSizeMeters !== GRID_SIZE_METERS ||
      metadata.minimumUniqueNetworksPerCell !== MIN_UNIQUE_NETWORKS_PER_CELL ||
      metadata.referenceLatitude !== REFERENCE_LATITUDE) {
    throw new Error('grid metadata does not match the aggregate contract');
  }
  assertString(metadata.metricDefinition, 'grid.metadata.metricDefinition');
  if (!Array.isArray(value.cells)) throw new Error('grid.cells must be an array');

  const cellIds = new Set<string>();
  for (const [index, cell] of value.cells.entries()) {
    const label = `grid.cells[${index}]`;
    assertExactKeys(cell, [...AGGREGATE_KEYS, 'cellId', 'row', 'col', 'bounds', 'center'], label);
    assertString(cell.cellId, `${label}.cellId`);
    if (cellIds.has(cell.cellId)) throw new Error('grid cell IDs must be unique');
    cellIds.add(cell.cellId);
    if (typeof cell.row !== 'number' || !Number.isInteger(cell.row) ||
        typeof cell.col !== 'number' || !Number.isInteger(cell.col) ||
        cell.cellId !== `${cell.row}_${cell.col}`) {
      throw new Error(`${label} has invalid lattice coordinates`);
    }
    validateBounds(cell.bounds, `${label}.bounds`);
    const center = cell.center;
    assertExactKeys(center, ['lat', 'lng'], `${label}.center`);
    assertFiniteNumber(center.lat, `${label}.center.lat`);
    assertFiniteNumber(center.lng, `${label}.center.lng`);
    const expected = cellGeometry(cell.row, cell.col);
    for (const key of ['south', 'west', 'north', 'east'] as const) {
      assertClose((cell.bounds as JsonRecord)[key], expected.bounds[key], `${label}.bounds.${key}`);
    }
    assertClose(center.lat, expected.center.lat, `${label}.center.lat`);
    assertClose(center.lng, expected.center.lng, `${label}.center.lng`);
    const metrics = validateAggregateMetrics(cell, label);
    if (metrics.uniqueNetworkCount < MIN_UNIQUE_NETWORKS_PER_CELL) {
      throw new Error(`${label} does not meet the suppression threshold`);
    }
  }
  return value as unknown as GridDocument;
}

function validatePresetDocument(value: unknown, gridCellIds: Set<string>): PresetDocument {
  assertExactKeys(value, ['metadata', 'areas'], 'preset document');
  const metadata = value.metadata;
  assertExactKeys(metadata, ['schemaVersion', 'selection'], 'presets.metadata');
  if (metadata.schemaVersion !== 1) throw new Error('preset schema version is invalid');
  const selection = metadata.selection;
  assertExactKeys(selection, ['method', 'minimumPublishedCells', 'fallbackUsed', 'reason'], 'presets.metadata.selection');
  assertString(selection.method, 'presets.metadata.selection.method');
  if (selection.method !== 'longitude-thirds' && selection.method !== 'global-spatial-fallback') {
    throw new Error('preset selection method is invalid');
  }
  assertNonNegativeInteger(selection.minimumPublishedCells, 'presets.metadata.selection.minimumPublishedCells');
  if (selection.minimumPublishedCells < 1 || selection.minimumPublishedCells > MIN_UNIQUE_NETWORKS_PER_CELL) {
    throw new Error('preset selection coverage is invalid');
  }
  if (typeof selection.fallbackUsed !== 'boolean') throw new Error('preset fallback flag is invalid');
  assertString(selection.reason, 'presets.metadata.selection.reason');
  if (!selection.reason) throw new Error('preset selection reason is required');
  if (!Array.isArray(value.areas) || value.areas.length !== 3) {
    throw new Error('exactly three preset areas are required');
  }

  const expectedIds = ['area-a', 'area-b', 'area-c'];
  const presetCellIds = new Set<string>();
  for (const [index, area] of value.areas.entries()) {
    const label = `presets.areas[${index}]`;
    assertExactKeys(area, [
      ...AGGREGATE_KEYS,
      'id',
      'name',
      'dimensions',
      'areaKm2Approx',
      'cellIds',
      'bounds',
      'publishedCellCount',
    ], label);
    if (area.id !== expectedIds[index] || area.name !== `Area ${String.fromCharCode(65 + index)}`) {
      throw new Error(`${label} has invalid identity`);
    }
    const dimensions = area.dimensions;
    assertExactKeys(dimensions, ['rows', 'cols'], `${label}.dimensions`);
    if (dimensions.rows !== 3 || dimensions.cols !== 3 || area.areaKm2Approx !== 0.5625) {
      throw new Error(`${label} has invalid dimensions`);
    }
    if (!Array.isArray(area.cellIds) || area.cellIds.length !== 9 ||
        area.cellIds.some((cellId) => typeof cellId !== 'string') ||
        new Set(area.cellIds).size !== 9) {
      throw new Error(`${label}.cellIds must contain nine unique IDs`);
    }
    for (const cellId of area.cellIds) {
      if (presetCellIds.has(cellId)) throw new Error('preset areas must not overlap');
      presetCellIds.add(cellId);
    }
    const coordinates = area.cellIds.map((cellId, cellIndex) => parseCellId(cellId, `${label}.cellIds[${cellIndex}]`));
    const minRow = Math.min(...coordinates.map(({ row }) => row));
    const minCol = Math.min(...coordinates.map(({ col }) => col));
    if (JSON.stringify(area.cellIds) !== JSON.stringify(blockCellIds(minRow, minCol))) {
      throw new Error(`${label}.cellIds must form a sorted 3x3 block`);
    }
    const bounds = validateBounds(area.bounds, `${label}.bounds`);
    const expectedSouthWest = cellGeometry(minRow, minCol).bounds;
    const expectedNorthEast = cellGeometry(minRow + 2, minCol + 2).bounds;
    const expectedBounds = {
      south: expectedSouthWest.south,
      west: expectedSouthWest.west,
      north: expectedNorthEast.north,
      east: expectedNorthEast.east,
    };
    for (const key of ['south', 'west', 'north', 'east'] as const) {
      assertClose(bounds[key], expectedBounds[key], `${label}.bounds.${key}`);
    }
    assertNonNegativeInteger(area.publishedCellCount, `${label}.publishedCellCount`);
    if (area.publishedCellCount > 9 || area.publishedCellCount < selection.minimumPublishedCells) {
      throw new Error(`${label}.publishedCellCount is invalid`);
    }
    const derivedPublishedCount = area.cellIds.filter((cellId) => gridCellIds.has(cellId)).length;
    if (area.publishedCellCount !== derivedPublishedCount) {
      throw new Error(`${label}.publishedCellCount does not match grid cells`);
    }
    validateAggregateMetrics(area, label);
  }
  return value as unknown as PresetDocument;
}

function validateDatasetSummary(value: unknown, gridCellCount: number): DatasetSummary {
  assertExactKeys(value, [
    ...AGGREGATE_KEYS,
    'schemaVersion',
    'sourceLabel',
    'historicalSurveyPeriod',
    'inputObservationCount',
    'rejectedObservationCount',
    'rejectionCounts',
    'publishedCellCount',
    'suppressedCellCount',
    'signalHistogram',
    'radioTypeCounts',
  ], 'dataset summary');
  const metrics = validateAggregateMetrics(value, 'dataset summary');
  if (value.schemaVersion !== 1) throw new Error('dataset summary schema version is invalid');
  assertString(value.sourceLabel, 'dataset summary.sourceLabel');
  assertString(value.historicalSurveyPeriod, 'dataset summary.historicalSurveyPeriod');
  assertNonNegativeInteger(value.inputObservationCount, 'dataset summary.inputObservationCount');
  assertNonNegativeInteger(value.rejectedObservationCount, 'dataset summary.rejectedObservationCount');
  if (metrics.observationCount + value.rejectedObservationCount !== value.inputObservationCount) {
    throw new Error('dataset summary accepted and rejected counts do not add up');
  }
  const rejectionCounts = value.rejectionCounts;
  assertExactKeys(rejectionCounts, ['invalidCoordinates', 'invalidSignal'], 'dataset summary.rejectionCounts');
  assertNonNegativeInteger(rejectionCounts.invalidCoordinates, 'dataset summary.rejectionCounts.invalidCoordinates');
  assertNonNegativeInteger(rejectionCounts.invalidSignal, 'dataset summary.rejectionCounts.invalidSignal');
  if (value.rejectedObservationCount !== rejectionCounts.invalidCoordinates + rejectionCounts.invalidSignal) {
    throw new Error('dataset summary rejection counts do not add up');
  }
  assertNonNegativeInteger(value.publishedCellCount, 'dataset summary.publishedCellCount');
  assertNonNegativeInteger(value.suppressedCellCount, 'dataset summary.suppressedCellCount');
  if (value.publishedCellCount !== gridCellCount) {
    throw new Error('dataset summary published count does not match grid cells');
  }
  if (!Array.isArray(value.signalHistogram) || value.signalHistogram.length !== SIGNAL_HISTOGRAM_LABELS.length) {
    throw new Error('dataset summary signal histogram is invalid');
  }
  let histogramTotal = 0;
  for (const [index, bin] of value.signalHistogram.entries()) {
    assertExactKeys(bin, ['label', 'observations'], `dataset summary.signalHistogram[${index}]`);
    if (bin.label !== SIGNAL_HISTOGRAM_LABELS[index]) throw new Error('dataset summary histogram labels are invalid');
    assertNonNegativeInteger(bin.observations, `dataset summary.signalHistogram[${index}].observations`);
    histogramTotal += bin.observations;
  }
  if (histogramTotal !== metrics.observationCount) {
    throw new Error('dataset summary signal histogram does not match observations');
  }
  const radioTotal = validateCountRecord(value.radioTypeCounts, 'dataset summary.radioTypeCounts', RADIO_LABELS);
  if (radioTotal !== metrics.observationCount) {
    throw new Error('dataset summary radio counts do not match observations');
  }
  return value as unknown as DatasetSummary;
}

function assertNoPrivateFields(value: unknown): void {
  if (typeof value === 'string') {
    if (MAC_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error('public aggregate data contains a MAC-like identifier');
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(assertNoPrivateFields);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (MAC_PATTERNS.some((pattern) => pattern.test(key)) ||
        /ssid|bssid|mac|hash|raw|timestamp|observedat|manufacturer|identifier/i.test(key)) {
      throw new Error('public aggregate data contains a forbidden private field');
    }
    assertNoPrivateFields(child);
  }
}

function validateDocuments(gridValue: unknown, presetValue: unknown, summaryValue: unknown): SpatialData {
  const grid = validateGridDocument(gridValue);
  const gridCellIds = new Set(grid.cells.map((cell) => cell.cellId));
  const presets = validatePresetDocument(presetValue, gridCellIds);
  const datasetSummary = validateDatasetSummary(summaryValue, grid.cells.length);
  assertNoPrivateFields({ grid, presets, datasetSummary });
  return {
    gridCells: grid.cells,
    presetAreas: presets.areas,
    datasetSummary,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  try {
    return await response.json() as unknown;
  } catch {
    throw new Error(`invalid JSON from ${url}`);
  }
}

async function requestSpatialData(): Promise<SpatialData> {
  const [gridValue, presetValue, summaryValue] = await Promise.all(
    AGGREGATE_URLS.map((url) => fetchJson(url)),
  );
  return validateDocuments(gridValue, presetValue, summaryValue);
}

let pending: Promise<SpatialData> | null = null;
let requestGeneration = 0;

export function invalidateSpatialData(): void {
  requestGeneration += 1;
  pending = null;
}

export function loadSpatialData(): Promise<SpatialData> {
  if (pending) return pending;
  const generation = requestGeneration;
  pending = requestSpatialData().catch((cause: unknown) => {
    if (generation === requestGeneration) pending = null;
    const message = cause instanceof Error ? cause.message : 'unexpected aggregate response';
    throw new Error(`Unable to load aggregate spatial data: ${message}`);
  });
  return pending;
}
