import React, { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import {
  type WiFiData,
  getSignalStrength,
  getBand,
} from "@/type/wifi";
import { LOCATION_ICONS } from "@/constants/location_icon";

interface WiFiMarkersProps {
  data: WiFiData[];
}

// Shared icon instances
const iconInstances = {
  green: null as L.Icon | null,
  yellow: null as L.Icon | null,
  red: null as L.Icon | null,
};

const getOrCreateIcon = (color: "green" | "yellow" | "red"): L.Icon => {
  if (!iconInstances[color]) {
    iconInstances[color] = L.icon({
      iconUrl: LOCATION_ICONS[color],
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: "wifi-location-marker",
    });
  }
  return iconInstances[color]!;
};

const getIconForSignal = (signal: number | null): L.Icon | L.DivIcon => {
  if (signal === null) {
    return L.divIcon({
      html: '<span style="display:block;width:20px;height:20px;border-radius:50%;background:#64748b;border:2px solid white"></span>',
      className: 'wifi-signal-unknown',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }
  const signalValue = signal ?? Number.NaN;

  if (isNaN(signalValue) || signalValue < -70) {
    return getOrCreateIcon("red");
  } else if (signalValue >= -50) {
    return getOrCreateIcon("green");
  } else {
    return getOrCreateIcon("yellow");
  }
};

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char
);

const createSingleWiFiPopup = (wifi: WiFiData): string => {
  const details = [
    ['Authentication', wifi.authentication || 'Unknown'],
    ['Encryption', wifi.encryption || 'Unknown'],
    ['Band', getBand(wifi.frequency)],
    ['Channel', wifi.channel === null ? 'Unknown' : String(wifi.channel)],
    ['Signal', wifi.signal === null ? 'Unknown' : `${wifi.signal} dBm (${getSignalStrength(wifi.signal)})`],
    ['Manufacturer', wifi.manufacturer || 'Unknown'],
  ];
  return `<div class="p-3"><h2 class="font-semibold">Observed Network</h2><dl>${details
    .map(([label, value]) => `<div><dt class="inline font-medium">${escapeHtml(label)}:</dt> <dd class="inline">${escapeHtml(value)}</dd></div>`)
    .join('')}</dl></div>`;
};

type WiFiMarker = L.Marker & { _wifiData?: WiFiData };

export const WiFiMarkers: React.FC<WiFiMarkersProps> = ({ data }) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const expandedLayerRef = useRef<L.LayerGroup | null>(null);
  const activeClusterRef = useRef<L.MarkerCluster | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cluster options - always keep clustering, never show all markers
  const clusterOptions = useMemo(
    () => ({
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 25,
      maxClusterRadius: (zoom: number) => {
        // Smaller radius at higher zoom for more precise groups
        if (zoom <= 10) return 120;
        if (zoom <= 13) return 80;
        if (zoom <= 15) return 60;
        if (zoom <= 17) return 40;
        return 25;
      },
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false, // We handle clicks manually
      disableClusteringAtZoom: 25, // Never auto-expand (25 is beyond max zoom)
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        let size = 40;
        let color = "#3b82f6";

        if (count > 1000) {
          size = 70;
          color = "#dc2626";
        } else if (count > 500) {
          size = 60;
          color = "#ea580c";
        } else if (count > 100) {
          size = 50;
          color = "#f59e0b";
        } else if (count > 50) {
          size = 45;
          color = "#10b981";
        }

        return L.divIcon({
          html: `<div style="background:linear-gradient(135deg,${color},${color}dd);color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.floor(
            size / 2.5
          )}px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);cursor:pointer">${count}</div>`,
          className: "marker-cluster-wifi",
          iconSize: L.point(size, size),
        });
      },
    }),
    []
  );

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    // Debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Clean up existing layers
      if (expandedLayerRef.current) {
        map.removeLayer(expandedLayerRef.current);
        expandedLayerRef.current = null;
        activeClusterRef.current = null;
      }

      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current.clearLayers();
      }

      // Create new cluster group
      const clusterGroup = L.markerClusterGroup(clusterOptions);
      clusterGroupRef.current = clusterGroup;

      // Handle cluster click - expand THIS cluster only
      clusterGroup.on("clusterclick", (event) => {
        const clusterEvent = event as L.LeafletEvent & { layer: L.MarkerCluster; originalEvent?: MouseEvent };
        clusterEvent.originalEvent?.stopPropagation();

        const cluster = clusterEvent.layer;
        const childMarkers = cluster.getAllChildMarkers();
        const clusterSize = childMarkers.length;

        // If cluster is too large (>500), zoom in instead of expanding
        const MAX_EXPAND_SIZE = 500;
        if (clusterSize > MAX_EXPAND_SIZE) {
          // Zoom to cluster bounds instead of expanding
          const bounds = cluster.getBounds();
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: map.getZoom() + 2
          });
          return;
        }

        // If clicking the same cluster, collapse it
        if (activeClusterRef.current === cluster && expandedLayerRef.current) {
          map.removeLayer(expandedLayerRef.current);
          expandedLayerRef.current = null;
          activeClusterRef.current = null;

          // Show the cluster icon again
          const clusterIcon = cluster.getElement();
          if (clusterIcon) {
            clusterIcon.style.display = "";
          }
          return;
        }

        // Remove previous expanded layer and show previous cluster
        if (expandedLayerRef.current) {
          map.removeLayer(expandedLayerRef.current);

          // Show the previous cluster icon
          if (activeClusterRef.current) {
            const prevClusterIcon = activeClusterRef.current.getElement();
            if (prevClusterIcon) {
              prevClusterIcon.style.display = "";
            }
          }
        }

        // Hide the clicked cluster icon
        const clusterIcon = cluster.getElement();
        if (clusterIcon) {
          clusterIcon.style.display = "none";
        }

        // Create new layer group for expanded markers
        const expandedLayer = L.layerGroup();
        expandedLayerRef.current = expandedLayer;
        activeClusterRef.current = cluster;

        // Add expanded markers to map first (empty)
        expandedLayer.addTo(map);

        // Group markers by location to handle overlapping markers
        const locationGroups = new Map<string, WiFiData[]>();
        childMarkers.forEach((marker: L.Marker) => {
          const wifi = (marker as WiFiMarker)._wifiData;
          if (wifi) {
            const key = `${wifi.latitude.toFixed(6)},${wifi.longitude.toFixed(6)}`;
            if (!locationGroups.has(key)) {
              locationGroups.set(key, []);
            }
            locationGroups.get(key)!.push(wifi);
          }
        });

        // Process markers in batches to avoid freezing
        const allWifiData: { wifi: WiFiData; lat: number; lng: number }[] = [];
        locationGroups.forEach((wifis, locationKey) => {
          const [lat, lng] = locationKey.split(',').map(Number);

          if (wifis.length === 1) {
            // Single marker at this location
            allWifiData.push({ wifi: wifis[0], lat, lng });
          } else {
            // Multiple markers at same location - spread them in a circle
            const radius = 0.0001; // Small offset in degrees (~11 meters)
            const angleStep = (2 * Math.PI) / wifis.length;

            wifis.forEach((wifi, index) => {
              const angle = angleStep * index;
              const offsetLat = lat + (radius * Math.cos(angle));
              const offsetLng = lng + (radius * Math.sin(angle));
              allWifiData.push({ wifi, lat: offsetLat, lng: offsetLng });
            });
          }
        });

        // Now process all markers in batches
        const BATCH_SIZE = 50;
        let currentIndex = 0;

        const processBatch = () => {
          const endIndex = Math.min(currentIndex + BATCH_SIZE, allWifiData.length);

          for (let i = currentIndex; i < endIndex; i++) {
            const { wifi, lat, lng } = allWifiData[i];
            const individualMarker = L.marker([lat, lng], {
              icon: getIconForSignal(wifi.signal),
              zIndexOffset: 1000, // Show on top of clusters
            });

            // Bind popup
            individualMarker.bindPopup(createSingleWiFiPopup(wifi), {
              maxWidth: 900,
              minWidth: 280,
              className: "wifi-custom-popup",
              autoPan: true,
              autoPanPadding: [10, 10],
            });

            expandedLayer.addLayer(individualMarker);
          }

          currentIndex = endIndex;

          // Continue processing if there are more markers
          if (currentIndex < allWifiData.length) {
            requestAnimationFrame(processBatch);
          }
        };

        // Start processing
        processBatch();
      });

      // Click on map (not on marker/cluster) to collapse expanded view
      map.on("click", () => {
        if (expandedLayerRef.current) {
          map.removeLayer(expandedLayerRef.current);
          expandedLayerRef.current = null;

          // Show the cluster icon again
          if (activeClusterRef.current) {
            const clusterIcon = activeClusterRef.current.getElement();
            if (clusterIcon) {
              clusterIcon.style.display = "";
            }
          }

          activeClusterRef.current = null;
        }
      });

      // Collapse expanded markers on zoom change
      map.on("zoomstart", () => {
        if (expandedLayerRef.current) {
          map.removeLayer(expandedLayerRef.current);
          expandedLayerRef.current = null;

          // Show the cluster icon again
          if (activeClusterRef.current) {
            const clusterIcon = activeClusterRef.current.getElement();
            if (clusterIcon) {
              clusterIcon.style.display = "";
            }
          }

          activeClusterRef.current = null;
        }
      });

      // Process markers in chunks
      const processChunk = (startIndex: number) => {
        const chunkSize = 500;
        const endIndex = Math.min(startIndex + chunkSize, data.length);
        const markers: L.Marker[] = [];

        for (let i = startIndex; i < endIndex; i++) {
          const wifi = data[i];

          if (
            !wifi ||
            typeof wifi.latitude !== "number" ||
            typeof wifi.longitude !== "number" ||
            isNaN(wifi.latitude) ||
            isNaN(wifi.longitude)
          ) {
            continue;
          }

          try {
            // Create invisible marker (will only be visible when cluster is clicked)
            const marker = L.marker([wifi.latitude, wifi.longitude], {
              icon: getIconForSignal(wifi.signal),
              opacity: 1, // Leaflet hides child markers while they are clustered
            });
            marker.bindPopup(createSingleWiFiPopup(wifi), {
              maxWidth: 420,
              minWidth: 250,
              className: 'wifi-custom-popup',
            });

            // Store wifi data
            (marker as WiFiMarker)._wifiData = wifi;

            markers.push(marker);
          } catch (error) {
            console.error("Error creating marker:", error);
          }
        }

        if (markers.length > 0) {
          clusterGroup.addLayers(markers);
        }

        if (endIndex < data.length) {
          if ("requestIdleCallback" in window) {
            requestIdleCallback(() => processChunk(endIndex), { timeout: 100 });
          } else {
            setTimeout(() => processChunk(endIndex), 0);
          }
        }
      };

      // Add cluster to map and start processing
      map.addLayer(clusterGroup);
      processChunk(0);
    }, 150);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      map.off("click");
      map.off("zoomstart");

      if (expandedLayerRef.current) {
        map.removeLayer(expandedLayerRef.current);
        expandedLayerRef.current = null;
      }

      if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current.clearLayers();
        clusterGroupRef.current = null;
      }
    };
  }, [map, data, clusterOptions]);

  return null;
};
