import type { PresetArea } from '@/type/spatial';

interface PresetAreaControlsProps {
  areas: PresetArea[];
  selectedId: string | null;
  onSelect: (area: PresetArea) => void;
}

export function PresetAreaControls({ areas, selectedId, onSelect }: PresetAreaControlsProps) {
  return (
    <div className="flex items-center gap-2" aria-label="Explore area">
      {areas.map((area) => {
        const selected = selectedId === area.id;
        return (
          <button
            key={area.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(area)}
            className={`min-w-20 rounded-lg border px-4 py-2 text-sm font-bold shadow-sm transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              selected
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 hover:shadow-md'
            }`}
          >
            {area.name}
          </button>
        );
      })}
    </div>
  );
}
