import { createContext, useContext } from 'react';
import type { SpatialDataState } from '@/type/spatial';

export const SpatialDataContext = createContext<SpatialDataState | null>(null);

export function useSpatialData(): SpatialDataState {
  const value = useContext(SpatialDataContext);
  if (!value) throw new Error('useSpatialData must be used within SpatialDataProvider');
  return value;
}
