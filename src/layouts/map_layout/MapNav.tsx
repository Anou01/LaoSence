import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MapNavProps {
  onFilterChange: (filter: string) => void;
  onSearchChange: (query: string) => void;
  currentFilter: string;
  searchQuery: string;
}

export default function MapNav({ onFilterChange, onSearchChange, currentFilter, searchQuery }: MapNavProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    // Real-time search as user types
    onSearchChange(value);
  };

  return (
    <div className="h-auto md:h-12 w-full flex flex-col items-center justify-center bg-white px-2 md:px-4 py-2 md:py-0 text-white shadow-md">
      <div className="flex flex-col md:flex-row w-full items-center gap-2 justify-center">
        {/* Scrollable button container on mobile */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <Button
            className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
            onClick={() => onFilterChange("all")}
            id={currentFilter === "all" ? "button-active" : undefined}
          >
            ALL
          </Button>
          <Button
            className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
            onClick={() => onFilterChange("wpa")}
            id={currentFilter === "wpa" ? "button-active" : undefined}
          >
            WPA
          </Button>
          <Button
            className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
            onClick={() => onFilterChange("wpa2")}
            id={currentFilter === "wpa2" ? "button-active" : undefined}
          >
            WPA2
          </Button>
          <Button
            className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
            onClick={() => onFilterChange("wpa3")}
            id={currentFilter === "wpa3" ? "button-active" : undefined}
          >
            WPA3
          </Button>
          <Button
            className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
            onClick={() => onFilterChange("open")}
            id={currentFilter === "open" ? "button-active" : undefined}
          >
            OPEN
          </Button>
          <Button
            className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
            onClick={() => onFilterChange("owe")}
            id={currentFilter === "owe" ? "button-active" : undefined}
          >
            OWE
          </Button>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Search by network name..."
            value={localSearch}
            onChange={handleSearchInput}
            className="rounded-full border-2 border-gray-300 px-4 py-2 w-full md:w-56 text-black text-sm"
          />
          <Button type="submit" className="rounded-full cursor-pointer whitespace-nowrap text-xs md:text-sm px-4 md:px-6">
            Search
          </Button>
        </form>
      </div>
    </div>
  );
}
