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

function loadTypescript(file) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (specifier) => {
    if (specifier === '@/type/spatial') return loadTypescript('src/type/spatial.ts');
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
