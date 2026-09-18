import { Link } from 'react-router-dom';
import { X, Wifi, Radio, Signal, Activity } from 'lucide-react';
import type { AggregateMetrics, PresetArea } from '@/type/spatial';
import { areaPresentation } from '@/utils/areaPresentation';

interface AreaIntelligencePanelProps {
  title: string;
  metrics: AggregateMetrics;
  area?: PresetArea;
  showCompareLink?: boolean;
  onClose?: () => void;
}

const SECURITY_COLORS: Record<string, string> = {
  Open: '#ef4444',
  OWE: '#22c55e',
  'WPA Personal': '#f59e0b',
  'WPA2 Personal': '#0f766e',
  'WPA2 Enterprise': '#0d9488',
  'WPA3 Personal': '#22c55e',
};

export function AreaIntelligencePanel({
  title,
  metrics,
  area,
  showCompareLink = true,
  onClose,
}: AreaIntelligencePanelProps) {
  const values = areaPresentation(metrics);

  return (
    <section
      data-testid="area-intelligence"
      aria-label={`${title} intelligence`}
      className="space-y-4 text-sm text-slate-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Area Intelligence</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Area name + ID */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-slate-900">
            {area ? title : <>Cell <span data-testid="selected-cell-id">{title.replace('Cell ', '')}</span></>}
          </p>
          {area && (
            <p className="text-[11px] text-slate-500">
              Grid ID: LA-VT-{area.cellIds[0]?.slice(0, 4)}
              <br />
              {area.bounds.north.toFixed(4)}, {area.bounds.west.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Thumbnail placeholder */}
      <div className="h-20 overflow-hidden rounded-lg bg-gradient-to-br from-teal-400/20 via-emerald-200/30 to-sky-300/20">
        <div className="flex h-full items-center justify-center text-xs text-teal-600/60">
          {area ? `${area.name} · ${area.areaKm2Approx.toFixed(2)} km²` : title}
        </div>
      </div>

      {/* Metrics rows with icons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Wifi className="h-3.5 w-3.5" />
            <span className="text-xs">Observed network identifiers (SSIDs)</span>
          </div>
          <span className="text-base font-bold tabular-nums text-slate-900">{values.identifiers}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Radio className="h-3.5 w-3.5" />
            <span className="text-xs">Observations</span>
          </div>
          <span className="text-base font-bold tabular-nums text-slate-900">{values.observations}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Signal className="h-3.5 w-3.5" />
            <span className="text-xs">Median signal</span>
          </div>
          <span className="text-base font-bold tabular-nums text-slate-900">{values.medianSignal}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-xs">2.4 GHz share</span>
          </div>
          <span className="text-base font-bold tabular-nums text-slate-900">{values.twoPointFourShare}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-xs">5 GHz share</span>
          </div>
          <span className="text-base font-bold tabular-nums text-slate-900">{values.fiveShare}</span>
        </div>
      </div>

      {/* Security mix */}
      <div>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
          Security mix
        </h3>
        {values.securityMix.length === 0 ? (
          <p className="mt-2 text-slate-500">No recorded data</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {values.securityMix.map(({ label, percentage }) => (
              <li key={label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SECURITY_COLORS[label] ?? '#64748b' }}
                  />
                  <span className="text-xs text-slate-600">{label}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-700">{percentage}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Most observed channels */}
      <div>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M3 13h2v8H3zm4-4h2v12H7zm4-4h2v16h-2zm4 4h2v12h-2zm4 4h2v8h-2z" /></svg>
          Most observed channels
        </h3>
        {values.channels.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No recorded channels</p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1">
            {values.channels.map(({ channel, observations }) => (
              <div key={channel} className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-slate-700">{channel}</span>
                <span className="text-[10px] tabular-nums text-slate-500">
                  {metrics.observationCount > 0
                    ? `${Math.round((observations / metrics.observationCount) * 100)}%`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {area && showCompareLink && (
        <Link
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline underline-offset-2 transition-colors hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          to="/compare"
        >
          Compare areas →
        </Link>
      )}
    </section>
  );
}
