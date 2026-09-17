import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GridIntelligenceLayer } from '@/components/map/GridIntelligenceLayer';
import { GridLegend } from '@/components/map/GridLegend';
import { AreaIntelligencePanel } from '@/components/map/AreaIntelligencePanel';
import { PresetAreaControls } from '@/components/map/PresetAreaControls';
import { DatasetLimitations } from '@/components/DatasetLimitations';
import { SpatialDataProvider } from '@/context/SpatialDataContext';
import { useSpatialData } from '@/context/spatialContext';
import { buildIntensityScale } from '@/utils/spatialMetrics';
import type { GridCell, PresetArea, SpatialMetric } from '@/type/spatial';

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

function PresetBoundsFit({ area }: { area: PresetArea | null }) {
  const map = useMap();

  useEffect(() => {
    if (!area) return;
    map.fitBounds([
      [area.bounds.south, area.bounds.west],
      [area.bounds.north, area.bounds.east],
    ], { padding: [24, 24] });
  }, [area, map]);

  return null;
}

type MapSelection = { kind: 'cell'; id: string } | { kind: 'preset'; id: PresetArea['id'] } | null;

function AggregateMap() {
  const { gridCells, presetAreas, loading, error, retry } = useSpatialData();
  const [selection, setSelection] = useState<MapSelection>(null);
  const metric = DEFAULT_METRIC;
  const cellById = useMemo(() => new Map(gridCells.map((cell) => [cell.cellId, cell])), [gridCells]);
  const areaById = useMemo(() => new Map(presetAreas.map((area) => [area.id, area])), [presetAreas]);
  const selectedCell = useMemo(
    () => selection?.kind === 'cell' ? cellById.get(selection.id) ?? null : null,
    [cellById, selection],
  );
  const selectedArea = useMemo(
    () => selection?.kind === 'preset' ? areaById.get(selection.id) ?? null : null,
    [areaById, selection],
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
    setSelection({ kind: 'cell', id: cell.cellId });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col bg-slate-100 lg:h-[calc(100vh-4rem)] lg:flex-row-reverse">
      <div data-testid="grid-map" role="region" aria-label="Survey grid map" className="relative h-[52vh] min-h-[22rem] w-full lg:h-full lg:flex-1">
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
        <PresetBoundsFit area={selectedArea} />
        {!loading && !error && (
          <GridIntelligenceLayer
            cells={gridCells}
            selectedCellId={selectedCell?.cellId ?? null}
            selectedArea={selectedArea}
            onSelect={handleSelect}
            metric={metric}
            scale={intensityScale}
          />
        )}
      </MapContainer>

      {!loading && !error && (
        <>
          <div className="pointer-events-none absolute right-4 top-4 z-[900] hidden sm:block">
            <GridLegend scale={intensityScale} metric={metric} />
          </div>
          <details className="absolute right-3 top-3 z-[900] rounded-lg bg-white/95 p-2 text-sm shadow-lg sm:hidden">
            <summary className="cursor-pointer font-semibold">Map legend</summary>
            <div className="mt-2"><GridLegend scale={intensityScale} metric={metric} /></div>
          </details>
        </>
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

      </div>
      <aside className="max-h-[48vh] w-full shrink-0 overflow-y-auto border-t border-slate-200 bg-white p-4 shadow-lg lg:h-full lg:max-h-none lg:w-[21rem] lg:border-r lg:border-t-0" aria-label="Area selection and intelligence">
        <PresetAreaControls
          areas={presetAreas}
          selectedId={selectedArea?.id ?? null}
          onSelect={(area) => setSelection({ kind: 'preset', id: area.id })}
        />
        <div className="my-4 border-t border-slate-200" />
        {selectedCell ? (
          <AreaIntelligencePanel title={`Cell ${selectedCell.cellId}`} metrics={selectedCell} />
        ) : selectedArea ? (
          <AreaIntelligencePanel title={selectedArea.name} metrics={selectedArea} area={selectedArea} />
        ) : (
          <p className="text-sm leading-6 text-slate-600">Select a published survey cell or choose Area A, B, or C to inspect recorded metrics.</p>
        )}
        <div className="mt-5 text-slate-700"><DatasetLimitations /></div>
      </aside>
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
