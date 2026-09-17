import type { PresetArea } from '@/type/spatial';

interface PresetAreaControlsProps {
  areas: PresetArea[];
  selectedId: string | null;
  onSelect: (area: PresetArea) => void;
}

export function PresetAreaControls({ areas, selectedId, onSelect }: PresetAreaControlsProps) {
  return (
    <section aria-label="Preset areas">
      <h2 className="text-sm font-semibold text-slate-900">Preset areas</h2>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {areas.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-pressed={selectedId === area.id}
            onClick={() => onSelect(area)}
            className={`min-h-11 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${selectedId === area.id ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
          >
            {area.name}
          </button>
        ))}
      </div>
    </section>
  );
}
