const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadTypescript(file) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (specifier) => specifier === '@/type/wifi'
    ? loadTypescript('src/type/wifi.ts')
    : originalRequire(specifier);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

test('normalizes schema variants without fabricating signal or accepting invalid GPS', () => {
  const { normalizeWiFiRow } = loadTypescript('src/utils/csvParser.ts');
  const row = normalizeWiFiRow({
    SSID: ' Cafe ', BSSID: ' AA:BB ', MANUFACTURER: ' Vendor ',
    AUTHENTICATION: ' OWE ', ENCRYPTION: ' CCMP ', RADIO_TYPE: '802.11ax',
    CHANNEL: '36', latitude: '17.98', longitude: '102.61',
    LATITUDE: '0', LONGITUDE: '0', SIGNAL: '84', signal: '-65', frequency: '5180',
  });
  assert.deepEqual(row, {
    ssid: 'Cafe', bssid: 'AA:BB', manufacturer: 'Vendor',
    authentication: 'OWE', encryption: 'CCMP', radioType: '802.11ax',
    channel: 36, latitude: 17.98, longitude: 102.61, signal: -65,
    frequency: 5180, observedAt: null,
  });
  assert.equal(normalizeWiFiRow({ latitude: '91', longitude: '102' }), null);
  assert.equal(normalizeWiFiRow({ latitude: '0', longitude: '0' }), null);
  assert.equal(normalizeWiFiRow({ latitude: '18', longitude: '102', SIGNAL: '70' }).signal, null);
});

test('counts observations and case-insensitive unique BSSIDs separately', () => {
  const { getObservationMetrics } = loadTypescript('src/utils/analysisUtils.ts');
  const data = [{ bssid: ' AA ' }, { bssid: 'aa' }, { bssid: 'bb' }, { bssid: '' }];
  assert.deepEqual(getObservationMetrics(data), { observationCount: 4, uniqueBssidCount: 2 });
});

test('uses recorded dBm, frequency, authentication, and top channels', () => {
  const analysis = loadTypescript('src/utils/analysisUtils.ts');
  const data = [
    { signal: -65, frequency: 5180, authentication: 'OWE', channel: 36 },
    { signal: -65, frequency: 2412, authentication: 'Open', channel: 36 },
    { signal: null, frequency: null, authentication: 'WPA2-Personal', channel: 1 },
  ];
  assert.equal(analysis.getSignalStrengthHistogram(data).find(x => x.bin === '-70 to -60 dBm').count, 2);
  assert.deepEqual(analysis.getFrequencyDistribution(data), [
    { band: '2.4 GHz', count: 1 }, { band: '5 GHz', count: 1 },
    { band: 'Other / Unknown', count: 1 },
  ]);
  assert.equal(analysis.getAuthenticationDistribution(data).find(x => x.method === 'OWE').count, 1);
  assert.deepEqual(analysis.getChannelDistribution(data, 1), [{ bin: '36', count: 2 }]);
});

test('encryption distribution reports observation counts', () => {
  const { getEncryptionDistribution } = loadTypescript('src/utils/analysisUtils.ts');
  assert.deepEqual(getEncryptionDistribution([
    { encryption: 'CCMP' }, { encryption: 'CCMP' }, { encryption: 'TKIP' },
  ]), [
    { browser: 'CCMP', observations: 2 },
    { browser: 'TKIP', observations: 1 },
  ]);
});

test('loads the primary survey as observations with measured signals', async () => {
  const { loadCSVFromPath } = loadTypescript('src/utils/csvParser.ts');
  const { getObservationMetrics } = loadTypescript('src/utils/analysisUtils.ts');
  const { PRIMARY_DATASET } = loadTypescript('src/constants/dataset.ts');
  const csv = [
    'SSID,BSSID,latitude,longitude,signal,frequency,AUTHENTICATION',
    'Synthetic One,TEST-A,18,102,-65,2412,OWE',
    'Synthetic Two,test-a,18.001,102.001,-75,5180,Open',
    'Synthetic Three,TEST-B,18.002,102.002,,2412,WPA2-Personal',
  ].join('\n');
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.equal(url, '/CSV_FILE/Chanthabuly%20merge%20all%20zone.csv');
    return { ok: true, text: async () => csv };
  };
  try {
    const data = await loadCSVFromPath(PRIMARY_DATASET);
    assert.deepEqual(getObservationMetrics(data), { observationCount: 3, uniqueBssidCount: 2 });
    assert.equal(data.some(row => row.signal !== null && row.signal > 0), false);
    assert.equal(data.filter(row => row.signal === null).length, 1);
    assert.equal(data.every(row => row.latitude !== 0 && row.longitude !== 0), true);
  } finally {
    global.fetch = originalFetch;
  }
});
