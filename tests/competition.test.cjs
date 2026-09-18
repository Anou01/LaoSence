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
  loaded.require = (specifier) => specifier === '@/utils/analyzeWiFiData'
    ? loadTypescript('src/utils/analyzeWiFiData.ts')
    : originalRequire(specifier);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const LAT_STEP = 250 / 111320;
const LNG_STEP = 250 / (111320 * Math.cos(18 * Math.PI / 180));

function observation(row, col, bssid, signal = -60) {
  return {
    ssid: '', bssid, manufacturer: '', authentication: 'WPA2-Personal',
    encryption: 'CCMP', radioType: '802.11n', channel: 6,
    latitude: (row + 0.5) * LAT_STEP,
    longitude: (col + 0.5) * LNG_STEP,
    signal, frequency: 2412, observedAt: null,
  };
}

function threeBlocks() {
  const data = [];
  for (const anchor of [43000, 43004, 43008]) {
    for (let offset = 0; offset < 9; offset++) {
      const row = 8000 + Math.floor(offset / 3);
      const col = anchor + offset % 3;
      for (let id = 0; id < 5; id++) {
        const shared = anchor === 43000 && offset < 2 && id === 0;
        data.push(observation(row, col, shared ? 'aa:aa:aa:aa:aa:aa' : `${anchor}-${offset}-${id}`,
          anchor === 43000 ? (offset === 0 ? -40 : -90) : -60));
      }
      if (anchor === 43000 && offset === 0) {
        for (let extra = 0; extra < 40; extra++) {
          data.push(observation(row, col, `${anchor}-${offset}-${(extra % 4) + 1}`, -40));
        }
      }
    }
  }
  return data;
}

test('area metrics deduplicate the same BSSID observed in different cells', () => {
  const { computeAreaMetrics } = loadTypescript('src/utils/analyzeWiFiData.ts');
  const data = [observation(8000, 43000, 'aa:aa:aa:aa:aa:aa'), observation(8000, 43001, 'AA:AA:AA:AA:AA:AA')];
  const metrics = computeAreaMetrics(data, {
    south: 8000 * LAT_STEP, north: 8003 * LAT_STEP,
    west: 43000 * LNG_STEP, east: 43003 * LNG_STEP,
  });
  assert.equal(metrics.uniqueNetworkCount, 1);
  assert.equal(metrics.observationCount, 2);
});

test('preset Area A deduplicates across cells and uses the raw signal median', () => {
  const { computeGridCells } = loadTypescript('src/utils/analyzeWiFiData.ts');
  const { buildPresetAreas } = loadTypescript('src/utils/buildPresetAreas.ts');
  const data = threeBlocks();
  const areas = buildPresetAreas(computeGridCells(data), data);
  assert.deepEqual(areas.map((area) => area.name), ['Area A', 'Area B', 'Area C']);
  assert.equal(areas[0].cellIds[0], '8000_43000');
  assert.equal(areas[0].uniqueNetworkCount, 44);
  assert.equal(areas[0].observationCount, 85);
  assert.equal(areas[0].medianSignalDbm, -40);
  assert.deepEqual(areas[0].bandCounts, { '2.4GHz': 85, '5GHz': 0, otherUnknown: 0 });
  assert.equal(areas[0].authenticationCounts['WPA2 Personal'], 85);
  assert.equal(areas[0].encryptionCounts.CCMP, 85);
  assert.deepEqual(areas[0].topChannels, [{ channel: 6, observations: 85 }]);
  assert.equal(areas[0].areaKm2Approx, 0.5625);
  assert.equal(areas[0].cellIds.length, 9);
});

test('comparison insights report only surveyed indicators and at most three differences', () => {
  const { generateCompareInsights } = loadTypescript('src/utils/analyzeWiFiData.ts');
  const area = (observationCount, five, open, medianSignalDbm) => ({
    observationCount, uniqueNetworkCount: observationCount, medianSignalDbm,
    bandCounts: { '2.4GHz': observationCount - five, '5GHz': five, otherUnknown: 0 },
    authenticationCounts: { Open: open }, encryptionCounts: {}, topChannels: [],
  });
  const insights = generateCompareInsights('Area A', 'Area B', area(124, 28, 10, -67), area(100, 41, 30, -74));
  assert.ok(insights.length <= 3);
  assert.match(insights.map((item) => item.description).join(' '), /observations/);
  assert.doesNotMatch(insights.map((item) => `${item.title} ${item.description}`).join(' '),
    /foot traffic|newer infrastructure|denser infrastructure|usage intensity|customers|sales|purchasing power|internet quality|business suitability|more secure/i);
  assert.deepEqual(generateCompareInsights('Area A', 'Area B', area(100, 20, 10, -70), area(100, 20, 10, -70)).map((item) => item.description), [
    'The selected areas show broadly similar values across these surveyed wireless indicators.',
  ]);
});
