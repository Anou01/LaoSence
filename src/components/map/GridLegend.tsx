import type { SpatialMetric } from '@/type/spatial';
import type { IntensityScale } from '@/utils/spatialMetrics';

interface GridLegendProps {
  scale: IntensityScale;
  metric: SpatialMetric;
}

export function GridLegend({ scale, metric }: GridLegendProps) {
  return (
    <section className="w-64 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur" aria-label="Map legend">
      <h2 className="text-sm font-semibold text-slate-900">Wireless Infrastructure Intensity</h2>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Based on unique network identifiers observed per survey cell
      </p>
      {metric !== 'infrastructure' && (
        <p className="mt-2 text-xs text-slate-500">Metric values are shown within this survey.</p>
      )}
      {scale.bins.length === 0 ? (
        <p className="mt-3 text-xs text-slate-600">No published survey cells</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {scale.bins.map((bin) => (
            <li key={`${bin.label}-${bin.upperInclusive ?? 'max'}`} className="flex items-center gap-2 text-xs text-slate-700">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-sm border border-slate-300"
                style={{ backgroundColor: bin.color }}
              />
              <span>{bin.label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
