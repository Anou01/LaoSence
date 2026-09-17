/** One survey row is an observation, not necessarily a distinct access point. */
export interface WiFiData {
  ssid: string;
  bssid: string;
  manufacturer: string;
  authentication: string;
  encryption: string;
  radioType: string;
  channel: number | null;
  latitude: number;
  longitude: number;
  /** Recorded dBm; null when no usable measurement exists. */
  signal: number | null;
  /** Recorded MHz; null when missing or invalid. */
  frequency: number | null;
  observedAt: string | null;
}

export const getSignalStrength = (signal: number | null): string => {
  if (signal === null) return 'Unknown';
  if (signal >= -50) return 'Excellent';
  if (signal >= -60) return 'Good';
  if (signal >= -70) return 'Fair';
  if (signal >= -80) return 'Poor';
  return 'Very Poor';
};

export const getSecurityLevel = (auth: string): { level: string; color: string } => {
  if (auth.toUpperCase().includes('OWE')) return { level: 'Enhanced open', color: '#22c55e' };
  if (auth.toUpperCase().includes('WPA3')) return { level: 'High', color: '#22c55e' };
  if (auth.toUpperCase().includes('WPA2')) return { level: 'Medium', color: '#eab308' };
  if (auth.toUpperCase().includes('OPEN')) return { level: 'Open', color: '#ef4444' };
  return { level: 'Other', color: '#f97316' };
};

export const getBand = (frequency: number | null): string => {
  if (frequency !== null && frequency >= 2400 && frequency < 2500) return '2.4 GHz';
  if (frequency !== null && frequency >= 4900 && frequency < 5925) return '5 GHz';
  return 'Other / Unknown';
};
