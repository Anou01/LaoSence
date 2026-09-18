import { useMemo, useState } from 'react';
import { Plus, X, Activity, Radio, Shield, Signal, Wifi, MapPin } from 'lucide-react';
import { DatasetLimitations } from '@/components/DatasetLimitations';
import { useSpatialData } from '@/context/spatialContext';
import type { AggregateMetrics } from '@/type/spatial';
import { generateCompareInsights } from '@/utils/analyzeWiFiData';
import { knownBandShares } from '@/utils/spatialMetrics';

interface CompareSlot {
  id: string;
  name: string;
  metrics: AggregateMetrics;
  color: string;
  gridId?: string;
}

const SLOT_COLORS = ['#0d9488', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

const ICON_MAP = {
  activity: Activity,
  signal: Signal,
  shield: Shield,
  radio: Radio,
};

const SECURITY_COLORS: Record<string, string> = {
  Open: '#ef4444',
  OWE: '#22c55e',
  'WPA Personal': '#f59e0b',
  'WPA2 Personal': '#0f766e',
  'WPA2 Enterprise': '#0d9488',
  'WPA3 Personal': '#22c55e',
};

export default function ComparePage() {
  const { presetAreas, gridCells, loading, error, retry } = useSpatialData();
  const [selectedSlots, setSelectedSlots] = useState<CompareSlot[] | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const slots = selectedSlots ?? presetAreas.slice(0, 2).map((area, i) => ({
    id: area.id,
    name: area.name,
    metrics: area as AggregateMetrics,
    color: SLOT_COLORS[i],
    gridId: area.cellIds[0]?.slice(0, 4),
  }));

  // Available areas (preset + top grid cells not already selected)
  const availableAreas = useMemo(() => {
    const selectedIds = new Set(slots.map((s) => s.id));
    const items: { id: string; name: string; metrics: AggregateMetrics; gridId: string }[] = [];

    // Preset areas
    for (const area of presetAreas) {
      if (!selectedIds.has(area.id)) {
        items.push({ id: area.id, name: area.name, metrics: area, gridId: area.cellIds[0]?.slice(0, 4) ?? '' });
      }
    }

    // Top grid cells by network count
    const topCells = [...gridCells]
      .sort((a, b) => b.uniqueNetworkCount - a.uniqueNetworkCount)
      .slice(0, 20);

    for (const cell of topCells) {
      if (!selectedIds.has(cell.cellId)) {
        items.push({
          id: cell.cellId,
          name: `Cell ${cell.cellId}`,
          metrics: cell,
          gridId: cell.cellId,
        });
      }
    }

    return items;
  }, [presetAreas, gridCells, slots]);

  const addSlot = (item: typeof availableAreas[0]) => {
    if (slots.length >= 5) return;
    setSelectedSlots([...slots, {
      id: item.id,
      name: item.name,
      metrics: item.metrics,
      color: SLOT_COLORS[slots.length % SLOT_COLORS.length],
      gridId: item.gridId,
    }]);
    setShowAddDialog(false);
  };

  const removeSlot = (id: string) => {
    setSelectedSlots(slots.filter((s) => s.id !== id));
  };

  // Generate insights between first two areas
  const insights = useMemo(() => {
    if (slots.length < 2) return [];
    return generateCompareInsights(slots[0].name, slots[1].name, slots[0].metrics, slots[1].metrics);
  }, [slots]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
          <span className="text-sm font-medium text-slate-700">Loading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl bg-red-50 p-4 text-red-800" role="alert">
          <p>Unable to load data.</p>
          <p className="mt-1 break-words text-sm">{error}</p>
          <button type="button" onClick={retry} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 text-slate-800 sm:space-y-6 sm:px-6 sm:py-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Compare Areas</h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Compare equal-size surveyed areas using measured wireless indicators.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          disabled={slots.length >= 5}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Area
        </button>
      </header>

      {slots.length >= 2 && (
        <p className="text-center text-sm font-semibold text-slate-700">
          {slots[0].name} <span className="mx-2 text-teal-700">vs</span> {slots[1].name}
          {presetAreas.some((area) => area.id === slots[0].id) && presetAreas.some((area) => area.id === slots[1].id) && (
            <span className="ml-2 font-normal text-slate-500">· 0.5625 km² each</span>
          )}
        </p>
      )}

      {/* Add Area Dialog */}
      {showAddDialog && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Select an area to add</h3>
            <button type="button" onClick={() => setShowAddDialog(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availableAreas.slice(0, 12).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addSlot(item)}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm transition-all hover:border-teal-300 hover:bg-teal-50"
              >
                <Wifi className="h-4 w-4 text-teal-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-500">{item.metrics.uniqueNetworkCount} networks · {item.metrics.observationCount} obs</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Area Cards */}
      {slots.length > 0 && (
        <div className={`grid gap-3 sm:gap-4 ${slots.length === 1 ? '' : slots.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : slots.length === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          {slots.map((slot) => (
            <div key={slot.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: slot.color + '15' }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: slot.color }}>
                    <MapPin className="h-3 w-3 text-white" fill="white" />
                  </div>
                  <span className="text-sm font-bold" style={{ color: slot.color }}>{slot.name}</span>
                </div>
                {slots.length > 1 && (
                  <button type="button" onClick={() => removeSlot(slot.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-slate-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="px-4 py-1 text-[11px] text-slate-500">Grid ID: LA-VT-{slot.gridId}</div>

              {/* Gradient placeholder thumbnail */}
              <div className="mx-4 h-16 rounded-lg bg-gradient-to-br from-teal-400/20 via-emerald-200/30 to-sky-300/20 flex items-center justify-center text-[10px] text-teal-600/50">
                {slot.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Table */}
      {slots.length >= 2 && (
        <div className="-mx-3 overflow-x-auto sm:mx-0 sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm">
        <div className="min-w-[480px] rounded-xl border border-slate-200 bg-white shadow-sm sm:min-w-0 sm:border-0 sm:shadow-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-600 sm:px-4 sm:py-3 sm:w-48"></th>
                {slots.map((slot) => (
                  <th key={slot.id} className="px-3 py-2.5 text-center text-xs font-bold sm:px-4 sm:py-3" style={{ color: slot.color }}>
                    {slot.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="Observed network identifiers"
                icon={<Wifi className="h-3.5 w-3.5" />}
                values={slots.map((s) => s.metrics.uniqueNetworkCount.toLocaleString())}
              />
              <CompareRow
                label="Observations"
                icon={<Activity className="h-3.5 w-3.5" />}
                values={slots.map((s) => s.metrics.observationCount.toLocaleString())}
              />
              <CompareRow
                label="Median recorded signal"
                icon={<Signal className="h-3.5 w-3.5" />}
                values={slots.map((s) => s.metrics.medianSignalDbm !== null ? `${s.metrics.medianSignalDbm} dBm` : '—')}
              />
              <CompareRow
                label="2.4 GHz share"
                icon={<Radio className="h-3.5 w-3.5" />}
                values={slots.map((s) => {
                  const shares = knownBandShares(s.metrics.bandCounts);
                  return shares.twoPointFour !== null ? `${Math.round(shares.twoPointFour * 100)}%` : '—';
                })}
              />
              <CompareRow
                label="5 GHz share"
                icon={<Radio className="h-3.5 w-3.5" />}
                values={slots.map((s) => {
                  const shares = knownBandShares(s.metrics.bandCounts);
                  return shares.five !== null ? `${Math.round(shares.five * 100)}%` : '—';
                })}
              />
              {/* Security mix row */}
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs text-slate-600 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Advertised security mix
                </td>
                {slots.map((slot) => {
                  const total = slot.metrics.observationCount;
                  return (
                    <td key={slot.id} className="px-4 py-3">
                      {/* Stacked bar */}
                      <div className="flex h-2 w-full overflow-hidden rounded-full">
                        {Object.entries(slot.metrics.authenticationCounts)
                          .sort(([, a], [, b]) => b - a)
                          .map(([label, count]) => (
                            <div
                              key={label}
                              style={{
                                width: `${total > 0 ? (count / total) * 100 : 0}%`,
                                backgroundColor: SECURITY_COLORS[label] ?? '#94a3b8',
                              }}
                            />
                          ))}
                      </div>
                      <div className="mt-2 space-y-0.5">
                        {Object.entries(slot.metrics.authenticationCounts)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([label, count]) => (
                            <div key={label} className="flex items-center gap-1.5 text-[10px]">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: SECURITY_COLORS[label] ?? '#94a3b8' }} />
                              <span className="text-slate-600">{label}</span>
                              <span className="ml-auto font-medium tabular-nums">{total > 0 ? `${Math.round((count / total) * 100)}%` : '—'}</span>
                            </div>
                          ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
              {/* Top channels */}
              <CompareRow
                label="Most observed channels"
                icon={<Activity className="h-3.5 w-3.5" />}
                values={slots.map((s) =>
                  s.metrics.topChannels.slice(0, 3).map((ch) => ch.channel).join(', ') || '—'
                )}
              />
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <section className="rounded-xl bg-slate-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-teal-600" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
            What the survey shows
          </h2>
          <div className={`mt-4 grid gap-4 ${insights.length >= 3 ? 'md:grid-cols-3' : insights.length === 2 ? 'md:grid-cols-2' : ''}`}>
            {insights.map((insight, i) => {
              const IconComp = ICON_MAP[insight.icon];
              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{insight.title}</h3>
                  </div>
                  <p className="text-xs leading-5 text-slate-600">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <DatasetLimitations />
    </div>
  );
}

function CompareRow({ label, icon, values }: { label: string; icon: React.ReactNode; values: string[] }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="sticky left-0 bg-white px-3 py-2.5 text-xs text-slate-600 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-2">{icon}<span className="whitespace-nowrap">{label}</span></div>
      </td>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-2.5 text-center text-sm font-bold tabular-nums text-slate-900 sm:px-4 sm:py-3">{v}</td>
      ))}
    </tr>
  );
}
