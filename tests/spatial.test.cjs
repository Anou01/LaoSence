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
