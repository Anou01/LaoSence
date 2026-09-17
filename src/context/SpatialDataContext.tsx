import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { SpatialDataContext } from '@/context/spatialContext';
import { invalidateSpatialData, loadSpatialData } from '@/utils/loadSpatialData';
import type { DatasetSummary, GridCell, PresetArea } from '@/type/spatial';

export function SpatialDataProvider({ children }: { children: ReactNode }) {
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [presetAreas, setPresetAreas] = useState<PresetArea[]>([]);
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void loadSpatialData()
      .then((data) => {
        if (!active) return;
        setGridCells(data.gridCells);
        setPresetAreas(data.presetAreas);
        setDatasetSummary(data.datasetSummary);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setGridCells([]);
        setPresetAreas([]);
        setDatasetSummary(null);
        setError(cause instanceof Error ? cause.message : 'Unable to load aggregate spatial data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const retry = useCallback(() => {
    invalidateSpatialData();
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  return (
    <SpatialDataContext.Provider value={{
      gridCells,
      presetAreas,
      datasetSummary,
      loading,
      error,
      retry,
    }}>
      {children}
    </SpatialDataContext.Provider>
  );
}
