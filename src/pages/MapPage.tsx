import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import MapGL, { NavigationControl, GeolocateControl, Source, Layer, AttributionControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Configure MapLibre GL worker for Vite compatibility
setWorkerUrl(
  new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href
);
import { MapPin, Layers, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const metric = DEFAULT_METRIC;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (panelExpanded && diff > 0) {
      setDragOffset(diff);
    } else if (!panelExpanded && diff < 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      if (panelExpanded) {
        if (dragOffset > 90) {
          handleClosePanel();
        } else if (dragOffset > 35) {
          setPanelExpanded(false);
        }
      } else {
        if (dragOffset < -25) {
          setPanelExpanded(true);
        }
      }
    }
    setIsDragging(false);
    setDragOffset(0);
    setTouchStartY(null);
  };

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

  // Build GeoJSON for individual WiFi observation points
  const wifiPointsGeoJSON = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
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
      setPanelExpanded(true);
    }
  }, []);

  const handleClosePanel = () => setSelection(null);
  const showPanel = selectedCell || selectedArea;

  return (
    <div className="relative flex h-[calc(100dvh-2.75rem)] w-full flex-col bg-slate-100 md:h-[calc(100vh-3rem)]">
      {/* ─── Header overlay ─── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 pt-2 md:px-4 md:pt-3">
        <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/92 p-2.5 shadow-md backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2">
          {/* Title & Live Status */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600"></span>
              </span>
              <div>
                <h1 className="text-xs font-bold text-slate-900 sm:text-sm">Wireless Infrastructure Map</h1>
                <p className="hidden text-[11px] text-slate-500 sm:block">250m spatial survey grid · Vientiane, Laos</p>
              </div>
            </div>
            {/* Location pill */}
            <div className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 sm:hidden">
              <MapPin className="h-3 w-3 text-teal-600" />
              Vientiane
            </div>
          </div>

          {/* Preset Area Controls */}
          {!loading && !error && presetAreas.length > 0 && (
            <div className="flex items-center gap-2 border-t border-slate-100 pt-1.5 sm:border-t-0 sm:pt-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">Explore area:</span>
              <PresetAreaControls
                areas={presetAreas}
                selectedId={selectedArea?.id ?? null}
                onSelect={(area) => { setSelection({ kind: 'preset', id: area.id }); setPanelExpanded(true); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Map ─── */}
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
          attributionControl={false}
          interactiveLayerIds={['grid-fill-flat', 'grid-fill-3d']}
          onClick={handleGridClick}
          cursor="pointer"
        >
          <AttributionControl compact={true} position="bottom-right" />
          <NavigationControl position="top-left" visualizePitch />
          <GeolocateControl position="top-left" />

          {/* WiFi heatmap */}
          {wifiPointsGeoJSON && showHeatmap && (
            <Source id="wifi-points" type="geojson" data={wifiPointsGeoJSON}>
              <Layer
                id="wifi-heatmap"
                type="heatmap"
                paint={{
                  'heatmap-weight': ['get', 'weight'],
                  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 1.5],
                  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 13, 15, 16, 25],
                  'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,0,0)', 0.1, 'rgba(20,184,166,0.15)', 0.3, 'rgba(13,148,136,0.35)',
                    0.5, 'rgba(15,61,62,0.50)', 0.7, 'rgba(245,158,11,0.65)',
                    0.9, 'rgba(239,68,68,0.80)', 1.0, 'rgba(220,38,38,0.90)',
                  ],
                  'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 0.5],
                }}
              />
              <Layer
                id="wifi-points-circle"
                type="circle"
                minzoom={14}
                paint={{
                  'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2, 17, 5],
                  'circle-color': '#0d9488',
                  'circle-opacity': 0.6,
                  'circle-stroke-width': 0.5,
                  'circle-stroke-color': '#ffffff',
                }}
              />
            </Source>
          )}

          {/* Grid cells */}
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
                  'line-color': ['case', ['==', ['get', 'selected'], 1], '#0f172a', 'rgba(255,255,255,0.7)'],
                  'line-width': ['case', ['==', ['get', 'selected'], 1], 3, 1],
                }}
              />
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
              <Layer id="area-border" type="line" paint={{ 'line-color': '#b45309', 'line-width': 3, 'line-dasharray': [4, 3] }} />
              <Layer id="area-fill" type="fill" paint={{ 'fill-color': '#f59e0b', 'fill-opacity': 0.08 }} />
            </Source>
          )}
        </MapGL>

        {/* ─── Toggle buttons — icon-only on mobile ─── */}
        {!loading && !error && (
          <div className="absolute bottom-20 right-2 z-10 flex flex-col gap-1.5 md:bottom-8 md:right-4">
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs font-medium shadow-lg transition-all md:px-3 md:py-2 ${
                showHeatmap ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Signal Heatmap"
            >
              {showHeatmap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="hidden md:inline">Signal Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => setShow3D(!show3D)}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs font-medium shadow-lg transition-all md:px-3 md:py-2 ${
                show3D ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="3D Grid"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden md:inline">3D Grid</span>
            </button>
            {show3D && (
              <p className="hidden max-w-48 rounded-lg bg-white/95 px-3 py-2 text-[11px] leading-4 text-slate-700 shadow-lg md:block">
                Taller cells represent more observed network identifiers per 250m cell.
              </p>
            )}
          </div>
        )}

        {/* ─── Legend — compact on mobile ─── */}
        {!loading && !error && (
          <div className="absolute bottom-20 left-2 z-10 md:bottom-8 md:left-4">
            <GridLegend scale={intensityScale} metric={metric} show3D={show3D} />
          </div>
        )}

        {/* ─── Area Intelligence Panel ─── */}
        {/* Desktop: floating right panel */}
        {!loading && !error && showPanel && (
          <div className="absolute right-4 top-20 z-10 hidden w-80 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/98 p-4 shadow-xl backdrop-blur-md md:block">
            {selectedCell ? (
              <AreaIntelligencePanel title={`Cell ${selectedCell.cellId}`} metrics={selectedCell} onClose={handleClosePanel} />
            ) : selectedArea ? (
              <AreaIntelligencePanel title={selectedArea.name} metrics={selectedArea} area={selectedArea} onClose={handleClosePanel} />
            ) : null}
          </div>
        )}

        {/* Mobile: bottom sheet panel with touch drag swipe down gesture */}
        {!loading && !error && showPanel && (
          <div
            className={`absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl md:hidden ${
              panelExpanded ? 'max-h-[65dvh]' : 'max-h-16'
            }`}
            style={{
              transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out, max-height 0.3s ease-out',
            }}
          >
            {/* Drag handle with touch gesture listeners */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setPanelExpanded(!panelExpanded)}
              className="flex w-full cursor-grab active:cursor-grabbing flex-col items-center justify-center py-2 select-none"
            >
              <div className="h-1.5 w-10 rounded-full bg-slate-300 transition-colors hover:bg-slate-400" />
              <div className="mt-0.5 text-slate-400">
                {panelExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </div>
            </div>

            {/* Panel title when collapsed */}
            {!panelExpanded && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="flex items-center justify-between px-4 pb-2 select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {selectedCell ? `Cell ${selectedCell.cellId}` : selectedArea?.name}
                  </span>
                  <span className="text-[11px] text-slate-400">Tap or swipe up to expand</span>
                </div>
                <button type="button" onClick={handleClosePanel} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
              </div>
            )}

            {/* Panel content when expanded */}
            {panelExpanded && (
              <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(65dvh - 3rem)' }}>
                {selectedCell ? (
                  <AreaIntelligencePanel title={`Cell ${selectedCell.cellId}`} metrics={selectedCell} onClose={handleClosePanel} />
                ) : selectedArea ? (
                  <AreaIntelligencePanel title={selectedArea.name} metrics={selectedArea} area={selectedArea} onClose={handleClosePanel} />
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm" role="status">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
              <span className="text-sm font-medium text-slate-700">Loading survey data...</span>
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
