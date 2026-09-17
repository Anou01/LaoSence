const { test } = require('node:test');
const assert = require('node:assert/strict');

const spatial = require('../scripts/lib/spatial.cjs');

function fixture(row, col, id = 'network', signal = -60, frequency = 2412) {
  const { center } = spatial.cellGeometry(row, col);
  return {
    BSSID: id,
    latitude: String(center.lat),
    longitude: String(center.lng),
    signal: String(signal),
    frequency: String(frequency),
    CHANNEL: '1',
    AUTHENTICATION: 'WPA2-Personal',
    ENCRYPTION: 'CCMP',
    RADIO_TYPE: '802.11n',
  };
}

function accepted(row) {
  const result = spatial.normalizeRawRow(row);
  assert.equal(result.rejection, null);
  assert.ok(result.observation);
  return result.observation;
}

function cellRows(row, col, ids, signal = -60, frequency = 2412) {
  return ids.map((id) => fixture(row, col, id, signal, frequency));
}

function areaRows(anchorCol, prefix) {
  const rows = [];
  for (let row = 8000; row <= 8002; row += 1) {
    for (let col = anchorCol; col <= anchorCol + 2; col += 1) {
      const isLeftCell = row === 8000 && col === anchorCol;
      const isRightCell = row === 8000 && col === anchorCol + 1;
      const ids = Array.from({ length: 5 }, (_, index) => `${prefix}-${row}-${col}-${index}`);
      if (prefix === 'area-a' && (isLeftCell || isRightCell)) ids[0] = `${prefix}-shared`;

      if (prefix === 'area-a' && isLeftCell) {
        rows.push(...cellRows(row, col, ids, -90));
      } else if (prefix === 'area-a' && isRightCell) {
        rows.push(...cellRows(row, col, [
          ...ids,
          `${prefix}-${row}-${col}-0`,
          `${prefix}-${row}-${col}-1`,
          `${prefix}-${row}-${col}-2`,
          `${prefix}-${row}-${col}-3`,
        ], -40));
      } else {
        rows.push(...cellRows(row, col, ids));
      }
    }
  }
  return rows;
}

function threeAreaRows() {
  return [
    ...areaRows(43000, 'area-a'),
    ...areaRows(43003, 'area-b'),
    ...areaRows(43006, 'area-c'),
    ...cellRows(8000, 43009, ['suppressed-0', 'suppressed-1', 'suppressed-2', 'suppressed-3']),
  ];
}

function publishedCell(row, col) {
  return { row, col, cellId: `${row}_${col}` };
}

test('address is stable and uses an independent lattice origin', () => {
  const { center } = spatial.cellGeometry(8000, 43000);

  assert.deepEqual(spatial.gridAddress(center.lat, center.lng), {
    row: 8000,
    col: 43000,
    cellId: '8000_43000',
  });
});

test('unknown frequencies are excluded from the known-band denominator', () => {
  assert.deepEqual(spatial.knownBandShares({ '2.4GHz': 2, '5GHz': 6, otherUnknown: 92 }), {
    twoPointFour: 0.25,
    five: 0.75,
  });
  assert.deepEqual(spatial.knownBandShares({ '2.4GHz': 0, '5GHz': 0, otherUnknown: 3 }), {
    twoPointFour: null,
    five: null,
  });
});

test('normalization accepts lowercase negative signal only and checks coordinates first', () => {
  const lowerSignalWins = spatial.normalizeRawRow({
    ...fixture(8000, 43000),
    signal: '-65',
    SIGNAL: '84',
  });
  assert.equal(lowerSignalWins.rejection, null);
  assert.equal(lowerSignalWins.observation.signal, -65);

  const uppercaseOnly = spatial.normalizeRawRow({
    ...fixture(8000, 43000),
    signal: undefined,
    SIGNAL: '-65',
  });
  assert.equal(uppercaseOnly.observation, null);
  assert.equal(uppercaseOnly.rejection, 'invalidSignal');

  for (const invalidSignal of [undefined, null, '', '0', '-0', '1', 'Infinity', '-Infinity']) {
    const result = spatial.normalizeRawRow({ ...fixture(8000, 43000), signal: invalidSignal });
    assert.equal(result.observation, null, `signal ${String(invalidSignal)} should be rejected`);
    assert.equal(result.rejection, 'invalidSignal');
  }

  const invalidCoordinatesFirst = spatial.normalizeRawRow({
    ...fixture(8000, 43000),
    latitude: 'not-a-number',
    signal: 'not-a-number',
  });
  assert.equal(invalidCoordinatesFirst.observation, null);
  assert.equal(invalidCoordinatesFirst.rejection, 'invalidCoordinates');
});

test('normalization trims and lowercases BSSID and preserves supported aliases', () => {
  const result = spatial.normalizeRawRow({
    ...fixture(8000, 43000),
    BSSID: '  MiXeD-Network  ',
    bssid: 'ignored-lower-priority-value',
    frequency: '',
    FREQUENCY: '5180',
    AUTHENTICATION: ' owe ',
    ENCRYPTION: 'ccmp+tkip',
    'RADIO TYPE': ' 802.11ax ',
    CHANNEL: '36',
  });

  assert.equal(result.rejection, null);
  const { center } = spatial.cellGeometry(8000, 43000);
  assert.deepEqual(result.observation, {
    bssid: 'mixed-network',
    latitude: center.lat,
    longitude: center.lng,
    signal: -60,
    frequency: 5180,
    channel: 36,
    authentication: 'OWE',
    encryption: 'TKIP+CCMP',
    radioType: '802.11ax',
  });

  const lowerFrequencyWins = accepted({
    ...fixture(8000, 43000),
    frequency: '2412',
    FREQUENCY: '5180',
  });
  assert.equal(lowerFrequencyWins.frequency, 2412);
});

test('rejects unusable coordinates and does not use uppercase coordinate aliases', () => {
  const invalidCoordinates = [
    { latitude: '', longitude: '102' },
    { latitude: 'not-a-number', longitude: '102' },
    { latitude: '91', longitude: '102' },
    { latitude: '18', longitude: '181' },
    { latitude: '0', longitude: '0' },
  ];

  for (const coordinates of invalidCoordinates) {
    const result = spatial.normalizeRawRow({
      ...fixture(8000, 43000),
      ...coordinates,
      signal: '-60',
    });
    assert.equal(result.observation, null);
    assert.equal(result.rejection, 'invalidCoordinates');
  }

  const uppercaseOnly = spatial.normalizeRawRow({
    ...fixture(8000, 43000),
    latitude: undefined,
    longitude: undefined,
    LATITUDE: '18',
    LONGITUDE: '102',
  });
  assert.equal(uppercaseOnly.observation, null);
  assert.equal(uppercaseOnly.rejection, 'invalidCoordinates');
});

test('aggregation separates observations from trimmed case-insensitive identifiers', () => {
  const observations = [
    accepted({ ...fixture(8000, 43000, ' AA ', -90, 2412), CHANNEL: '6', AUTHENTICATION: 'Open', ENCRYPTION: 'WEP', RADIO_TYPE: '802.11a' }),
    accepted({ ...fixture(8000, 43000, 'aa', -80, 5180), CHANNEL: '1', AUTHENTICATION: 'OWE', ENCRYPTION: 'AES', RADIO_TYPE: '802.11ac' }),
    accepted({ ...fixture(8000, 43000, '', -50, 7000), CHANNEL: '6', AUTHENTICATION: 'WPA2-Personal', ENCRYPTION: 'None', RADIO_TYPE: '802.11n' }),
    accepted({ ...fixture(8000, 43000, ' bb ', -40, 5180), CHANNEL: '11', AUTHENTICATION: 'WPA3-Enterprise', ENCRYPTION: 'GCMP', RADIO_TYPE: '802.11ax' }),
  ];

  assert.deepEqual(spatial.aggregateObservations(observations), {
    observationCount: 4,
    uniqueNetworkCount: 2,
    medianSignalDbm: -65,
    bandCounts: { '2.4GHz': 1, '5GHz': 2, otherUnknown: 1 },
    authenticationCounts: {
      OWE: 1,
      Open: 1,
      'WPA2 Personal': 1,
      'WPA3 Enterprise': 1,
    },
    encryptionCounts: {
      AES: 1,
      GCMP: 1,
      None: 1,
      WEP: 1,
    },
    topChannels: [
      { channel: 6, observations: 2 },
      { channel: 1, observations: 1 },
      { channel: 11, observations: 1 },
    ],
  });
});

test('omits unknown or non-positive channels while retaining observations', () => {
  const observations = [
    accepted({ ...fixture(8000, 43000, 'unknown-channel'), CHANNEL: 'unknown' }),
    accepted({ ...fixture(8000, 43000, 'zero-channel'), CHANNEL: '0' }),
    accepted({ ...fixture(8000, 43000, 'valid-channel'), CHANNEL: '36' }),
  ];

  assert.equal(spatial.aggregateObservations(observations).observationCount, 3);
  assert.deepEqual(spatial.aggregateObservations(observations).topChannels, [
    { channel: 36, observations: 1 },
  ]);
});

test('empty aggregation has zero counts and no median', () => {
  assert.deepEqual(spatial.aggregateObservations([]), {
    observationCount: 0,
    uniqueNetworkCount: 0,
    medianSignalDbm: null,
    bandCounts: { '2.4GHz': 0, '5GHz': 0, otherUnknown: 0 },
    authenticationCounts: {},
    encryptionCounts: {},
    topChannels: [],
  });
});

test('suppresses occupied cells with fewer than five unique identifiers', () => {
  const data = spatial.buildSpatialData(threeAreaRows());

  assert.equal(data.grid.cells.length, 27);
  assert.equal(data.summary.publishedCellCount, 27);
  assert.equal(data.summary.suppressedCellCount, 1);
  assert.equal(data.summary.rejectedObservationCount, 0);
  assert.equal(data.grid.cells.every((cell) => cell.uniqueNetworkCount >= 5), true);
});

test('selects equal-size non-overlapping A/B/C blocks deterministically', () => {
  const publishedCells = [];
  for (const anchorCol of [43000, 43003, 43006]) {
    for (let row = 8000; row <= 8002; row += 1) {
      for (let col = anchorCol; col <= anchorCol + 2; col += 1) {
        publishedCells.push(publishedCell(row, col));
      }
    }
  }

  const first = spatial.selectPresetBlocks(publishedCells);
  const reversed = spatial.selectPresetBlocks([...publishedCells].reverse());

  assert.equal(first.blocks.length, 3);
  assert.equal(first.selection.method, 'longitude-thirds');
  assert.equal(first.selection.minimumPublishedCells, 5);
  assert.equal(first.selection.fallbackUsed, false);
  assert.deepEqual(first, reversed);

  const allIds = first.blocks.flatMap((block) => {
    assert.equal(block.cellIds.length, 9);
    assert.equal(block.publishedCellCount, 9);
    return block.cellIds;
  });
  assert.equal(new Set(allIds).size, 27);
});

test('uses documented longitude fallback for narrow coverage', () => {
  const result = spatial.selectPresetBlocks([
    publishedCell(8000, 43000),
    publishedCell(8000, 43003),
    publishedCell(8000, 43006),
  ]);

  assert.equal(result.selection.method, 'longitude-thirds');
  assert.equal(result.selection.minimumPublishedCells, 1);
  assert.equal(result.selection.fallbackUsed, true);
  assert.match(result.selection.reason, /coverage/i);
});

test('fails explicitly when three disjoint blocks cannot be selected', () => {
  assert.throws(
    () => spatial.selectPresetBlocks([publishedCell(8000, 43000)]),
    /three non-overlapping preset blocks/i,
  );
});

test('preset and dataset counts deduplicate identifiers across their full raw scope', () => {
  const raw = threeAreaRows();
  const data = spatial.buildSpatialData(raw);
  const areaA = data.presets.areas.find((area) => area.id === 'area-a');

  assert.ok(areaA);
  const areaACellUniqueSum = data.grid.cells
    .filter((cell) => areaA.cellIds.includes(cell.cellId))
    .reduce((total, cell) => total + cell.uniqueNetworkCount, 0);
  assert.ok(areaA.uniqueNetworkCount < areaACellUniqueSum);

  const publishedCellUniqueSum = data.grid.cells
    .reduce((total, cell) => total + cell.uniqueNetworkCount, 0);
  const occupiedCellGroups = new Map();
  for (const row of raw) {
    const normalized = spatial.normalizeRawRow(row);
    if (!normalized.observation) continue;
    const address = spatial.gridAddress(normalized.observation.latitude, normalized.observation.longitude);
    const group = occupiedCellGroups.get(address.cellId) ?? [];
    group.push(normalized.observation);
    occupiedCellGroups.set(address.cellId, group);
  }
  const occupiedCellUniqueSum = [...occupiedCellGroups.values()]
    .reduce((total, observations) => total + spatial.aggregateObservations(observations).uniqueNetworkCount, 0);
  assert.equal(data.summary.uniqueNetworkCount, spatial.aggregateObservations(
    [...occupiedCellGroups.values()].flat(),
  ).uniqueNetworkCount);
  assert.notEqual(data.summary.uniqueNetworkCount, publishedCellUniqueSum);
  assert.ok(data.summary.uniqueNetworkCount < occupiedCellUniqueSum);
});

test('preset median uses raw observations rather than averaging cell medians', () => {
  const raw = threeAreaRows();
  const data = spatial.buildSpatialData(raw);
  const areaA = data.presets.areas.find((area) => area.id === 'area-a');
  assert.ok(areaA);

  const observationsByCell = new Map();
  for (const row of raw) {
    const normalized = spatial.normalizeRawRow(row);
    if (normalized.observation) {
      const address = spatial.gridAddress(
        normalized.observation.latitude,
        normalized.observation.longitude,
      );
      const list = observationsByCell.get(address.cellId) ?? [];
      list.push(normalized.observation);
      observationsByCell.set(address.cellId, list);
    }
  }
  const areaObservations = areaA.cellIds.flatMap((cellId) => observationsByCell.get(cellId) ?? []);
  const expected = spatial.aggregateObservations(areaObservations).medianSignalDbm;
  const cellMedianMean = areaA.cellIds
    .map((cellId) => spatial.aggregateObservations(observationsByCell.get(cellId) ?? []).medianSignalDbm)
    .filter((value) => value !== null)
    .reduce((total, value, _, values) => total + value / values.length, 0);

  assert.equal(areaA.medianSignalDbm, expected);
  assert.notEqual(areaA.medianSignalDbm, cellMedianMean);
});

test('buildSpatialData is stable when raw input order is reversed', () => {
  const raw = threeAreaRows();
  assert.deepEqual(spatial.buildSpatialData(raw), spatial.buildSpatialData([...raw].reverse()));
});

test('CLI requires exactly one input and output argument', () => {
  const { parseArguments } = require('../scripts/generate-demo-data.cjs');

  assert.deepEqual(parseArguments(['--input', 'input.csv', '--out', 'public/data']), {
    input: 'input.csv',
    out: 'public/data',
  });
  for (const args of [
    [],
    ['--input', 'input.csv'],
    ['--out', 'public/data'],
    ['--input', 'input.csv', '--out', 'public/data', '--unknown'],
    ['--input', 'one.csv', '--input', 'two.csv', '--out', 'public/data'],
  ]) {
    assert.throws(() => parseArguments(args), /input|out|unknown|duplicate/i);
  }
});
