import { useRef, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocationButton from "@/components/map/LocationButton";
import { getCurrentPosition, type LocationPosition } from "@/utils/locationUtils";
import { WiFiMarkers } from "@/components/map/WiFiMarkers";
import { useWiFiData } from "@/context/WiFiDataContext";

interface MapComponentProps {
  userLocation: LocationPosition | null;
  onLocationUpdate: (location: LocationPosition | null) => void;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  showLocationButton?: boolean;
  locationButtonPosition?: "topleft" | "topright" | "bottomleft" | "bottomright";
  zoomControlPosition?: "topleft" | "topright" | "bottomleft" | "bottomright";
  authFilter?: string;
  searchQuery?: string;
}

export default function MapComponent({
  userLocation,
  onLocationUpdate,
  center = [17.9757, 102.6369],
  zoom = 7,
  minZoom = 5,
  maxZoom = 18,
  className = "h-full w-full",
  showLocationButton = true,
  locationButtonPosition = "bottomleft",
  zoomControlPosition = "bottomleft",
  authFilter = "all",
  searchQuery = ""
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const { wifiData, loading, error } = useWiFiData();

  // Filter WiFi data based on authentication type and search query
  const filteredWifiData = useMemo(() => {
    let filtered = wifiData;

    // Filter by authentication type
    if (authFilter && authFilter !== "all") {
      filtered = filtered.filter((wifi) => {
        const auth = wifi.authentication.toLowerCase() || "";

        switch (authFilter.toLowerCase()) {
          case "wpa":
            return auth.includes("wpa") && !auth.includes("wpa2") && !auth.includes("wpa3");
          case "wpa2":
            return auth.includes("wpa2");
          case "wpa3":
            return auth.includes("wpa3");
          case "owe":
            return auth.includes("owe");
          case "open":
            return auth === "open" || auth === "" || auth.includes("open");
          default:
            return true;
        }
      });
    }

    // Public search uses SSID only; BSSID lookup is intentionally unavailable.
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((wifi) => {
        const ssid = String(wifi.ssid || "").toLowerCase();
        return ssid.includes(query);
      });
    }

    return filtered;
  }, [wifiData, authFilter, searchQuery]);

  // Handle location detection
  const handleLocationDetection = async () => {
    try {
      const position = await getCurrentPosition();
      onLocationUpdate(position);
      console.log("User location:", position);
    } catch (error) {
      console.error("Location detection failed:", error);
      alert(error instanceof Error ? error.message : "Failed to get location");
    }
  };

  // Effect to handle user location updates
  useEffect(() => {
    if (userLocation && mapRef.current) {
      // Remove existing marker if any
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
      }

      // Zoom to user location
      mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15);

      // Create custom user location icon
      const userLocationIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
          </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Add marker to map
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userLocationIcon
      })
        .addTo(mapRef.current)
        .bindPopup("Your approximate location")
        .openPopup();
    }
  }, [userLocation]);

  return (
    <div className="relative h-full w-full">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin h-12 w-12 md:h-16 md:w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm md:text-base font-medium text-gray-700 hidden md:block">Loading WiFi data...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-15 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg max-w-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomControl={false}
        className={className}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ZoomControl position={zoomControlPosition} />

        {/* Render WiFi markers when data is loaded */}
        {!loading && !error && filteredWifiData.length > 0 && <WiFiMarkers data={filteredWifiData} />}
      </MapContainer>

      {/* Location button */}
      {showLocationButton && (
        <LocationButton
          position={locationButtonPosition}
          onClick={handleLocationDetection}
        />
      )}
    </div>
  );
}
