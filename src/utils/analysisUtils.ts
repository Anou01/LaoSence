import { getBand, type WiFiData } from '@/type/wifi';

export const getObservationMetrics = (data: Pick<WiFiData, 'bssid'>[]) => ({
  observationCount: data.length,
  uniqueBssidCount: new Set(data.map(row => row.bssid.trim().toLowerCase()).filter(Boolean)).size,
});

const distribution = (values: string[], key: string) => {
  const counts = new Map<string, number>();
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([label, count]) => ({ [key]: label, count }))
    .sort((a, b) => b.count - a.count || String(a[key]).localeCompare(String(b[key])));
};

export const getAuthenticationDistribution = (data: WiFiData[]) =>
  distribution(data.map(row => row.authentication || 'Unknown'), 'method') as { method: string; count: number }[];

export const getEncryptionDistribution = (data: WiFiData[]) =>
  distribution(data.map(row => row.encryption || 'Unknown'), 'browser')
    .map(row => ({ browser: String(row.browser), observations: row.count }));

export const getRadioTypeDistribution = (data: WiFiData[]) =>
  distribution(data.map(row => row.radioType || 'Unknown'), 'radioType') as { radioType: string; count: number }[];

export const getFrequencyDistribution = (data: WiFiData[]) => {
  const counts = new Map<string, number>();
  data.forEach(row => {
    const band = getBand(row.frequency);
    counts.set(band, (counts.get(band) ?? 0) + 1);
  });
  return ['2.4 GHz', '5 GHz', 'Other / Unknown'].map(band => ({ band, count: counts.get(band) ?? 0 }));
};

export const getSignalStrengthHistogram = (data: WiFiData[]) => {
  const bounds = [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0];
  return bounds.slice(0, -1).map((low, index) => {
    const high = bounds[index + 1];
    return {
      bin: `${low} to ${high} dBm`,
      count: data.filter(row => row.signal !== null && row.signal >= low &&
        (high === 0 ? row.signal <= high : row.signal < high)).length,
    };
  }).filter(row => row.count > 0);
};

export const getChannelDistribution = (data: WiFiData[], limit = 15) =>
  (distribution(data.map(row => row.channel === null ? 'Unknown' : String(row.channel)), 'bin') as { bin: string; count: number }[])
    .slice(0, limit);
