import { useMemo, useState } from 'react';
import { AreaIntelligencePanel } from '@/components/map/AreaIntelligencePanel';
import { DatasetLimitations } from '@/components/DatasetLimitations';
import { useSpatialData } from '@/context/spatialContext';
import type { PresetArea } from '@/type/spatial';
import { interpretAreas } from '@/utils/spatialMetrics';

type AreaId = PresetArea['id'];

export default function ComparePage() {
  const { presetAreas, loading, error, retry } = useSpatialData();
  const [leftId, setLeftId] = useState<AreaId>('area-a');
  const [rightId, setRightId] = useState<AreaId>('area-b');
  const areaById = useMemo(() => new Map(presetAreas.map((area) => [area.id, area])), [presetAreas]);
  const left = areaById.get(leftId);
  const right = areaById.get(rightId);
  const statements = left && right ? interpretAreas(left, right) : [];

  const selectLeft = (id: AreaId) => {
    if (id !== rightId && areaById.has(id)) setLeftId(id);
  };
  const selectRight = (id: AreaId) => {
    if (id !== leftId && areaById.has(id)) setRightId(id);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 text-slate-800 sm:px-6 lg:py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Compare surveyed areas</h1>
        <p className="mt-3 leading-7 text-slate-700">
          LaoSence adds a digital-infrastructure layer to traditional site-screening data such as rent, access, POIs and demographics.
        </p>
      </header>

      {loading ? <p role="status">Loading preset area data...</p> : error ? (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          <p>Unable to load preset area data.</p>
          <p className="mt-1 break-words text-sm">{error}</p>
          <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-lg bg-red-700 px-4 font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Retry</button>
        </div>
      ) : !left || !right ? <p>No preset areas available for comparison.</p> : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <label htmlFor="compare-area-a" className="block text-sm font-semibold text-slate-900">Area A selection</label>
                <select
                  id="compare-area-a"
                  value={leftId}
                  onChange={(event) => selectLeft(event.target.value as AreaId)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  {presetAreas.map((area) => <option key={area.id} value={area.id} disabled={area.id === rightId}>{area.name}</option>)}
                </select>
              </div>
              <AreaIntelligencePanel title={left.name} metrics={left} area={left} showCompareLink={false} />
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <label htmlFor="compare-area-b" className="block text-sm font-semibold text-slate-900">Area B selection</label>
                <select
                  id="compare-area-b"
                  value={rightId}
                  onChange={(event) => selectRight(event.target.value as AreaId)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  {presetAreas.map((area) => <option key={area.id} value={area.id} disabled={area.id === leftId}>{area.name}</option>)}
                </select>
              </div>
              <AreaIntelligencePanel title={right.name} metrics={right} area={right} showCompareLink={false} />
            </div>
          </div>

          <section aria-labelledby="comparison-interpretation" aria-live="polite" className="rounded-xl bg-slate-100 p-5">
            <h2 id="comparison-interpretation" className="text-lg font-semibold text-slate-950">What the survey shows</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-6">
              {statements.map((statement) => <li key={statement}>{statement}</li>)}
            </ul>
          </section>
        </>
      )}

      <p className="max-w-4xl text-sm leading-6 text-slate-700">
        These indicators describe the surveyed wireless environment. They are intended as supplementary site-screening information and do not directly measure footfall, sales, internet performance, or property value.
      </p>
      <DatasetLimitations />
    </div>
  );
}
