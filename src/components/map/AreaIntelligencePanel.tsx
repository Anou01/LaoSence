import { Link } from 'react-router-dom';
import { X, Wifi, Radio, Signal, Activity, Shield, GitCompareArrows } from 'lucide-react';
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
  'WPA2 Personal': '#0d9488',
  'WPA2 Enterprise': '#0891b2',
  'WPA3 Personal': '#22c55e',
};

function getSignalQuality(medianDbm: number | null) {
  if (medianDbm === null) return { label: 'No data', color: 'bg-slate-100 text-slate-600', bars: 0 };
  if (medianDbm >= -65) return { label: 'Strong', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bars: 4 };
  if (medianDbm >= -75) return { label: 'Good', color: 'bg-teal-50 text-teal-700 border border-teal-200', bars: 3 };
  if (medianDbm >= -85) return { label: 'Fair', color: 'bg-amber-50 text-amber-700 border border-amber-200', bars: 2 };
  return { label: 'Weak', color: 'bg-rose-50 text-rose-700 border border-rose-200', bars: 1 };
}

export function AreaIntelligencePanel({
  title,
  metrics,
  area,
  showCompareLink = true,
  onClose,
}: AreaIntelligencePanelProps) {
  const values = areaPresentation(metrics);
  const signalQuality = getSignalQuality(metrics.medianSignalDbm);

  // Parse 2.4G & 5G numbers for the visual progress bar
  const twoFourPct = parseInt(values.twoPointFourShare, 10) || 0;
  const fivePct = parseInt(values.fiveShare, 10) || 0;

  return (
    <section
      data-testid="area-intelligence"
      aria-label={`${title} intelligence`}
      className="space-y-3 text-sm text-slate-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {area ? title : <>Cell <span data-testid="selected-cell-id">{title.replace('Cell ', '')}</span></>}
            </h2>
            {area && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                {area.areaKm2Approx.toFixed(2)} km²
              </span>
            )}
          </div>
          {area ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Grid ID: <span className="font-mono text-slate-700">LA-VT-{area.cellIds[0]?.slice(0, 4)}</span> · {area.bounds.north.toFixed(4)}, {area.bounds.west.toFixed(4)}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">250m Survey Cell Unit</p>
          )}
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

      {/* Primary KPI 2-Column Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Wifi className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-[11px] font-medium">Network IDs</span>
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{values.identifiers}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Radio className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-[11px] font-medium">Observations</span>
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{values.observations}</p>
        </div>
      </div>

      {/* Signal Strength Quality Meter */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Signal className="h-3.5 w-3.5 text-teal-600" />
            <span>Median Recorded Signal</span>
          </div>
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${signalQuality.color}`}>
            {signalQuality.label}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-bold tabular-nums text-slate-900">{values.medianSignal}</span>
          {/* Signal 4-bar indicator */}
          <div className="flex items-end gap-1" title={signalQuality.label}>
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-1.5 rounded-xs transition-all ${
                  bar <= signalQuality.bars
                    ? bar <= 2
                      ? 'bg-amber-500'
                      : 'bg-teal-600'
                    : 'bg-slate-200'
                }`}
                style={{ height: `${bar * 4 + 4}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dual-Band Distribution (Visual Segmented Bar) */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-teal-600" />
            <span>Frequency Bands</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-700">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              2.4 GHz <b className="text-slate-900">{values.twoPointFourShare}</b>
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              5 GHz <b className="text-slate-900">{values.fiveShare}</b>
            </span>
          </div>
        </div>
        {/* Segmented spectrum bar */}
        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          {twoFourPct > 0 && (
            <div
              className="bg-teal-600 transition-all"
              style={{ width: `${twoFourPct}%` }}
              title={`2.4 GHz: ${values.twoPointFourShare}`}
            />
          )}
          {fivePct > 0 && (
            <div
              className="bg-blue-600 transition-all"
              style={{ width: `${fivePct}%` }}
              title={`5 GHz: ${values.fiveShare}`}
            />
          )}
        </div>
      </div>

      {/* Advertised Security Mix */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
        <h3 className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Shield className="h-3.5 w-3.5 text-teal-600" />
          <span>Advertised Security Mix</span>
        </h3>
        {values.securityMix.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500">No recorded data</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {values.securityMix.slice(0, 4).map(({ label, percentage }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: SECURITY_COLORS[label] ?? '#64748b' }}
                  />
                  <span className="text-slate-700">{label}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-900">{percentage}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Channels as Badges */}
      {values.channels.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium text-slate-600">Most Observed Channels</h3>
          <div className="flex flex-wrap gap-1.5">
            {values.channels.map(({ channel, observations }) => (
              <div
                key={channel}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-2xs"
              >
                <span className="font-semibold text-slate-800">Ch {channel}</span>
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {metrics.observationCount > 0
                    ? `${Math.round((observations / metrics.observationCount) * 100)}%`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrated Action Footer */}
      {area && showCompareLink && (
        <div className="pt-1">
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            to="/compare"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare this area →
          </Link>
        </div>
      )}
    </section>
  );
}
