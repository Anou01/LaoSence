import type { PresetArea } from '@/type/spatial';

interface PresetAreaControlsProps {
  areas: PresetArea[];
  selectedId: string | null;
  onSelect: (area: PresetArea) => void;
}

export function PresetAreaControls({ areas, selectedId, onSelect }: PresetAreaControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {areas.map((area) => {
        const selected = selectedId === area.id;
        return (
          <button
            key={area.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(area)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              selected
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 hover:shadow-md'
            }`}
          >
            {area.name}
          </button>
        );
      })}
    </div>
  );
}
