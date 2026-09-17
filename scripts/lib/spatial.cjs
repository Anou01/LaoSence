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
};
