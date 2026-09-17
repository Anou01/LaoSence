'use strict';

const GRID_SIZE_METERS = 250;
const MIN_UNIQUE_NETWORKS_PER_CELL = 5;
const REFERENCE_LATITUDE = 18;
const LAT_STEP = GRID_SIZE_METERS / 111320;
const LNG_STEP = GRID_SIZE_METERS /
  (111320 * Math.cos(REFERENCE_LATITUDE * Math.PI / 180));

const BAND_KEYS = ['2.4GHz', '5GHz', 'otherUnknown'];
const AUTHENTICATION_LABELS = new Set([
  'OWE',
  'Open',
  'WPA Personal',
  'WPA Enterprise',
  'WPA2 Personal',
  'WPA2 Enterprise',
  'WPA3 Personal',
  'WPA3 Enterprise',
]);
const ENCRYPTION_LABELS = new Set([
  'CCMP',
  'TKIP',
  'AES',
  'WEP',
  'GCMP',
  'TKIP+CCMP',
  'None',
]);
const RADIO_LABELS = new Set([
  '802.11a',
  '802.11b',
  '802.11g',
  '802.11n',
  '802.11ac',
  '802.11ax',
  '802.11be',
]);
const PUBLIC_AUTHENTICATION_LABELS = new Set([
  ...AUTHENTICATION_LABELS,
  'Other / Unknown',
]);
const PUBLIC_ENCRYPTION_LABELS = new Set([
  ...ENCRYPTION_LABELS,
  'Other / Unknown',
]);
const PUBLIC_RADIO_LABELS = new Set([
  ...RADIO_LABELS,
  'Other / Unknown',
]);
const MAC_PATTERNS = [
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
  /\b(?:[0-9a-f]{2}-){5}[0-9a-f]{2}\b/i,
  /\b[0-9a-f]{12}\b/i,
];

function numberValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    if (!value.trim()) return null;
  } else if (typeof value !== 'number') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function firstDefined(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function normalizeAuthentication(value) {
  const normalized = textValue(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized === 'owe') return 'OWE';
  if (normalized === 'open' || normalized === 'open network') return 'Open';

  const match = /^(wpa3?|wpa2)\s+(personal|enterprise|psk|eap)$/.exec(normalized);
  if (match) {
    const family = match[1] === 'wpa' ? 'WPA' : match[1].toUpperCase();
    const mode = match[2] === 'enterprise' || match[2] === 'eap'
      ? 'Enterprise'
      : 'Personal';
    return `${family} ${mode}`;
  }

  return 'Other / Unknown';
}

function normalizeEncryption(value) {
  const normalized = textValue(value)
    .toUpperCase()
    .replace(/[\s/_-]+/g, '+')
    .replace(/\++/g, '+');

  if (normalized === 'CCMP+TKIP') return 'TKIP+CCMP';
  if (normalized === 'NONE') return 'None';
  if (ENCRYPTION_LABELS.has(normalized)) return normalized;
  if (normalized === 'NO+ENCRYPTION' || normalized === 'NOENCRYPTION') return 'None';
  return 'Other / Unknown';
}

function normalizeRadioType(value) {
  const normalized = textValue(value).toLowerCase().replace(/\s+/g, '');
  const canonical = normalized ? `802.11${normalized.replace(/^802\.11/, '')}` : '';
  return RADIO_LABELS.has(canonical) ? canonical : 'Other / Unknown';
}

function bandForFrequency(frequency) {
  if (frequency !== null && frequency >= 2400 && frequency < 2500) return '2.4GHz';
  if (frequency !== null && frequency >= 4900 && frequency < 5925) return '5GHz';
  return 'otherUnknown';
}

function gridAddress(latitude, longitude) {
  const row = Math.floor(latitude / LAT_STEP);
  const col = Math.floor(longitude / LNG_STEP);
  return { row, col, cellId: `${row}_${col}` };
}

function cellGeometry(row, col) {
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

function normalizeRawRow(row) {
  const source = row && typeof row === 'object' ? row : {};
  const latitude = numberValue(source.latitude);
  const longitude = numberValue(source.longitude);

  if (
    latitude === null ||
    longitude === null ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return { observation: null, rejection: 'invalidCoordinates' };
  }

  const signal = numberValue(source.signal);
  if (signal === null || signal >= 0) {
    return { observation: null, rejection: 'invalidSignal' };
  }

  const lowercaseFrequency = numberValue(source.frequency);
  const frequency = lowercaseFrequency === null
    ? numberValue(source.FREQUENCY)
    : lowercaseFrequency;
  const channelValue = numberValue(firstDefined(source, 'CHANNEL', 'channel'));
  const channel = channelValue !== null && Number.isInteger(channelValue) && channelValue > 0
    ? channelValue
    : null;
  const bssid = String(source.BSSID ?? source.bssid ?? '').trim().toLowerCase();

  return {
    observation: {
      bssid,
      latitude,
      longitude,
      signal,
      frequency,
      channel,
      authentication: normalizeAuthentication(firstDefined(source, 'AUTHENTICATION', 'authentication')),
      encryption: normalizeEncryption(firstDefined(source, 'ENCRYPTION', 'encryption')),
      radioType: normalizeRadioType(firstDefined(source, 'RADIO TYPE', 'RADIO_TYPE', 'radioType')),
    },
    rejection: null,
  };
}

function sortedRecord(counts) {
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  );
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function aggregateObservations(observations) {
  const bandCounts = Object.fromEntries(BAND_KEYS.map((key) => [key, 0]));
  const authenticationCounts = new Map();
  const encryptionCounts = new Map();
  const channelCounts = new Map();
  const identifiers = new Set();
  const signals = [];
  const rows = Array.isArray(observations) ? observations : [];

  for (const observation of rows) {
    if (!observation || typeof observation !== 'object') continue;

    const bssid = textValue(observation.bssid).toLowerCase();
    if (bssid) identifiers.add(bssid);

    const signal = numberValue(observation.signal);
    if (signal !== null && signal < 0) signals.push(signal);

    const frequency = numberValue(observation.frequency);
    bandCounts[bandForFrequency(frequency)] += 1;

    const authentication = AUTHENTICATION_LABELS.has(observation.authentication)
      ? observation.authentication
      : normalizeAuthentication(observation.authentication);
    authenticationCounts.set(
      authentication,
      (authenticationCounts.get(authentication) ?? 0) + 1,
    );

    const encryption = ENCRYPTION_LABELS.has(observation.encryption)
      ? observation.encryption
      : normalizeEncryption(observation.encryption);
    encryptionCounts.set(encryption, (encryptionCounts.get(encryption) ?? 0) + 1);

    const channel = numberValue(observation.channel);
    if (channel !== null && Number.isInteger(channel) && channel > 0) {
      channelCounts.set(channel, (channelCounts.get(channel) ?? 0) + 1);
    }
  }

  const topChannels = [...channelCounts.entries()]
    .sort(([leftChannel, leftCount], [rightChannel, rightCount]) =>
      rightCount - leftCount || leftChannel - rightChannel)
    .map(([channel, observationsCount]) => ({
      channel,
      observations: observationsCount,
    }));

  return {
    observationCount: rows.filter((observation) => observation && typeof observation === 'object').length,
    uniqueNetworkCount: identifiers.size,
    medianSignalDbm: median(signals),
    bandCounts,
    authenticationCounts: sortedRecord(authenticationCounts),
    encryptionCounts: sortedRecord(encryptionCounts),
    topChannels,
  };
}

function knownBandShares(bands) {
  const twoPointFour = Number.isFinite(Number(bands?.['2.4GHz']))
    ? Math.max(0, Number(bands['2.4GHz']))
    : 0;
  const five = Number.isFinite(Number(bands?.['5GHz']))
    ? Math.max(0, Number(bands['5GHz']))
    : 0;
  const denominator = twoPointFour + five;

  return denominator === 0
    ? { twoPointFour: null, five: null }
    : { twoPointFour: twoPointFour / denominator, five: five / denominator };
}

function parseCellCoordinates(cell) {
  if (cell && Number.isInteger(cell.row) && Number.isInteger(cell.col)) {
    return { row: cell.row, col: cell.col };
  }

  const match = /^(-?\d+)_(-?\d+)$/.exec(cell?.cellId ?? '');
  if (!match) throw new Error('Published cell has invalid lattice coordinates');
  return { row: Number(match[1]), col: Number(match[2]) };
}

function blockCellIds(row, col) {
  const cellIds = [];
  for (let currentRow = row; currentRow < row + 3; currentRow += 1) {
    for (let currentCol = col; currentCol < col + 3; currentCol += 1) {
      cellIds.push(`${currentRow}_${currentCol}`);
    }
  }
  return cellIds;
}

function createBlock(row, col, publishedCellIds) {
  const cellIds = blockCellIds(row, col);
  return {
    row,
    col,
    cellIds,
    publishedCellCount: cellIds.reduce(
      (count, cellId) => count + (publishedCellIds.has(cellId) ? 1 : 0),
      0,
    ),
  };
}

function rankBlocks(blocks, targetRow, targetCol) {
  return [...blocks].sort((left, right) => {
    const leftDistance = (left.row + 1.5 - targetRow) ** 2 + (left.col + 1.5 - targetCol) ** 2;
    const rightDistance = (right.row + 1.5 - targetRow) ** 2 + (right.col + 1.5 - targetCol) ** 2;
    return leftDistance - rightDistance || left.row - right.row || left.col - right.col;
  });
}

function blocksOverlap(left, right) {
  return Math.abs(left.row - right.row) < 3 && Math.abs(left.col - right.col) < 3;
}

function chooseBlockTriple(lists) {
  for (const west of lists[0]) {
    for (const center of lists[1]) {
      if (blocksOverlap(west, center)) continue;
      for (const east of lists[2]) {
        if (blocksOverlap(west, east) || blocksOverlap(center, east)) continue;
        return [west, center, east];
      }
    }
  }
  return null;
}

function selectPresetBlocks(publishedCells) {
  if (!Array.isArray(publishedCells) || publishedCells.length === 0) {
    throw new Error('Unable to select three non-overlapping preset blocks from published coverage');
  }

  const coordinates = publishedCells.map(parseCellCoordinates);
  const publishedCellIds = new Set(coordinates.map(({ row, col }) => `${row}_${col}`));
  const anchorIds = new Set();
  for (const { row, col } of coordinates) {
    for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
      for (let colOffset = 0; colOffset < 3; colOffset += 1) {
        anchorIds.add(`${row - rowOffset}_${col - colOffset}`);
      }
    }
  }

  const candidates = [...anchorIds]
    .map((cellId) => {
      const [row, col] = cellId.split('_').map(Number);
      return createBlock(row, col, publishedCellIds);
    })
    .sort((left, right) => left.row - right.row || left.col - right.col);

  const minRow = Math.min(...coordinates.map(({ row }) => row));
  const maxRow = Math.max(...coordinates.map(({ row }) => row));
  const minCol = Math.min(...coordinates.map(({ col }) => col));
  const maxCol = Math.max(...coordinates.map(({ col }) => col));
  const width = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;
  const targetRow = minRow + height / 2;
  const targetColumns = [
    minCol + width / 6,
    minCol + width / 2,
    minCol + (5 * width) / 6,
  ];
  const thirdBoundaries = [minCol + width / 3, minCol + (2 * width) / 3];

  const thirdIndex = (block) => {
    const centerCol = block.col + 1.5;
    if (centerCol < minCol || centerCol > maxCol + 1) return -1;
    if (centerCol < thirdBoundaries[0]) return 0;
    if (centerCol < thirdBoundaries[1]) return 1;
    return 2;
  };

  const longitudeCandidates = candidates.reduce((lists, block) => {
    const index = thirdIndex(block);
    if (index >= 0) lists[index].push(block);
    return lists;
  }, [[], [], []]);

  const tryLongitudeSelection = (minimumPublishedCells) => {
    const lists = longitudeCandidates.map((blocks, index) => rankBlocks(
      blocks.filter((block) => block.publishedCellCount >= minimumPublishedCells),
      targetRow,
      targetColumns[index],
    ));
    return chooseBlockTriple(lists);
  };

  for (const minimumPublishedCells of [5, 4, 3, 2, 1]) {
    const blocks = tryLongitudeSelection(minimumPublishedCells);
    if (blocks) {
      return {
        blocks,
        selection: {
          method: 'longitude-thirds',
          minimumPublishedCells,
          fallbackUsed: minimumPublishedCells < 5,
          reason: minimumPublishedCells === 5
            ? 'Selected one non-overlapping 3x3 block in each longitude third with at least five published cells.'
            : `Longitude-thirds selection required a coverage fallback to ${minimumPublishedCells} published cell${minimumPublishedCells === 1 ? '' : 's'} per block.`,
        },
      };
    }
  }

  const globalLists = targetColumns.map((targetCol) => rankBlocks(
    candidates.filter((block) => block.publishedCellCount >= 1),
    targetRow,
    targetCol,
  ));
  const globalBlocks = chooseBlockTriple(globalLists);
  if (!globalBlocks) {
    throw new Error('Unable to select three non-overlapping preset blocks from published coverage');
  }

  return {
    blocks: globalBlocks,
    selection: {
      method: 'global-spatial-fallback',
      minimumPublishedCells: 1,
      fallbackUsed: true,
      reason: 'No non-overlapping longitude-thirds selection met the coverage thresholds; used the global spatial fallback with at least one published cell per block.',
    },
  };
}

const SIGNAL_HISTOGRAM_BINS = [
  { label: '< -100 dBm', lower: -Infinity, upper: -100 },
  { label: '[-100,-90) dBm', lower: -100, upper: -90 },
  { label: '[-90,-80) dBm', lower: -90, upper: -80 },
  { label: '[-80,-70) dBm', lower: -80, upper: -70 },
  { label: '[-70,-60) dBm', lower: -70, upper: -60 },
  { label: '[-60,-50) dBm', lower: -60, upper: -50 },
  { label: '[-50,-40) dBm', lower: -50, upper: -40 },
  { label: '[-40,-30) dBm', lower: -40, upper: -30 },
  { label: '[-30,-20) dBm', lower: -30, upper: -20 },
  { label: '[-20,-10) dBm', lower: -20, upper: -10 },
  { label: '[-10,0) dBm', lower: -10, upper: 0 },
];

function signalHistogram(observations) {
  const counts = SIGNAL_HISTOGRAM_BINS.map(() => 0);
  for (const observation of observations) {
    const signal = numberValue(observation.signal);
    if (signal === null || signal >= 0) continue;
    const index = SIGNAL_HISTOGRAM_BINS.findIndex(({ lower, upper }) => signal >= lower && signal < upper);
    if (index >= 0) counts[index] += 1;
  }
  return SIGNAL_HISTOGRAM_BINS.map(({ label }, index) => ({
    label,
    observations: counts[index],
  }));
}

function radioTypeCounts(observations) {
  const counts = new Map();
  for (const observation of observations) {
    const radioType = RADIO_LABELS.has(observation.radioType)
      ? observation.radioType
      : 'Other / Unknown';
    counts.set(radioType, (counts.get(radioType) ?? 0) + 1);
  }
  return sortedRecord(counts);
}

function buildAreaBounds(row, col) {
  const southWest = cellGeometry(row, col).bounds;
  const northEast = cellGeometry(row + 2, col + 2).bounds;
  return {
    south: southWest.south,
    west: southWest.west,
    north: northEast.north,
    east: northEast.east,
  };
}

function buildSpatialData(rawRows) {
  const rows = Array.isArray(rawRows) ? rawRows : [];
  const acceptedObservations = [];
  const cellGroups = new Map();
  const rejectionCounts = { invalidCoordinates: 0, invalidSignal: 0 };

  for (const row of rows) {
    const result = normalizeRawRow(row);
    if (result.observation) {
      acceptedObservations.push(result.observation);
      const address = gridAddress(result.observation.latitude, result.observation.longitude);
      const observations = cellGroups.get(address.cellId) ?? [];
      observations.push(result.observation);
      cellGroups.set(address.cellId, observations);
    } else if (result.rejection) {
      rejectionCounts[result.rejection] += 1;
    }
  }

  const cellEntries = [...cellGroups.entries()]
    .map(([cellId, observations]) => {
      const [row, col] = cellId.split('_').map(Number);
      return { cellId, row, col, observations };
    })
    .sort((left, right) => left.row - right.row || left.col - right.col);
  const cellMetrics = new Map(
    cellEntries.map(({ cellId, observations }) => [cellId, aggregateObservations(observations)]),
  );
  const publishedEntries = cellEntries.filter(({ cellId }) =>
    cellMetrics.get(cellId).uniqueNetworkCount >= MIN_UNIQUE_NETWORKS_PER_CELL);
  const publishedCellIds = new Set(publishedEntries.map(({ cellId }) => cellId));
  const publishedCells = publishedEntries.map(({ cellId, row, col }) => ({
    cellId,
    row,
    col,
    ...cellGeometry(row, col),
    ...cellMetrics.get(cellId),
  }));

  const datasetMetrics = aggregateObservations(acceptedObservations);
  const summary = {
    schemaVersion: 1,
    sourceLabel: 'Chanthabuly historical survey dataset',
    historicalSurveyPeriod: 'Approximately November 2024 – March 2025',
    inputObservationCount: rows.length,
    rejectedObservationCount: rows.length - acceptedObservations.length,
    rejectionCounts,
    publishedCellCount: publishedCells.length,
    suppressedCellCount: cellEntries.length - publishedCells.length,
    ...datasetMetrics,
    signalHistogram: signalHistogram(acceptedObservations),
    radioTypeCounts: radioTypeCounts(acceptedObservations),
  };

  const selected = selectPresetBlocks(publishedCells);
  const areas = selected.blocks.map((block, index) => {
    const id = ['area-a', 'area-b', 'area-c'][index];
    const name = ['Area A', 'Area B', 'Area C'][index];
    const observations = block.cellIds.flatMap((cellId) => cellGroups.get(cellId) ?? []);
    return {
      id,
      name,
      dimensions: { rows: 3, cols: 3 },
      areaKm2Approx: 0.5625,
      cellIds: block.cellIds,
      bounds: buildAreaBounds(block.row, block.col),
      publishedCellCount: block.publishedCellCount,
      ...aggregateObservations(observations),
    };
  });

  const output = {
    grid: {
      metadata: {
        schemaVersion: 1,
        gridSizeMeters: GRID_SIZE_METERS,
        minimumUniqueNetworksPerCell: MIN_UNIQUE_NETWORKS_PER_CELL,
        referenceLatitude: REFERENCE_LATITUDE,
        metricDefinition: 'Published cells aggregate accepted observations and contain at least five unique normalized network identifiers.',
      },
      cells: publishedCells,
    },
    presets: {
      metadata: {
        schemaVersion: 1,
        selection: selected.selection,
      },
      areas,
    },
    summary,
  };

  validatePublicOutputs(output);
  return output;
}

const AGGREGATE_KEYS = [
  'observationCount',
  'uniqueNetworkCount',
  'medianSignalDbm',
  'bandCounts',
  'authenticationCounts',
  'encryptionCounts',
  'topChannels',
];

function assertExactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} has invalid schema keys`);
  }
}

function assertFiniteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
}

function validateCountRecord(value, label, allowedLabels = null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a count record`);
  }
  for (const [key, count] of Object.entries(value)) {
    if (!key || MAC_PATTERNS.some((pattern) => pattern.test(key)) ||
        /ssid|bssid|mac|hash|raw|timestamp|manufacturer|identifier/i.test(key)) {
      throw new Error(`${label} contains a forbidden key`);
    }
    if (allowedLabels && !allowedLabels.has(key)) {
      throw new Error(`${label} contains a category outside the allowlist`);
    }
    assertNonNegativeInteger(count, `${label}.${key}`);
  }
}

function countTotal(value) {
  return Object.values(value).reduce((total, count) => total + count, 0);
}

function assertClose(actual, expected, label) {
  if (Math.abs(actual - expected) > 1e-10) {
    throw new Error(`${label} is not on the fixed lattice`);
  }
}

function validateBounds(value, label) {
  assertExactKeys(value, ['south', 'west', 'north', 'east'], label);
  for (const key of ['south', 'west', 'north', 'east']) assertFiniteNumber(value[key], `${label}.${key}`);
  if (value.south >= value.north || value.west >= value.east) {
    throw new Error(`${label} must have positive dimensions`);
  }
}

function validateAggregateMetrics(value, label) {
  assertNonNegativeInteger(value.observationCount, `${label}.observationCount`);
  assertNonNegativeInteger(value.uniqueNetworkCount, `${label}.uniqueNetworkCount`);
  if (value.uniqueNetworkCount > value.observationCount) {
    throw new Error(`${label}.uniqueNetworkCount cannot exceed observationCount`);
  }
  if (value.medianSignalDbm !== null) {
    assertFiniteNumber(value.medianSignalDbm, `${label}.medianSignalDbm`);
    if (value.medianSignalDbm >= 0) throw new Error(`${label}.medianSignalDbm must be negative`);
  }
  assertExactKeys(value.bandCounts, BAND_KEYS, `${label}.bandCounts`);
  for (const key of BAND_KEYS) assertNonNegativeInteger(value.bandCounts[key], `${label}.bandCounts.${key}`);
  if (countTotal(value.bandCounts) !== value.observationCount) {
    throw new Error(`${label}.bandCounts must partition observationCount`);
  }
  validateCountRecord(value.authenticationCounts, `${label}.authenticationCounts`, PUBLIC_AUTHENTICATION_LABELS);
  if (countTotal(value.authenticationCounts) !== value.observationCount) {
    throw new Error(`${label}.authenticationCounts must partition observationCount`);
  }
  validateCountRecord(value.encryptionCounts, `${label}.encryptionCounts`, PUBLIC_ENCRYPTION_LABELS);
  if (countTotal(value.encryptionCounts) !== value.observationCount) {
    throw new Error(`${label}.encryptionCounts must partition observationCount`);
  }
  if (!Array.isArray(value.topChannels)) throw new Error(`${label}.topChannels must be an array`);
  for (const [index, channel] of value.topChannels.entries()) {
    assertExactKeys(channel, ['channel', 'observations'], `${label}.topChannels[${index}]`);
    if (!Number.isInteger(channel.channel) || channel.channel <= 0) {
      throw new Error(`${label}.topChannels[${index}].channel must be positive`);
    }
    assertNonNegativeInteger(channel.observations, `${label}.topChannels[${index}].observations`);
    if (channel.observations > value.observationCount) {
      throw new Error(`${label}.topChannels observations cannot exceed observationCount`);
    }
  }
}

function scanForPrivacyViolations(value) {
  if (typeof value === 'string') {
    if (MAC_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error('Public output contains a MAC-like identifier');
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (MAC_PATTERNS.some((pattern) => pattern.test(key)) ||
        /ssid|bssid|mac|hash|rawrow|timestamp|observedat|manufacturer|identifier/i.test(key)) {
      throw new Error('Public output contains a forbidden identifier field');
    }
    scanForPrivacyViolations(child);
  }
}

function validatePublicOutputs(outputs) {
  const { grid, presets, summary } = outputs ?? {};
  assertExactKeys(grid, ['metadata', 'cells'], 'grid');
  assertExactKeys(grid.metadata, [
    'schemaVersion',
    'gridSizeMeters',
    'minimumUniqueNetworksPerCell',
    'referenceLatitude',
    'metricDefinition',
  ], 'grid.metadata');
  if (grid.metadata.schemaVersion !== 1 || grid.metadata.gridSizeMeters !== GRID_SIZE_METERS ||
      grid.metadata.minimumUniqueNetworksPerCell !== MIN_UNIQUE_NETWORKS_PER_CELL ||
      grid.metadata.referenceLatitude !== REFERENCE_LATITUDE ||
      typeof grid.metadata.metricDefinition !== 'string') {
    throw new Error('grid.metadata does not match the spatial contract');
  }
  if (!Array.isArray(grid.cells)) throw new Error('grid.cells must be an array');
  const gridCellIds = new Set();
  for (const [index, cell] of grid.cells.entries()) {
    assertExactKeys(cell, [...AGGREGATE_KEYS, 'cellId', 'row', 'col', 'bounds', 'center'], `grid.cells[${index}]`);
    if (typeof cell.cellId !== 'string' || gridCellIds.has(cell.cellId)) throw new Error('grid cell IDs must be unique');
    gridCellIds.add(cell.cellId);
    if (!Number.isInteger(cell.row) || !Number.isInteger(cell.col) || cell.cellId !== `${cell.row}_${cell.col}`) {
      throw new Error('grid cell lattice coordinates are invalid');
    }
    validateBounds(cell.bounds, `grid.cells[${index}].bounds`);
    assertExactKeys(cell.center, ['lat', 'lng'], `grid.cells[${index}].center`);
    assertFiniteNumber(cell.center.lat, `grid.cells[${index}].center.lat`);
    assertFiniteNumber(cell.center.lng, `grid.cells[${index}].center.lng`);
    const expectedGeometry = cellGeometry(cell.row, cell.col);
    for (const key of ['south', 'west', 'north', 'east']) {
      assertClose(cell.bounds[key], expectedGeometry.bounds[key], `grid.cells[${index}].bounds.${key}`);
    }
    assertClose(cell.center.lat, expectedGeometry.center.lat, `grid.cells[${index}].center.lat`);
    assertClose(cell.center.lng, expectedGeometry.center.lng, `grid.cells[${index}].center.lng`);
    validateAggregateMetrics(cell, `grid.cells[${index}]`);
    if (cell.uniqueNetworkCount < MIN_UNIQUE_NETWORKS_PER_CELL) {
      throw new Error('grid cell does not meet the suppression threshold');
    }
  }

  assertExactKeys(presets, ['metadata', 'areas'], 'presets');
  assertExactKeys(presets.metadata, ['schemaVersion', 'selection'], 'presets.metadata');
  if (presets.metadata.schemaVersion !== 1) throw new Error('preset schema version is invalid');
  assertExactKeys(presets.metadata.selection, [
    'method',
    'minimumPublishedCells',
    'fallbackUsed',
    'reason',
  ], 'presets.metadata.selection');
  const selection = presets.metadata.selection;
  if (!['longitude-thirds', 'global-spatial-fallback'].includes(selection.method) ||
      !Number.isInteger(selection.minimumPublishedCells) || selection.minimumPublishedCells < 1 ||
      selection.minimumPublishedCells > MIN_UNIQUE_NETWORKS_PER_CELL ||
      typeof selection.fallbackUsed !== 'boolean' || typeof selection.reason !== 'string' || !selection.reason) {
    throw new Error('preset selection metadata is invalid');
  }
  if (!Array.isArray(presets.areas) || presets.areas.length !== 3) {
    throw new Error('exactly three preset areas are required');
  }
  const expectedAreaIds = ['area-a', 'area-b', 'area-c'];
  const presetCellIds = new Set();
  for (const [index, area] of presets.areas.entries()) {
    assertExactKeys(area, [...AGGREGATE_KEYS, 'id', 'name', 'dimensions', 'areaKm2Approx', 'cellIds', 'bounds', 'publishedCellCount'], `presets.areas[${index}]`);
    if (area.id !== expectedAreaIds[index] || area.name !== `Area ${String.fromCharCode(65 + index)}`) {
      throw new Error('preset area IDs or names are invalid');
    }
    assertExactKeys(area.dimensions, ['rows', 'cols'], `presets.areas[${index}].dimensions`);
    if (area.dimensions.rows !== 3 || area.dimensions.cols !== 3 || area.areaKm2Approx !== 0.5625) {
      throw new Error('preset dimensions are invalid');
    }
    if (!Array.isArray(area.cellIds) || area.cellIds.length !== 9 || new Set(area.cellIds).size !== 9) {
      throw new Error('preset areas must contain nine unique cells');
    }
    for (const cellId of area.cellIds) {
      if (presetCellIds.has(cellId)) throw new Error('preset areas must not overlap');
      presetCellIds.add(cellId);
    }
    const areaCoordinates = area.cellIds.map((cellId) => parseCellCoordinates({ cellId }));
    const minAreaRow = Math.min(...areaCoordinates.map(({ row }) => row));
    const minAreaCol = Math.min(...areaCoordinates.map(({ col }) => col));
    const expectedIds = blockCellIds(minAreaRow, minAreaCol);
    if (JSON.stringify(area.cellIds) !== JSON.stringify(expectedIds)) {
      throw new Error('preset cells must form a sorted 3x3 block');
    }
    validateBounds(area.bounds, `presets.areas[${index}].bounds`);
    const expectedBounds = buildAreaBounds(minAreaRow, minAreaCol);
    for (const key of ['south', 'west', 'north', 'east']) {
      assertClose(area.bounds[key], expectedBounds[key], `presets.areas[${index}].bounds.${key}`);
    }
    assertNonNegativeInteger(area.publishedCellCount, `presets.areas[${index}].publishedCellCount`);
    if (area.publishedCellCount > 9 || area.publishedCellCount < selection.minimumPublishedCells) {
      throw new Error('preset published coverage is invalid');
    }
    const derivedPublishedCount = area.cellIds.filter((cellId) => gridCellIds.has(cellId)).length;
    if (area.publishedCellCount !== derivedPublishedCount) throw new Error('preset coverage does not match grid cells');
    validateAggregateMetrics(area, `presets.areas[${index}]`);
  }

  assertExactKeys(summary, [
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
  ], 'summary');
  if (summary.schemaVersion !== 1 || typeof summary.sourceLabel !== 'string' ||
      typeof summary.historicalSurveyPeriod !== 'string') throw new Error('summary metadata is invalid');
  assertNonNegativeInteger(summary.inputObservationCount, 'summary.inputObservationCount');
  assertNonNegativeInteger(summary.rejectedObservationCount, 'summary.rejectedObservationCount');
  if (summary.observationCount + summary.rejectedObservationCount !== summary.inputObservationCount) {
    throw new Error('summary accepted and rejected counts do not add up');
  }
  assertExactKeys(summary.rejectionCounts, ['invalidCoordinates', 'invalidSignal'], 'summary.rejectionCounts');
  assertNonNegativeInteger(summary.rejectionCounts.invalidCoordinates, 'summary.rejectionCounts.invalidCoordinates');
  assertNonNegativeInteger(summary.rejectionCounts.invalidSignal, 'summary.rejectionCounts.invalidSignal');
  if (summary.rejectedObservationCount !== summary.rejectionCounts.invalidCoordinates + summary.rejectionCounts.invalidSignal) {
    throw new Error('summary rejection counts do not add up');
  }
  assertNonNegativeInteger(summary.publishedCellCount, 'summary.publishedCellCount');
  assertNonNegativeInteger(summary.suppressedCellCount, 'summary.suppressedCellCount');
  if (summary.publishedCellCount !== grid.cells.length) throw new Error('summary published count does not match grid');
  if (!Array.isArray(summary.signalHistogram) || summary.signalHistogram.length !== SIGNAL_HISTOGRAM_BINS.length) {
    throw new Error('summary signal histogram is invalid');
  }
  for (const [index, bin] of summary.signalHistogram.entries()) {
    assertExactKeys(bin, ['label', 'observations'], `summary.signalHistogram[${index}]`);
    if (bin.label !== SIGNAL_HISTOGRAM_BINS[index].label) throw new Error('summary signal histogram labels are invalid');
    assertNonNegativeInteger(bin.observations, `summary.signalHistogram[${index}].observations`);
  }
  validateCountRecord(summary.radioTypeCounts, 'summary.radioTypeCounts', PUBLIC_RADIO_LABELS);
  const histogramCount = summary.signalHistogram.reduce((total, bin) => total + bin.observations, 0);
  if (histogramCount !== summary.observationCount) {
    throw new Error('summary signal histogram must partition observationCount');
  }
  if (countTotal(summary.radioTypeCounts) !== summary.observationCount) {
    throw new Error('summary radioTypeCounts must partition observationCount');
  }
  validateAggregateMetrics(summary, 'summary');
  scanForPrivacyViolations(outputs);
}

module.exports = {
  GRID_SIZE_METERS,
  MIN_UNIQUE_NETWORKS_PER_CELL,
  REFERENCE_LATITUDE,
  LAT_STEP,
  LNG_STEP,
  gridAddress,
  cellGeometry,
  normalizeRawRow,
  aggregateObservations,
  knownBandShares,
  selectPresetBlocks,
  buildSpatialData,
  validatePublicOutputs,
};
