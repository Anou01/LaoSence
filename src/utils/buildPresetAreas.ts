import { computeAreaMetrics } from '@/utils/analyzeWiFiData';
import type { GridCell, PresetArea } from '@/type/spatial';
import type { WiFiData } from '@/type/wifi';

const GRID_SIZE_METERS = 250;
const LAT_STEP = GRID_SIZE_METERS / 111320;
const LNG_STEP = GRID_SIZE_METERS / (111320 * Math.cos(18 * Math.PI / 180));

export function buildPresetAreas(cells: GridCell[], rawData: WiFiData[]): PresetArea[] {
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
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        cellIds.push(`${block.row + dr}_${block.col + dc}`);
      }
    }

    const bounds = {
      south: block.row * LAT_STEP,
      west: block.col * LNG_STEP,
      north: (block.row + 3) * LAT_STEP,
      east: (block.col + 3) * LNG_STEP,
    };
    return {
      ...computeAreaMetrics(rawData, bounds),
      id: `area-${String.fromCharCode(97 + i)}` as PresetArea['id'],
      name: `Area ${String.fromCharCode(65 + i)}` as PresetArea['name'],
      dimensions: { rows: 3, cols: 3 },
      areaKm2Approx: 0.5625,
      cellIds,
      bounds,
      publishedCellCount: block.published,
    };
  });
}
