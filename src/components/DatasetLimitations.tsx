import { AlertTriangle } from 'lucide-react';

export function DatasetLimitations() {
  return (
    <section aria-labelledby="dataset-limitations-title" className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <h2 id="dataset-limitations-title" className="flex items-center gap-2 text-sm font-bold text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Dataset limitations
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900/80">
        <li>Data is collected from passive, wardriving observations and may not represent all networks in an area.</li>
        <li>Locations are aggregated into grid cells to preserve privacy.</li>
        <li>Signal strength and counts are indicative only and can be affected by environment, device type, and time of day.</li>
      </ul>
    </section>
  );
}
