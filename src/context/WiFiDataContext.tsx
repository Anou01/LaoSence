import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { PRIMARY_DATASET } from '@/constants/dataset';
import { loadCSVFromPath } from '@/utils/csvParser';
import type { WiFiData } from '@/type/wifi';

interface WiFiDataContextType {
  wifiData: WiFiData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const WiFiDataContext = createContext<WiFiDataContextType | null>(null);

// The provider and its hook share this context by design.
// eslint-disable-next-line react-refresh/only-export-components
export const useWiFiData = () => {
  const value = useContext(WiFiDataContext);
  if (!value) throw new Error('useWiFiData must be used within WiFiDataProvider');
  return value;
};

export function WiFiDataProvider({ children }: { children: ReactNode }) {
  const [wifiData, setWifiData] = useState<WiFiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      setWifiData(await loadCSVFromPath(PRIMARY_DATASET));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load survey data');
      setWifiData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refreshData(); }, []);

  return <WiFiDataContext.Provider value={{ wifiData, loading, error, refreshData }}>
    {children}
  </WiFiDataContext.Provider>;
}
