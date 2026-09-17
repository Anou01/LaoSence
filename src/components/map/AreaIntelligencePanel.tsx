import { Link } from 'react-router-dom';
import type { AggregateMetrics, PresetArea } from '@/type/spatial';
import { areaPresentation } from '@/utils/areaPresentation';

interface AreaIntelligencePanelProps {
  title: string;
  metrics: AggregateMetrics;
  area?: PresetArea;
}

export function AreaIntelligencePanel({ title, metrics, area }: AreaIntelligencePanelProps) {
  const values = areaPresentation(metrics);

  return (
    <section data-testid="area-intelligence" aria-label={`${title} intelligence`} className="space-y-4 text-sm text-slate-800">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          {area ? title : <>Cell <span data-testid="selected-cell-id">{title.replace('Cell ', '')}</span></>}
        </h2>
        {area ? (
          <p className="mt-1 text-xs leading-5 text-slate-600">
            750 m × 750 m · approximately {area.areaKm2Approx.toFixed(2)} km²<br />
            Published coverage: {area.publishedCellCount}/9 cells
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div><dt className="text-xs text-slate-600">Observed network identifiers</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{values.identifiers}</dd></div>
        <div><dt className="text-xs text-slate-600">Observations</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{values.observations}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-slate-600">Median recorded signal</dt><dd className="mt-1 font-semibold tabular-nums">{values.medianSignal}</dd></div>
        <div><dt className="text-xs text-slate-600">2.4 GHz share</dt><dd className="mt-1 font-semibold tabular-nums">{values.twoPointFourShare}</dd></div>
        <div><dt className="text-xs text-slate-600">5 GHz share</dt><dd className="mt-1 font-semibold tabular-nums">{values.fiveShare}</dd></div>
      </dl>

      <p className="text-xs leading-5 text-slate-600">
        Band shares use observations with a known 2.4 or 5 GHz band. Unknown band: {values.unknownBandObservations.toLocaleString('en-US')} observations.
      </p>

      <div>
        <h3 className="font-semibold">Advertised security mix</h3>
        <p className="mt-1 text-xs text-slate-600">Percentages use all observations, including Other / Unknown.</p>
        {values.securityMix.length === 0 ? <p className="mt-2 text-slate-600">No recorded data</p> : (
          <ul className="mt-2 space-y-1">
            {values.securityMix.map(({ label, observations, percentage }) => (
              <li key={label} className="flex justify-between gap-3">
                <span>{label}</span><span className="shrink-0 tabular-nums">{observations.toLocaleString('en-US')} · {percentage}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-semibold">Most observed channels</h3>
        {values.channels.length === 0 ? <p className="mt-2 text-slate-600">No recorded channels</p> : (
          <ol className="mt-2 space-y-1">
            {values.channels.map(({ channel, observations }) => (
              <li key={channel} className="flex justify-between gap-3">
                <span>Channel {channel}</span><span className="tabular-nums">{observations.toLocaleString('en-US')} observations</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      {area && <Link className="inline-block font-semibold text-teal-800 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800" to="/compare">Compare areas</Link>}
    </section>
  );
}
