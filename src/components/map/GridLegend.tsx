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
      className="max-w-44 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm md:max-w-none md:px-4 md:py-3"
      aria-label="Map legend"
    >
      <h2 className="text-[11px] font-semibold text-slate-800 md:text-xs">
        Wireless Infrastructure Intensity
      </h2>
      <p className="mt-0.5 text-[10px] leading-3.5 text-slate-600 md:mt-1 md:max-w-60 md:text-[11px] md:leading-4">
        Based on unique network identifiers observed per survey cell.
      </p>
      {show3D && (
        <p className="mt-0.5 text-[10px] leading-3.5 font-medium text-teal-800 md:mt-1 md:text-[11px] md:leading-4">
          3D height = observed network identifiers per 250m cell.
        </p>
      )}

      {/* Gradient bar */}
      <div className="mt-1.5 flex items-center gap-1.5 md:mt-2 md:gap-2">
        <span className="text-[9px] text-slate-500 md:text-[10px]">Fewer</span>
        <div
          className="h-2 flex-1 rounded-full md:h-2.5"
          style={{
            background: `linear-gradient(to right, ${scale.bins.map((b) => b.color).join(', ')})`,
          }}
        />
        <span className="text-[9px] text-slate-500 md:text-[10px]">More</span>
      </div>

      {/* Scale bar — desktop only */}
      <div className="mt-1.5 hidden items-center gap-1.5 md:flex">
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
