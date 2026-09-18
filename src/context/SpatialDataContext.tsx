import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { SpatialDataContext } from '@/context/spatialContext';
import { PRIMARY_DATASET } from '@/constants/dataset';
import { loadCSVFromPath } from '@/utils/csvParser';
import { computeDatasetSummary, computeGridCells } from '@/utils/analyzeWiFiData';
import { buildPresetAreas } from '@/utils/buildPresetAreas';
import type { DatasetSummary, GridCell, PresetArea } from '@/type/spatial';
import type { WiFiData } from '@/type/wifi';

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

        const areas = buildPresetAreas(cells, data);

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
