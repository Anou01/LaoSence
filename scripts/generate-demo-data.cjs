'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Papa = require('papaparse');
const { buildSpatialData } = require('./lib/spatial.cjs');

function parseArguments(args) {
  if (!Array.isArray(args)) throw new Error('Arguments must be an array');

  let input;
  let out;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--input' && argument !== '--out') {
      throw new Error(`Unknown or duplicate argument: ${argument ?? ''}`.trim());
    }
    if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }
    if (argument === '--input') {
      if (input !== undefined) throw new Error('Duplicate argument: --input');
      input = args[index + 1];
    } else {
      if (out !== undefined) throw new Error('Duplicate argument: --out');
      out = args[index + 1];
    }
    index += 1;
  }

  if (input === undefined) throw new Error('Missing required argument: --input');
  if (out === undefined) throw new Error('Missing required argument: --out');
  return { input, out };
}

function parseCsvFile(inputPath) {
  let contents;
  try {
    contents = fs.readFileSync(inputPath, 'utf8');
  } catch {
    throw new Error('Input CSV could not be read');
  }

  const parsed = Papa.parse(contents, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
  });
  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0];
    const rowNumber = Number.isInteger(firstError.row) ? ` at row ${firstError.row}` : '';
    throw new Error(`CSV parse error${rowNumber}: ${firstError.message}`);
  }
  return parsed.data;
}

function writeJsonFile(directory, filename, value) {
  fs.writeFileSync(
    path.join(directory, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

function generateDemoData(inputArgument, outputArgument) {
  const inputPath = path.resolve(inputArgument);
  const outputPath = path.resolve(outputArgument);
  let inputStat;
  try {
    inputStat = fs.statSync(inputPath);
  } catch {
    throw new Error('Input must be a readable regular file');
  }
  if (!inputStat.isFile()) throw new Error('Input must be a readable regular file');
  if (inputPath === outputPath) throw new Error('Output path must differ from input path');
  if (fs.existsSync(outputPath) && !fs.statSync(outputPath).isDirectory()) {
    throw new Error('Output path must be a directory');
  }

  const data = buildSpatialData(parseCsvFile(inputPath));
  fs.mkdirSync(outputPath, { recursive: true });
  writeJsonFile(outputPath, 'grid-cells.json', data.grid);
  writeJsonFile(outputPath, 'preset-areas.json', data.presets);
  writeJsonFile(outputPath, 'dataset-summary.json', data.summary);
  return data;
}

function printGenerationSummary(data) {
  const { summary, presets } = data;
  const areas = presets.areas.map((area) => ({
    id: area.id,
    publishedCellCount: area.publishedCellCount,
    observationCount: area.observationCount,
    uniqueNetworkCount: area.uniqueNetworkCount,
    medianSignalDbm: area.medianSignalDbm,
  }));
  console.log(JSON.stringify({
    inputObservationCount: summary.inputObservationCount,
    acceptedObservationCount: summary.observationCount,
    rejectedObservationCount: summary.rejectedObservationCount,
    rejectionCounts: summary.rejectionCounts,
    publishedCellCount: summary.publishedCellCount,
    suppressedCellCount: summary.suppressedCellCount,
    selection: presets.metadata.selection,
    areas,
  }));
}

if (require.main === module) {
  try {
    const argumentsValue = parseArguments(process.argv.slice(2));
    const data = generateDemoData(argumentsValue.input, argumentsValue.out);
    printGenerationSummary(data);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Demo data generation failed');
    process.exitCode = 1;
  }
}

module.exports = {
  parseArguments,
  parseCsvFile,
  generateDemoData,
};
