const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const AGGREGATE_URLS = [
  '/data/grid-cells.json',
  '/data/preset-areas.json',
  '/data/dataset-summary.json',
];

function loadTypescript(file, overrides = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (specifier) => {
    if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
    if (specifier === '@/type/spatial') return loadTypescript('src/type/spatial.ts');
    if (specifier === '@/utils/spatialMetrics') return loadTypescript('src/utils/spatialMetrics.ts');
    if (specifier === '@/utils/analyzeWiFiData') return loadTypescript('src/utils/analyzeWiFiData.ts');
    if (specifier === '@/utils/areaPresentation') return loadTypescript('src/utils/areaPresentation.ts');
    if (specifier === '@/components/map/AreaIntelligencePanel') return loadTypescript('src/components/map/AreaIntelligencePanel.tsx');
    if (specifier === '@/components/DatasetLimitations') return loadTypescript('src/components/DatasetLimitations.tsx');
    return originalRequire(specifier);
  };
  loaded._compile(compiled, filename);
  return loaded.exports;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readPublicDocuments() {
  const read = (filename) => JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../public/data', filename),
    'utf8',
  ));
  return {
    grid: read('grid-cells.json'),
    presets: read('preset-areas.json'),
    summary: read('dataset-summary.json'),
  };
}

function responseFor(value) {
  return {
    ok: true,
    status: 200,
    json: async () => value,
  };
}

function cellsWithUniqueCounts(values) {
  return values.map((uniqueNetworkCount, index) => ({
    cellId: `8000_${43000 + index}`,
    row: 8000,
    col: 43000 + index,
    bounds: { south: 18, west: 102, north: 18.01, east: 102.01 },
    center: { lat: 18.005, lng: 102.005 },
    observationCount: uniqueNetworkCount,
    uniqueNetworkCount,
    medianSignalDbm: -60,
    bandCounts: { '2.4GHz': uniqueNetworkCount, '5GHz': 0, otherUnknown: 0 },
    authenticationCounts: { Open: uniqueNetworkCount },
    encryptionCounts: { CCMP: uniqueNetworkCount },
    topChannels: [],
  }));
}

function comparisonArea(name, overrides = {}) {
  return {
    id: name.toLowerCase().replace(' ', '-'),
    name,
    dimensions: { rows: 3, cols: 3 },
    areaKm2Approx: 0.5625,
    cellIds: [],
    bounds: { south: 18, west: 102, north: 18.01, east: 102.01 },
    publishedCellCount: 9,
    observationCount: 100,
    uniqueNetworkCount: 100,
    medianSignalDbm: -70,
    bandCounts: { '2.4GHz': 95, '5GHz': 5, otherUnknown: 0 },
    authenticationCounts: { Open: 10, 'WPA2 Personal': 90 },
    encryptionCounts: {},
    topChannels: [],
    ...overrides,
  };
}

function documentForUrl(documents, url) {
  if (url === AGGREGATE_URLS[0]) return documents.grid;
  if (url === AGGREGATE_URLS[1]) return documents.presets;
  if (url === AGGREGATE_URLS[2]) return documents.summary;
  throw new Error(`Unexpected request: ${url}`);
}

test('known band shares match offline denominator semantics', () => {
  const { knownBandShares } = loadTypescript('src/utils/spatialMetrics.ts');

  assert.deepEqual(knownBandShares({ '2.4GHz': 2, '5GHz': 6, otherUnknown: 92 }), {
    twoPointFour: 0.25,
    five: 0.75,
  });
  assert.deepEqual(knownBandShares({ '2.4GHz': 0, '5GHz': 0, otherUnknown: 3 }), {
    twoPointFour: null,
    five: null,
  });
});

test('area panel values use preset records directly and describe missing measurements', () => {
  const { areaPresentation } = loadTypescript('src/utils/areaPresentation.ts');
  const { presets, grid } = readPublicDocuments();
  for (const area of presets.areas) {
    const result = areaPresentation(area);
    assert.equal(result.identifiers, area.uniqueNetworkCount.toLocaleString('en-US'));
    assert.equal(result.observations, area.observationCount.toLocaleString('en-US'));
    assert.equal(result.medianSignal, `${area.medianSignalDbm} dBm`);
    assert.equal(result.unknownBandObservations, area.bandCounts.otherUnknown);
  }
  const areaC = presets.areas[2];
  const publishedInC = grid.cells.filter((cell) => areaC.cellIds.includes(cell.cellId));
  assert.notEqual(publishedInC.reduce((total, cell) => total + cell.uniqueNetworkCount, 0), areaC.uniqueNetworkCount);
  assert.notEqual(publishedInC.reduce((total, cell) => total + cell.medianSignalDbm, 0) / publishedInC.length, areaC.medianSignalDbm);

  const missing = {
    ...presets.areas[0],
    observationCount: 4,
    uniqueNetworkCount: 3,
    medianSignalDbm: null,
    bandCounts: { '2.4GHz': 0, '5GHz': 0, otherUnknown: 4 },
    authenticationCounts: { 'Other / Unknown': 4 },
    topChannels: [],
  };
  assert.deepEqual(areaPresentation(missing), {
    identifiers: '3',
    observations: '4',
    medianSignal: 'No recorded data',
    twoPointFourShare: 'Unknown',
    fiveShare: 'Unknown',
    unknownBandObservations: 4,
    securityMix: [{ label: 'Other / Unknown', observations: 4, percentage: '100%' }],
    channels: [],
  });

  const zero = areaPresentation({
    ...missing,
    observationCount: 2,
    bandCounts: { '2.4GHz': 2, '5GHz': 0, otherUnknown: 0 },
    authenticationCounts: { Open: 0, 'Other / Unknown': 2 },
  });
  assert.equal(zero.fiveShare, '0%');
  assert.equal(zero.securityMix[0].percentage, '0%');
});

test('identifier interpretation triggers at ten percent and handles zero counts factually', () => {
  const { interpretAreas } = loadTypescript('src/utils/spatialMetrics.ts');
  const a = comparisonArea('Area A');
  const b = comparisonArea('Area B');
  const statement = 'Area A shows a higher number of observed network identifiers within the same geographic survey area.';

  assert.deepEqual(interpretAreas({ ...a, uniqueNetworkCount: 109 }, b), [
    'The selected areas show broadly similar values across these surveyed wireless indicators.',
  ]);
  assert.deepEqual(interpretAreas({ ...a, uniqueNetworkCount: 110 }, b), [statement]);
  assert.deepEqual(interpretAreas({ ...a, uniqueNetworkCount: 5 }, { ...b, uniqueNetworkCount: 0 }), [statement]);
  assert.deepEqual(interpretAreas({ ...a, uniqueNetworkCount: 0 }, { ...b, uniqueNetworkCount: 0 }), [
    'The selected areas show broadly similar values across these surveyed wireless indicators.',
  ]);
});

test('band and Open shares trigger at five percentage points, excluding unknown denominators', () => {
  const { interpretAreas } = loadTypescript('src/utils/spatialMetrics.ts');
  const a = comparisonArea('Area A');
  const b = comparisonArea('Area B');
  const bandMessage = 'Area A shows a larger observed 5 GHz share.';
  const openMessage = 'Area A has a higher share of advertised Open networks.';

  const similar = 'The selected areas show broadly similar values across these surveyed wireless indicators.';
  assert.deepEqual(interpretAreas({ ...a, bandCounts: { '2.4GHz': 91, '5GHz': 9, otherUnknown: 0 } }, b), [similar]);
  assert.deepEqual(interpretAreas({ ...a, bandCounts: { '2.4GHz': 90, '5GHz': 10, otherUnknown: 0 } }, b), [bandMessage]);
  assert.deepEqual(interpretAreas({ ...a, bandCounts: { '2.4GHz': 85, '5GHz': 15, otherUnknown: 0 } },
    { ...b, bandCounts: { '2.4GHz': 90, '5GHz': 10, otherUnknown: 0 } }), [bandMessage]);
  assert.deepEqual(interpretAreas({ ...a, authenticationCounts: { Open: 14 } }, b), [similar]);
  assert.deepEqual(interpretAreas({ ...a, authenticationCounts: { Open: 15 } }, b), [openMessage]);
  assert.deepEqual(interpretAreas({ ...a, bandCounts: { '2.4GHz': 0, '5GHz': 0, otherUnknown: 100 } }, b), [similar]);
  assert.deepEqual(interpretAreas({ ...a, observationCount: 0, authenticationCounts: { Open: 0 } }, b), [similar]);
});

test('median boundary is five dB and missing measurements cannot create comparisons', () => {
  const { interpretAreas } = loadTypescript('src/utils/spatialMetrics.ts');
  const a = comparisonArea('Area A');
  const b = comparisonArea('Area B');
  const medianMessage = 'The median recorded signal differs by 5 dB between these areas.';

  const similar = 'The selected areas show broadly similar values across these surveyed wireless indicators.';
  assert.deepEqual(interpretAreas({ ...a, medianSignalDbm: -74.99 }, b), [similar]);
  assert.deepEqual(interpretAreas({ ...a, medianSignalDbm: -75 }, b), [medianMessage]);
  assert.deepEqual(interpretAreas({ ...a, medianSignalDbm: null }, b), [similar]);
  const empty = comparisonArea('Area A', {
    observationCount: 0,
    uniqueNetworkCount: 0,
    medianSignalDbm: null,
    bandCounts: { '2.4GHz': 0, '5GHz': 0, otherUnknown: 0 },
    authenticationCounts: {},
  });
  assert.deepEqual(interpretAreas(empty, { ...empty, id: 'area-b', name: 'Area B' }), [
    'The selected areas show broadly similar values across these surveyed wireless indicators.',
  ]);
});

test('interpretation keeps fixed priority and at most three factual statements', () => {
  const { interpretAreas } = loadTypescript('src/utils/spatialMetrics.ts');
  const a = comparisonArea('Area A', {
    uniqueNetworkCount: 110,
    bandCounts: { '2.4GHz': 90, '5GHz': 10, otherUnknown: 0 },
    authenticationCounts: { Open: 15 },
    medianSignalDbm: -75,
  });
  const b = comparisonArea('Area B');
  const statements = interpretAreas(a, b);
  assert.equal(statements.length, 3);
  assert.match(statements[0], /identifiers/);
  assert.match(statements[1], /5 GHz/);
  assert.match(statements[2], /Open/);
  assert.equal(statements.join(' ').includes('median'), false);
  assert.doesNotMatch(statements.join(' '), /Winner|Best Location|score|footfall|sales/i);
});

test('ComparePage immediately shows equal-size Area A vs Area B with measured indicators', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { presets } = readPublicDocuments();
  const { default: ComparePage } = loadTypescript('src/pages/ComparePage.tsx', {
    '@/context/spatialContext': {
      useSpatialData: () => ({ presetAreas: presets.areas, gridCells: [], loading: false, error: null, retry: () => {} }),
    },
  });
  const html = renderToStaticMarkup(React.createElement(ComparePage));
  assert.match(html, /Compare equal-size surveyed areas using measured wireless indicators/);
  assert.match(html, /Area A <span[^>]*>vs<\/span> Area B/);
  assert.match(html, /0.5625 km² each/);
  assert.match(html, /Observed network identifiers/);
  assert.match(html, /Median recorded signal/);
  assert.match(html, /Add Area/);
  assert.doesNotMatch(html, /Winner|Best Location|business score/i);
});

test('summary chart adapters preserve observation partitions and source categories', () => {
  const { summaryChartData } = loadTypescript('src/utils/spatialMetrics.ts');
  const base = readPublicDocuments().summary;
  const summary = {
    ...base,
    observationCount: 10,
    authenticationCounts: { Open: 3, OWE: 2, 'WPA2 Personal': 5 },
    encryptionCounts: { 'Synthetic cipher': 6, 'Other / Unknown': 4 },
    bandCounts: { '2.4GHz': 6, '5GHz': 3, otherUnknown: 1 },
    signalHistogram: [
      { label: 'weak', observations: 4 },
      { label: 'strong', observations: 6 },
      { label: 'empty', observations: 0 },
    ],
    radioTypeCounts: { 'Synthetic radio': 7, 'Other / Unknown': 3 },
    topChannels: [
      { channel: 11, observations: 2 },
      { channel: 6, observations: 5 },
      { channel: 1, observations: 3 },
    ],
  };
  const data = summaryChartData(summary);
  assert.deepEqual(data.authentication, [
    { method: 'WPA2 Personal', count: 5 },
    { method: 'Open', count: 3 },
    { method: 'OWE', count: 2 },
  ]);
  assert.deepEqual(data.encryption, [
    { browser: 'Synthetic cipher', observations: 6 },
    { browser: 'Other / Unknown', observations: 4 },
  ]);
  assert.deepEqual(data.frequency, [
    { band: '2.4 GHz', count: 6 },
    { band: '5 GHz', count: 3 },
    { band: 'Other / Unknown', count: 1 },
  ]);
  assert.deepEqual(data.signal, [
    { bin: 'weak', count: 4 },
    { bin: 'strong', count: 6 },
  ]);
  assert.deepEqual(data.radio, [
    { radioType: 'Synthetic radio', count: 7 },
    { radioType: 'Other / Unknown', count: 3 },
  ]);
  assert.deepEqual(data.channel, [
    { bin: '6', count: 5 },
    { bin: '1', count: 3 },
    { bin: '11', count: 2 },
  ]);
  for (const key of ['authentication', 'encryption', 'frequency', 'signal', 'radio']) {
    const countKey = key === 'encryption' ? 'observations' : 'count';
    assert.equal(data[key].reduce((total, row) => total + row[countKey], 0), summary.observationCount);
  }
});

test('channel chart adapter selects top fifteen by observations then channel number', () => {
  const { summaryChartData } = loadTypescript('src/utils/spatialMetrics.ts');
  const summary = {
    ...readPublicDocuments().summary,
    topChannels: Array.from({ length: 17 }, (_, index) => ({
      channel: 17 - index,
      observations: index === 0 ? 100 : index === 1 ? 50 : 5,
    })),
  };
  const rows = summaryChartData(summary).channel;
  assert.equal(rows.length, 15);
  assert.deepEqual(rows.slice(0, 4), [
    { bin: '17', count: 100 },
    { bin: '16', count: 50 },
    { bin: '1', count: 5 },
    { bin: '2', count: 5 },
  ]);
  assert.equal(rows.at(-1).bin, '13');
});

test('maps spatial metrics and keeps unknown values explicit', () => {
  const { metricValue } = loadTypescript('src/utils/spatialMetrics.ts');
  const metrics = {
    observationCount: 8,
    uniqueNetworkCount: 5,
    medianSignalDbm: -72,
    bandCounts: { '2.4GHz': 2, '5GHz': 6, otherUnknown: 4 },
    authenticationCounts: {},
    encryptionCounts: {},
    topChannels: [],
  };

  assert.equal(metricValue(metrics, 'infrastructure'), 5);
  assert.equal(metricValue(metrics, 'fiveGhzShare'), 0.75);
  assert.equal(metricValue(metrics, 'medianSignal'), -72);
  assert.equal(metricValue({ ...metrics, medianSignalDbm: null }, 'medianSignal'), null);
  assert.equal(metricValue({ ...metrics, bandCounts: { '2.4GHz': 0, '5GHz': 0, otherUnknown: 8 } }, 'fiveGhzShare'), null);
});

test('builds an honest empty intensity scale', () => {
  const { buildIntensityScale } = loadTypescript('src/utils/spatialMetrics.ts');

  assert.deepEqual(buildIntensityScale([]), {
    minimum: null,
    maximum: null,
    bins: [],
  });
});

test('collapses an all-equal intensity scale to one observed bin', () => {
  const { buildIntensityScale } = loadTypescript('src/utils/spatialMetrics.ts');
  const scale = buildIntensityScale(cellsWithUniqueCounts([5, 5, 5, 5]));

  assert.equal(scale.minimum, 5);
  assert.equal(scale.maximum, 5);
  assert.equal(scale.bins.length, 1);
  assert.equal(scale.bins[0].upperInclusive, 5);
  assert.match(scale.bins[0].label, /5/);
});

test('handles a sparse lower bound when quantile boundaries equal the maximum', () => {
  const { buildIntensityScale, colorForIntensity } = loadTypescript('src/utils/spatialMetrics.ts');
  const scale = buildIntensityScale(cellsWithUniqueCounts([5, 100, 100, 100, 100, 100]));

  assert.equal(scale.minimum, 5);
  assert.equal(scale.maximum, 100);
  assert.equal(scale.bins.length, 1);
  assert.equal(scale.bins[0].upperInclusive, null);
  assert.match(scale.bins[0].label, /5.*100.*within this survey/i);
  assert.equal(/undefined|NaN/.test(scale.bins[0].label), false);
  assert.equal(colorForIntensity(scale, 5), scale.bins[0].color);
  assert.equal(colorForIntensity(scale, 100), scale.bins[0].color);
});

test('uses collapsed quantile boundaries and numeric labels for fewer bins', () => {
  const { buildIntensityScale } = loadTypescript('src/utils/spatialMetrics.ts');
  const scale = buildIntensityScale(cellsWithUniqueCounts([5, 5, 10, 10, 100]));

  assert.deepEqual(scale.bins.map((bin) => bin.upperInclusive), [5, 10, null]);
  assert.equal(scale.bins.every((bin) => /within this survey/i.test(bin.label)), true);
  assert.equal(scale.bins.some((bin) => /Very Low|Low|Medium|High|Very High/.test(bin.label)), false);
});

test('keeps exact quantile boundaries in the lower bin and uses five-level labels', () => {
  const { buildIntensityScale, colorForIntensity } = loadTypescript('src/utils/spatialMetrics.ts');
  const scale = buildIntensityScale(cellsWithUniqueCounts([5, 10, 15, 20, 25]));

  assert.deepEqual(scale.bins.map((bin) => bin.upperInclusive), [5, 10, 15, 20, null]);
  assert.deepEqual(scale.bins.map((bin) => bin.label), [
    'Very Low', 'Low', 'Medium', 'High', 'Very High',
  ]);
  assert.equal(colorForIntensity(scale, 5), scale.bins[0].color);
  assert.equal(colorForIntensity(scale, 10), scale.bins[1].color);
  assert.equal(colorForIntensity(scale, 25), scale.bins[4].color);
});

test('loads exactly the three validated aggregate documents', async () => {
  const loader = loadTypescript('src/utils/loadSpatialData.ts');
  const documents = readPublicDocuments();
  const requested = [];
  const originalFetch = global.fetch;
  loader.invalidateSpatialData();
  global.fetch = async (url) => {
    requested.push(url);
    return responseFor(documentForUrl(documents, url));
  };

  try {
    const data = await loader.loadSpatialData();
    assert.equal(data.gridCells.length, documents.grid.cells.length);
    assert.equal(data.presetAreas.length, 3);
    assert.equal(data.datasetSummary.observationCount, documents.summary.observationCount);
    assert.deepEqual(requested.sort(), [...AGGREGATE_URLS].sort());
  } finally {
    global.fetch = originalFetch;
    loader.invalidateSpatialData();
  }
});

test('deduplicates concurrent loads and shares the in-flight promise', async () => {
  const loader = loadTypescript('src/utils/loadSpatialData.ts');
  const documents = readPublicDocuments();
  const requested = [];
  let releaseGate;
  const gate = new Promise((resolve) => { releaseGate = resolve; });
  const originalFetch = global.fetch;
  loader.invalidateSpatialData();
  global.fetch = async (url) => {
    requested.push(url);
    await gate;
    return responseFor(documentForUrl(documents, url));
  };

  try {
    const first = loader.loadSpatialData();
    const second = loader.loadSpatialData();
    assert.strictEqual(first, second);
    releaseGate();
    await first;
    assert.equal(requested.length, 3);
    assert.strictEqual(loader.loadSpatialData(), first);
  } finally {
    global.fetch = originalFetch;
    loader.invalidateSpatialData();
  }
});

test('clears a failed request so retry can fetch fresh aggregate data', async () => {
  const loader = loadTypescript('src/utils/loadSpatialData.ts');
  const documents = readPublicDocuments();
  const requested = [];
  let shouldFail = true;
  const originalFetch = global.fetch;
  loader.invalidateSpatialData();
  global.fetch = async (url) => {
    requested.push(url);
    if (shouldFail && url === AGGREGATE_URLS[0]) {
      return { ok: false, status: 503, json: async () => ({}) };
    }
    return responseFor(documentForUrl(documents, url));
  };

  try {
    await assert.rejects(loader.loadSpatialData(), /aggregate spatial data|HTTP 503/i);
    shouldFail = false;
    const retried = await loader.loadSpatialData();
    assert.equal(retried.gridCells.length, documents.grid.cells.length);
    assert.equal(requested.length, 6);
    assert.equal(requested.some((url) => url.includes('CSV_FILE')), false);
  } finally {
    global.fetch = originalFetch;
    loader.invalidateSpatialData();
  }
});

test('rejects malformed schema, geometry, and private fields before exposing data', async () => {
  const loader = loadTypescript('src/utils/loadSpatialData.ts');
  const originalFetch = global.fetch;
  const mutations = [
    (documents) => { documents.grid.metadata.schemaVersion = 2; },
    (documents) => { documents.grid.cells[0].bounds.south += 1; },
    (documents) => { documents.presets.areas[1].id = documents.presets.areas[0].id; },
    (documents) => { documents.grid.cells[0].SSID = 'private'; },
    (documents) => { documents.summary.observationCount += 1; },
  ];

  try {
    for (const mutate of mutations) {
      const documents = clone(readPublicDocuments());
      mutate(documents);
      loader.invalidateSpatialData();
      global.fetch = async (url) => responseFor(documentForUrl(documents, url));
      await assert.rejects(loader.loadSpatialData(), /aggregate spatial data|schema|geometry|private|count/i);
    }
  } finally {
    global.fetch = originalFetch;
    loader.invalidateSpatialData();
  }
});
