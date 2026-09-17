import { useMemo } from 'react';
import AllChartContainer from '@/components/analysis/AllChartContainer';
import { useWiFiData } from '@/context/WiFiDataContext';
import { getObservationMetrics } from '@/utils/analysisUtils';

export default function AnalysisPage() {
  const { wifiData, loading, error } = useWiFiData();
  const metrics = useMemo(() => getObservationMetrics(wifiData), [wifiData]);

  return <div className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">LaoSence</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Wireless Intelligence</h1>
      <p className="mt-2 text-slate-600">Chanthabuly survey dataset · historical observations from approximately Nov 2024–Mar 2025</p>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Observations</p>
          <p className="text-3xl font-bold text-slate-900">{loading ? 'Loading…' : metrics.observationCount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Unique network identifiers (BSSIDs)</p>
          <p className="text-3xl font-bold text-slate-900">{loading ? 'Loading…' : metrics.uniqueBssidCount.toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
        Metrics describe wireless infrastructure observed by this survey. They do not measure population, customer footfall,
        internet speed, sales, or property value. This is historical survey coverage, not live citywide coverage.
      </p>
    </div>
    <div className="mx-auto max-w-7xl"><AllChartContainer /></div>
  </div>;
}
