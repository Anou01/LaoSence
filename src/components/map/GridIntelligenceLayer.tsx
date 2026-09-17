import { Rectangle, Tooltip } from 'react-leaflet';
import type { GridCell, SpatialMetric } from '@/type/spatial';
import {
  buildIntensityScale,
  colorForIntensity,
  metricValue,
  type IntensityScale,
  NO_DATA_COLOR,
} from '@/utils/spatialMetrics';

interface GridIntelligenceLayerProps {
  cells: GridCell[];
  selectedCellId: string | null;
  onSelect: (cell: GridCell) => void;
  metric: SpatialMetric;
  scale?: IntensityScale;
}

export function GridIntelligenceLayer({
  cells,
  selectedCellId,
  onSelect,
  metric,
  scale,
}: GridIntelligenceLayerProps) {
  const intensityScale = scale ?? buildIntensityScale(cells);

  return (
    <>
      {cells.map((cell) => {
        const selected = cell.cellId === selectedCellId;
        const color = colorForIntensity(intensityScale, metricValue(cell, metric));
        return (
          <Rectangle
            key={cell.cellId}
            bounds={[
              [cell.bounds.south, cell.bounds.west],
              [cell.bounds.north, cell.bounds.east],
            ]}
            pathOptions={{
              color: selected ? '#0f172a' : '#ffffff',
              weight: selected ? 3 : 1,
              fillColor: color,
              fillOpacity: color === NO_DATA_COLOR ? 0.45 : 0.65,
            }}
            eventHandlers={{ click: () => onSelect(cell) }}
          >
            <Tooltip>
              Cell {cell.cellId}: {cell.uniqueNetworkCount} observed network identifiers
            </Tooltip>
          </Rectangle>
        );
      })}
    </>
  );
}
