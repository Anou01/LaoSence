import { AlertTriangle } from 'lucide-react';

export function DatasetLimitations() {
  return (
    <section aria-labelledby="dataset-limitations-title" className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <h2 id="dataset-limitations-title" className="flex items-center gap-2 text-sm font-bold text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Dataset limitations
      </h2>
      <p className="mt-2 text-xs leading-5 text-amber-900/80">
        Historical passive wireless observations; coverage may vary. These indicators describe observed wireless infrastructure and do not directly measure population, footfall, sales, internet speed, or business suitability.
      </p>
    </section>
  );
}
