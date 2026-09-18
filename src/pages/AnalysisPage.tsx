import { Wifi, Share2, Calendar } from 'lucide-react';
import AllChartContainer from '@/components/analysis/AllChartContainer';
import { DatasetLimitations } from '@/components/DatasetLimitations';
import { useSpatialData } from '@/context/spatialContext';

export default function AnalysisPage() {
  const { datasetSummary: summary, loading, error, retry } = useSpatialData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Network Analytics</h1>
            <p className="mt-1 text-sm text-slate-600">
              Discover wireless patterns and trends from urban data.
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
              {summary.historicalSurveyPeriod}
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
              <span className="text-sm font-medium text-slate-700">Analyzing survey data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
            <p>Unable to load survey analytics.</p>
            <p className="mt-1 break-words text-sm">{error}</p>
            <button type="button" onClick={retry} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Retry</button>
          </div>
        ) : summary ? (
          <>
            {/* Hero Stats */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                    <Wifi className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Observations</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {summary.observationCount.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Share2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Observed network identifiers (SSIDs)</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {summary.uniqueNetworkCount.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <AllChartContainer summary={summary} />

            {/* Dataset Limitations */}
            <div className="mt-2">
              <DatasetLimitations />
            </div>
          </>
        ) : (
          <p className="mt-6 text-slate-600">No recorded data</p>
        )}
      </div>
    </div>
  );
}
