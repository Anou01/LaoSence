import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import MapGL, { NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Configure MapLibre GL worker for Vite compatibility
setWorkerUrl(
  new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href
);
import { MapPin, Layers, Eye, EyeOff } from 'lucide-react';
import { GridLegend } from '@/components/map/GridLegend';
import { AreaIntelligencePanel } from '@/components/map/AreaIntelligencePanel';
import { PresetAreaControls } from '@/components/map/PresetAreaControls';
import { useSpatialData } from '@/context/spatialContext';
import { buildIntensityScale, colorForIntensity, metricValue } from '@/utils/spatialMetrics';
import type { PresetArea, SpatialMetric } from '@/type/spatial';

const DEFAULT_CENTER = { longitude: 102.608, latitude: 17.997 };
const DEFAULT_METRIC: SpatialMetric = 'infrastructure';

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster' as const,
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

type MapSelection = { kind: 'cell'; id: string } | { kind: 'preset'; id: PresetArea['id'] } | null;

export default function MapPage() {
  const { gridCells, presetAreas, rawData, loading, error, retry } = useSpatialData();
  const [selection, setSelection] = useState<MapSelection>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const mapRef = useRef<MapRef>(null);
  const metric = DEFAULT_METRIC;

  const cellById = useMemo(() => new Map(gridCells.map((c) => [c.cellId, c])), [gridCells]);
  const areaById = useMemo(() => new Map(presetAreas.map((a) => [a.id, a])), [presetAreas]);
  const selectedCell = useMemo(
    () => selection?.kind === 'cell' ? cellById.get(selection.id) ?? null : null,
    [cellById, selection],
  );
  const selectedArea = useMemo(
    () => selection?.kind === 'preset' ? areaById.get(selection.id) ?? null : null,
    [areaById, selection],
  );
  const intensityScale = useMemo(() => buildIntensityScale(gridCells), [gridCells]);

  // Build GeoJSON for individual WiFi observation points (from raw CSV)
  const wifiPointsGeoJSON = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
    // Sample points to limit rendering (max ~8000 for performance)
    const step = Math.max(1, Math.floor(rawData.length / 8000));
    const features = [];
    for (let i = 0; i < rawData.length; i += step) {
      const row = rawData[i];
      if (row.latitude === 0 && row.longitude === 0) continue;
      features.push({
        type: 'Feature' as const,
        properties: {
          signal: row.signal ?? -80,
          weight: row.signal !== null ? Math.max(0, 100 + row.signal) / 100 : 0.3,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [row.longitude, row.latitude],
        },
      });
    }
    return { type: 'FeatureCollection' as const, features };
  }, [rawData]);

  // Build GeoJSON for grid cells
  const gridGeoJSON = useMemo(() => {
    if (gridCells.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: gridCells.map((cell) => {
        const color = colorForIntensity(intensityScale, metricValue(cell, metric));
        const isSelected = cell.cellId === selectedCell?.cellId;
        return {
          type: 'Feature' as const,
          id: cell.row * 100000 + cell.col,
          properties: {
            cellId: cell.cellId,
            color,
            height: Math.max(20, cell.uniqueNetworkCount * 4),
            networks: cell.uniqueNetworkCount,
            observations: cell.observationCount,
            selected: isSelected ? 1 : 0,
            opacity: isSelected ? 0.85 : 0.55,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [cell.bounds.west, cell.bounds.south],
              [cell.bounds.east, cell.bounds.south],
              [cell.bounds.east, cell.bounds.north],
              [cell.bounds.west, cell.bounds.north],
              [cell.bounds.west, cell.bounds.south],
            ]],
          },
        };
      }),
    };
  }, [gridCells, intensityScale, metric, selectedCell]);

  // Build GeoJSON for selected preset area border
  const areaGeoJSON = useMemo(() => {
    if (!selectedArea) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [selectedArea.bounds.west, selectedArea.bounds.south],
            [selectedArea.bounds.east, selectedArea.bounds.south],
            [selectedArea.bounds.east, selectedArea.bounds.north],
            [selectedArea.bounds.west, selectedArea.bounds.north],
            [selectedArea.bounds.west, selectedArea.bounds.south],
          ]],
        },
      }],
    };
  }, [selectedArea]);

  // Fit bounds on load
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || gridCells.length === 0 || !mapRef.current) return;
    const bounds = gridCells.reduce((r, c) => ({
      south: Math.min(r.south, c.bounds.south),
      west: Math.min(r.west, c.bounds.west),
      north: Math.max(r.north, c.bounds.north),
      east: Math.max(r.east, c.bounds.east),
    }), { south: Infinity, west: Infinity, north: -Infinity, east: -Infinity });
    mapRef.current.fitBounds(
      [[bounds.west, bounds.south], [bounds.east, bounds.north]],
      { padding: 60, duration: 1000 }
    );
    hasFitted.current = true;
  }, [gridCells]);

  // Fly to selected area
  useEffect(() => {
    if (!selectedArea || !mapRef.current) return;
    mapRef.current.fitBounds(
      [[selectedArea.bounds.west, selectedArea.bounds.south], [selectedArea.bounds.east, selectedArea.bounds.north]],
      { padding: 80, duration: 800 }
    );
  }, [selectedArea]);

  const handleGridClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature?.properties?.cellId) {
      setSelection({ kind: 'cell', id: feature.properties.cellId });
    }
  }, []);

  const handleClosePanel = () => setSelection(null);
  const showPanel = selectedCell || selectedArea;

  return (
    <div className="relative flex h-[calc(100vh-3rem)] w-full flex-col bg-slate-100">
      {/* Header overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-3">
        <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-3">
          <div className="rounded-xl bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
            <h1 className="text-base font-bold text-slate-900">Wireless Infrastructure Map</h1>
            <p className="text-[11px] text-slate-500">
              Explore wireless activity across the city with privacy-safe aggregated data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!loading && !error && presetAreas.length > 0 && (
              <div className="rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                <PresetAreaControls
                  areas={presetAreas}
                  selectedId={selectedArea?.id ?? null}
                  onSelect={(area) => setSelection({ kind: 'preset', id: area.id })}
                />
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-sm">
              <MapPin className="h-3 w-3 text-teal-600" />
              Vientiane, Laos
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative h-full w-full flex-1">
        <MapGL
          ref={mapRef}
          initialViewState={{
            ...DEFAULT_CENTER,
            zoom: 13,
            pitch: show3D ? 45 : 0,
            bearing: show3D ? -10 : 0,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          maxPitch={70}
          interactiveLayerIds={['grid-fill-flat', 'grid-fill-3d']}
          onClick={handleGridClick}
          cursor="pointer"
        >
          <NavigationControl position="top-left" visualizePitch />
          <GeolocateControl position="top-left" />

          {/* WiFi observation points — heatmap layer */}
          {wifiPointsGeoJSON && showHeatmap && (
            <Source id="wifi-points" type="geojson" data={wifiPointsGeoJSON}>
              <Layer
                id="wifi-heatmap"
                type="heatmap"
                paint={{
                  'heatmap-weight': ['get', 'weight'],
                  'heatmap-intensity': [
                    'interpolate', ['linear'], ['zoom'],
                    10, 0.5,
                    15, 1.5,
                  ],
                  'heatmap-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    10, 8,
                    13, 15,
                    16, 25,
                  ],
                  'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,0,0)',
                    0.1, 'rgba(20,184,166,0.15)',
                    0.3, 'rgba(13,148,136,0.35)',
                    0.5, 'rgba(15,61,62,0.50)',
                    0.7, 'rgba(245,158,11,0.65)',
                    0.9, 'rgba(239,68,68,0.80)',
                    1.0, 'rgba(220,38,38,0.90)',
                  ],
                  'heatmap-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    10, 0.8,
                    16, 0.5,
                  ],
                }}
              />
              {/* Individual points visible at higher zoom */}
              <Layer
                id="wifi-points-circle"
                type="circle"
                minzoom={14}
                paint={{
                  'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 2,
                    17, 5,
                  ],
                  'circle-color': '#0d9488',
                  'circle-opacity': 0.6,
                  'circle-stroke-width': 0.5,
                  'circle-stroke-color': '#ffffff',
                }}
              />
            </Source>
          )}

          {/* Grid cells — flat fill (always visible) */}
          {gridGeoJSON && (
            <Source id="grid-cells" type="geojson" data={gridGeoJSON}>
              <Layer
                id="grid-fill-flat"
                type="fill"
                paint={{
                  'fill-color': ['get', 'color'],
                  'fill-opacity': ['get', 'opacity'],
                }}
              />
              <Layer
                id="grid-outline"
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['==', ['get', 'selected'], 1], '#0f172a',
                    'rgba(255,255,255,0.7)',
                  ],
                  'line-width': [
                    'case',
                    ['==', ['get', 'selected'], 1], 3,
                    1,
                  ],
                }}
              />
              {/* 3D extrusion (optional toggle) */}
              {show3D && (
                <Layer
                  id="grid-fill-3d"
                  type="fill-extrusion"
                  paint={{
                    'fill-extrusion-color': ['get', 'color'],
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 0.65,
                  }}
                />
              )}
            </Source>
          )}

          {/* Selected area border */}
          {areaGeoJSON && (
            <Source id="selected-area" type="geojson" data={areaGeoJSON}>
              <Layer
                id="area-border"
                type="line"
                paint={{
                  'line-color': '#b45309',
                  'line-width': 3,
                  'line-dasharray': [4, 3],
                }}
              />
              <Layer
                id="area-fill"
                type="fill"
                paint={{
                  'fill-color': '#f59e0b',
                  'fill-opacity': 0.08,
                }}
              />
            </Source>
          )}
        </MapGL>

        {/* Layer toggle controls — bottom right */}
        {!loading && !error && (
          <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg transition-all ${
                showHeatmap
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle WiFi signal heatmap"
            >
              {showHeatmap ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Signal Heatmap
            </button>
            <button
              type="button"
              onClick={() => setShow3D(!show3D)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg transition-all ${
                show3D
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle 3D grid view"
            >
              <Layers className="h-3.5 w-3.5" />
              3D Grid
            </button>
          </div>
        )}

        {/* Legend — bottom left */}
        {!loading && !error && (
          <div className="absolute bottom-6 left-3 z-10">
            <GridLegend scale={intensityScale} metric={metric} />
          </div>
        )}

        {/* Floating Area Intelligence Panel */}
        {!loading && !error && showPanel && (
          <div className="absolute right-4 top-16 z-10 w-72 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white/98 p-4 shadow-xl backdrop-blur-sm">
            {selectedCell ? (
              <AreaIntelligencePanel
                title={`Cell ${selectedCell.cellId}`}
                metrics={selectedCell}
                onClose={handleClosePanel}
              />
            ) : selectedArea ? (
              <AreaIntelligencePanel
                title={selectedArea.name}
                metrics={selectedArea}
                area={selectedArea}
                onClose={handleClosePanel}
              />
            ) : null}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm" role="status">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
              <span className="text-sm font-medium text-slate-700">Loading survey data from CSV...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute left-1/2 top-20 z-20 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-lg" role="alert">
            <p className="text-sm font-medium">Unable to load survey data.</p>
            <p className="mt-1 break-words text-xs">{error}</p>
            <button type="button" onClick={retry} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
