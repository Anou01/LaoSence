import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { SpatialDataContext } from '@/context/spatialContext';
import { PRIMARY_DATASET } from '@/constants/dataset';
import { loadCSVFromPath } from '@/utils/csvParser';
import { computeDatasetSummary, computeGridCells } from '@/utils/analyzeWiFiData';
import type { AggregateMetrics, DatasetSummary, GridCell, PresetArea } from '@/type/spatial';
import type { WiFiData } from '@/type/wifi';

const GRID_SIZE_METERS = 250;
const LAT_STEP = GRID_SIZE_METERS / 111320;
const LNG_STEP = GRID_SIZE_METERS / (111320 * Math.cos(18 * Math.PI / 180));

export function SpatialDataProvider({ children }: { children: ReactNode }) {
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [presetAreas, setPresetAreas] = useState<PresetArea[]>([]);
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [rawData, setRawData] = useState<WiFiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void loadCSVFromPath(PRIMARY_DATASET)
      .then((data) => {
        if (!active) return;
        setRawData(data);

        const cells = computeGridCells(data);
        const summary = computeDatasetSummary(data, data.length, 0);
        summary.publishedCellCount = cells.length;

        const areas = buildPresetAreas(cells);

        setGridCells(cells);
        setPresetAreas(areas);
        setDatasetSummary(summary);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setGridCells([]);
        setPresetAreas([]);
        setDatasetSummary(null);
        setRawData([]);
        setError(cause instanceof Error ? cause.message : 'Unable to load CSV data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reloadToken]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((t) => t + 1);
  }, []);

  return (
    <SpatialDataContext.Provider value={{
      gridCells, presetAreas, datasetSummary, loading, error, retry, rawData,
    }}>
      {children}
    </SpatialDataContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Preset area builder                                               */
/* ------------------------------------------------------------------ */

function buildPresetAreas(cells: GridCell[]): PresetArea[] {
  if (cells.length < 15) return [];

  const cellMap = new Map<string, GridCell>();
  for (const cell of cells) cellMap.set(`${cell.row}_${cell.col}`, cell);

  const allRows = cells.map((c) => c.row);
  const allCols = cells.map((c) => c.col);
  const minRow = Math.min(...allRows);
  const maxRow = Math.max(...allRows);
  const minCol = Math.min(...allCols);
  const maxCol = Math.max(...allCols);

  const blocks: { row: number; col: number; score: number; published: number }[] = [];
  for (let r = minRow; r <= maxRow - 2; r++) {
    for (let c = minCol; c <= maxCol - 2; c++) {
      let score = 0;
      let published = 0;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const cell = cellMap.get(`${r + dr}_${c + dc}`);
          if (cell) { score += cell.uniqueNetworkCount; published++; }
        }
      }
      if (published >= 5) blocks.push({ row: r, col: c, score, published });
    }
  }

  blocks.sort((a, b) => b.score - a.score);

  const selected: typeof blocks = [];
  for (const block of blocks) {
    if (selected.length >= 3) break;
    if (!selected.some((s) => Math.abs(s.row - block.row) < 3 && Math.abs(s.col - block.col) < 3)) {
      selected.push(block);
    }
  }

  selected.sort((a, b) => a.col - b.col);

  return selected.map((block, i): PresetArea => {
    const cellIds: string[] = [];
    const blockCells: GridCell[] = [];
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const id = `${block.row + dr}_${block.col + dc}`;
        cellIds.push(id);
        const cell = cellMap.get(id);
        if (cell) blockCells.push(cell);
      }
    }

    const metrics = mergeMetrics(blockCells);
    return {
      ...metrics,
      id: `area-${String.fromCharCode(97 + i)}` as PresetArea['id'],
      name: `Area ${String.fromCharCode(65 + i)}` as PresetArea['name'],
      dimensions: { rows: 3 as const, cols: 3 as const },
      areaKm2Approx: 0.5625,
      cellIds,
      bounds: {
        south: block.row * LAT_STEP,
        west: block.col * LNG_STEP,
        north: (block.row + 3) * LAT_STEP,
        east: (block.col + 3) * LNG_STEP,
      },
      publishedCellCount: block.published,
    };
  });
}

function mergeMetrics(cells: GridCell[]): AggregateMetrics {
  const bandCounts = { '2.4GHz': 0, '5GHz': 0, otherUnknown: 0 };
  const authCounts: Record<string, number> = {};
  const encCounts: Record<string, number> = {};
  const channelMap: Record<number, number> = {};
  const signals: number[] = [];
  let observationCount = 0;
  let uniqueNetworkCount = 0;

  for (const cell of cells) {
    observationCount += cell.observationCount;
    uniqueNetworkCount += cell.uniqueNetworkCount;
    bandCounts['2.4GHz'] += cell.bandCounts['2.4GHz'];
    bandCounts['5GHz'] += cell.bandCounts['5GHz'];
    bandCounts.otherUnknown += cell.bandCounts.otherUnknown;
    for (const [k, v] of Object.entries(cell.authenticationCounts)) authCounts[k] = (authCounts[k] ?? 0) + v;
    for (const [k, v] of Object.entries(cell.encryptionCounts)) encCounts[k] = (encCounts[k] ?? 0) + v;
    for (const ch of cell.topChannels) channelMap[ch.channel] = (channelMap[ch.channel] ?? 0) + ch.observations;
    if (cell.medianSignalDbm !== null) signals.push(cell.medianSignalDbm);
  }

  return {
    observationCount,
    uniqueNetworkCount,
    medianSignalDbm: signals.length > 0 ? signals.sort((a, b) => a - b)[Math.floor(signals.length / 2)] : null,
    bandCounts,
    authenticationCounts: authCounts,
    encryptionCounts: encCounts,
    topChannels: Object.entries(channelMap)
      .map(([ch, obs]) => ({ channel: Number(ch), observations: obs }))
      .sort((a, b) => b.observations - a.observations),
  };
}
