export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface BandCounts {
  '2.4GHz': number;
  '5GHz': number;
  otherUnknown: number;
}

export interface ChannelCount {
  channel: number;
  observations: number;
}

export interface HistogramBin {
  label: string;
  observations: number;
}

export interface AggregateMetrics {
  observationCount: number;
  uniqueNetworkCount: number;
  medianSignalDbm: number | null;
  bandCounts: BandCounts;
  authenticationCounts: Record<string, number>;
  encryptionCounts: Record<string, number>;
  topChannels: ChannelCount[];
}

export interface GridCell extends AggregateMetrics {
  cellId: string;
  row: number;
  col: number;
  bounds: Bounds;
  center: { lat: number; lng: number };
}

export interface PresetArea extends AggregateMetrics {
  id: 'area-a' | 'area-b' | 'area-c';
  name: 'Area A' | 'Area B' | 'Area C';
  dimensions: { rows: 3; cols: 3 };
  areaKm2Approx: number;
  cellIds: string[];
  bounds: Bounds;
  publishedCellCount: number;
}

export interface DatasetSummary extends AggregateMetrics {
  schemaVersion: 1;
  sourceLabel: string;
  historicalSurveyPeriod: string;
  inputObservationCount: number;
  rejectedObservationCount: number;
  rejectionCounts: { invalidCoordinates: number; invalidSignal: number };
  publishedCellCount: number;
  suppressedCellCount: number;
  signalHistogram: HistogramBin[];
  radioTypeCounts: Record<string, number>;
}

export interface GridDocument {
  metadata: {
    schemaVersion: 1;
    gridSizeMeters: 250;
    minimumUniqueNetworksPerCell: 5;
    referenceLatitude: 18;
    metricDefinition: string;
  };
  cells: GridCell[];
}

export interface PresetDocument {
  metadata: {
    schemaVersion: 1;
    selection: {
      method: 'longitude-thirds' | 'global-spatial-fallback';
      minimumPublishedCells: number;
      fallbackUsed: boolean;
      reason: string;
    };
  };
  areas: PresetArea[];
}

export type SpatialMetric = 'infrastructure' | 'fiveGhzShare' | 'medianSignal';

export interface SpatialData {
  gridCells: GridCell[];
  presetAreas: PresetArea[];
  datasetSummary: DatasetSummary;
}

import type { WiFiData } from '@/type/wifi';

export interface SpatialDataState {
  gridCells: GridCell[];
  presetAreas: PresetArea[];
  datasetSummary: DatasetSummary | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  rawData?: WiFiData[];
}
