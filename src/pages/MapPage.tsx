import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GridIntelligenceLayer } from '@/components/map/GridIntelligenceLayer';
import { GridLegend } from '@/components/map/GridLegend';
import { SpatialDataProvider } from '@/context/SpatialDataContext';
import { useSpatialData } from '@/context/spatialContext';
import { buildIntensityScale } from '@/utils/spatialMetrics';
import type { GridCell, SpatialMetric } from '@/type/spatial';

const DEFAULT_CENTER: [number, number] = [17.997, 102.608];
const DEFAULT_METRIC: SpatialMetric = 'infrastructure';

function PublishedBoundsFit({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!bounds || hasFitted.current) return;
    map.fitBounds(bounds, { padding: [24, 24] });
    hasFitted.current = true;
  }, [bounds, map]);

  return null;
}

function AggregateMap() {
  const { gridCells, loading, error, retry } = useSpatialData();
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const metric = DEFAULT_METRIC;
  const selectedCell = useMemo(
    () => gridCells.find((cell) => cell.cellId === selectedCellId) ?? null,
    [gridCells, selectedCellId],
  );
  const intensityScale = useMemo(() => buildIntensityScale(gridCells), [gridCells]);
  const publishedBounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (gridCells.length === 0) return null;
    const bounds = gridCells.reduce((result, cell) => ({
      south: Math.min(result.south, cell.bounds.south),
      west: Math.min(result.west, cell.bounds.west),
      north: Math.max(result.north, cell.bounds.north),
      east: Math.max(result.east, cell.bounds.east),
    }), {
      south: Infinity,
      west: Infinity,
      north: -Infinity,
      east: -Infinity,
    });
    return [[bounds.south, bounds.west], [bounds.north, bounds.east]];
  }, [gridCells]);

  const handleSelect = (cell: GridCell) => {
    setSelectedCellId(cell.cellId);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[32rem] w-full overflow-hidden bg-slate-100">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        minZoom={5}
        maxZoom={18}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomleft" />
        <PublishedBoundsFit bounds={publishedBounds} />
        {!loading && !error && (
          <GridIntelligenceLayer
            cells={gridCells}
            selectedCellId={selectedCellId}
            onSelect={handleSelect}
            metric={metric}
            scale={intensityScale}
          />
        )}
      </MapContainer>

      {!loading && !error && (
        <div className="pointer-events-none absolute right-4 top-4 z-[900]">
          <GridLegend scale={intensityScale} metric={metric} />
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/75 backdrop-blur-sm" role="status">
          <div className="rounded-xl bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-lg">
            Loading aggregate survey cells...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-1/2 top-6 z-[1000] w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-lg" role="alert">
          <p className="text-sm font-medium">Unable to load the survey map.</p>
          <p className="mt-1 break-words text-xs">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && gridCells.length === 0 && (
        <div className="absolute left-1/2 top-6 z-[900] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-lg">
          No published survey cells
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-[900] max-w-xs rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-xs text-slate-700 shadow-lg backdrop-blur">
        <strong>Wireless Infrastructure Intensity</strong>
        <p className="mt-1">{selectedCell ? `Selected cell: ${selectedCell.cellId}` : 'Select a published survey cell'}</p>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <SpatialDataProvider>
      <AggregateMap />
    </SpatialDataProvider>
  );
}
