import AllChartContainer from '@/components/analysis/AllChartContainer';
import { DatasetLimitations } from '@/components/DatasetLimitations';
import { useSpatialData } from '@/context/spatialContext';

export default function AnalysisPage() {
  const { datasetSummary: summary, loading, error, retry } = useSpatialData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-950">Wireless Intelligence</h1>
        {loading ? <p className="mt-4" role="status">Loading aggregate survey summary...</p> : error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-800" role="alert">
            <p>Unable to load survey analytics.</p>
            <p className="mt-1 break-words text-sm">{error}</p>
            <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-lg bg-red-700 px-4 font-semibold text-white hover:bg-red-800">Retry</button>
          </div>
        ) : summary ? (
          <>
            <p className="mt-2 text-slate-600">{summary.sourceLabel} · {summary.historicalSurveyPeriod}</p>
            {summary.rejectedObservationCount > 0 && (
              <p className="mt-3 text-sm text-slate-600">
                Accepted {summary.observationCount.toLocaleString('en-US')} of {summary.inputObservationCount.toLocaleString('en-US')} input Observations; rejected {summary.rejectedObservationCount.toLocaleString('en-US')}.
              </p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-600">Observations</p>
                <p className="text-3xl font-bold tabular-nums text-slate-950">{summary.observationCount.toLocaleString('en-US')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-600">Observed network identifiers</p>
                <p className="text-3xl font-bold tabular-nums text-slate-950">{summary.uniqueNetworkCount.toLocaleString('en-US')}</p>
              </div>
            </div>
          </>
        ) : <p className="mt-4">No recorded data</p>}
        <div className="mt-5"><DatasetLimitations /></div>
      </div>
      {summary && !loading && !error && <div className="mx-auto max-w-7xl"><AllChartContainer summary={summary} /></div>}
    </div>
  );
}
