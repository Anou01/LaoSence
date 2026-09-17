import Papa from 'papaparse';
import type { WiFiData } from '@/type/wifi';

type CsvRow = Record<string, unknown>;

const text = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';

const number = (value: unknown): number | null => {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export function normalizeWiFiRow(row: CsvRow): WiFiData | null {
  const latitude = number(row.latitude);
  const longitude = number(row.longitude);
  if (latitude === null || longitude === null ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
      (latitude === 0 && longitude === 0)) return null;

  const recordedSignal = number(row.signal);
  return {
    ssid: text(row.SSID ?? row.ssid),
    bssid: text(row.BSSID ?? row.bssid),
    manufacturer: text(row.MANUFACTURER ?? row.manufacturer),
    authentication: text(row.AUTHENTICATION ?? row.authentication),
    encryption: text(row.ENCRYPTION ?? row.encryption),
    radioType: text(row['RADIO TYPE'] ?? row.RADIO_TYPE ?? row.radioType),
    channel: number(row.CHANNEL ?? row.channel),
    latitude,
    longitude,
    signal: recordedSignal !== null && recordedSignal < 0 ? recordedSignal : null,
    frequency: number(row.frequency ?? row.FREQUENCY),
    observedAt: text(row['DATE(UTC)']) || null,
  };
}

const parse = (input: string | File): Promise<WiFiData[]> => new Promise((resolve, reject) => {
  Papa.parse<CsvRow>(input, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    complete: (results) => {
      if (results.errors.length) {
        reject(new Error(`CSV parse error: ${results.errors[0].message}`));
        return;
      }
      resolve(results.data.map(normalizeWiFiRow).filter((row): row is WiFiData => row !== null));
    },
    error: (error: Error) => reject(error),
  });
});

export const parseWiFiCSV = (file: File): Promise<WiFiData[]> => parse(file);

export const loadCSVFromPath = async (path: string): Promise<WiFiData[]> => {
  const response = await fetch(encodeURI(path));
  if (!response.ok) throw new Error(`Unable to load dataset: HTTP ${response.status}`);
  return parse(await response.text());
};
