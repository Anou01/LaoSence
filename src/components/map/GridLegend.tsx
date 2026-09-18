import type { SpatialMetric } from '@/type/spatial';
import type { IntensityScale } from '@/utils/spatialMetrics';

interface GridLegendProps {
  scale: IntensityScale;
  metric: SpatialMetric;
  show3D?: boolean;
}

export function GridLegend({ scale, metric, show3D = false }: GridLegendProps) {
  if (scale.bins.length === 0) return null;

  return (
    <section
      className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm"
      aria-label="Map legend"
    >
      <h2 className="text-xs font-semibold text-slate-800">
        Wireless Infrastructure Intensity
      </h2>
      <p className="mt-1 max-w-60 text-[11px] leading-4 text-slate-600">
        Based on unique network identifiers observed per survey cell.
      </p>
      {show3D && (
        <p className="mt-1 text-[11px] leading-4 font-medium text-teal-800">
          3D height = observed network identifiers per 250m cell.
        </p>
      )}

      {/* Gradient bar */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-slate-500">Fewer identifiers</span>
        <div
          className="h-2.5 flex-1 rounded-full"
          style={{
            background: `linear-gradient(to right, ${scale.bins.map((b) => b.color).join(', ')})`,
          }}
        />
        <span className="text-[10px] text-slate-500">More identifiers</span>
      </div>

      {/* Scale bar */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          <div className="h-px w-4 bg-slate-400" />
          <div className="h-px w-4 bg-slate-400" />
          <div className="h-px w-8 bg-slate-400" />
        </div>
        <span className="text-[10px] text-slate-500">0 &nbsp; 1 &nbsp; 2 km</span>
      </div>

      {metric !== 'infrastructure' && (
        <p className="mt-1 text-[10px] text-slate-400">
          Metric values are shown within this survey.
        </p>
      )}
    </section>
  );
}
