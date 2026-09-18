/**
 * Real-time WiFi data analysis utilities.
 * Computes aggregate metrics from raw CSV data instead of relying on pre-computed JSON.
 */
import type { WiFiData } from '@/type/wifi';
import type {
  AggregateMetrics,
  BandCounts,
  Bounds,
  ChannelCount,
  DatasetSummary,
  GridCell,
  HistogramBin,
} from '@/type/spatial';

/* ------------------------------------------------------------------ */
/*  Grid geometry                                                     */
/* ------------------------------------------------------------------ */

const GRID_SIZE_METERS = 250;
const REFERENCE_LATITUDE = 18;
const LAT_STEP = GRID_SIZE_METERS / 111_320;
const LNG_STEP = GRID_SIZE_METERS / (111_320 * Math.cos(REFERENCE_LATITUDE * Math.PI / 180));

function toGridCoord(lat: number, lng: number): { row: number; col: number } {
  return {
    row: Math.floor(lat / LAT_STEP),
    col: Math.floor(lng / LNG_STEP),
  };
}

function cellBounds(row: number, col: number): Bounds {
  return {
    south: row * LAT_STEP,
    west: col * LNG_STEP,
    north: (row + 1) * LAT_STEP,
    east: (col + 1) * LNG_STEP,
  };
}

/* ------------------------------------------------------------------ */
/*  Frequency / band helpers                                          */
/* ------------------------------------------------------------------ */

function frequencyToBand(freq: number | null): '2.4GHz' | '5GHz' | 'otherUnknown' {
  if (freq !== null && freq >= 2400 && freq < 2500) return '2.4GHz';
  if (freq !== null && freq >= 4900 && freq < 5925) return '5GHz';
  return 'otherUnknown';
}

function normalizeAuth(auth: string): string {
  const a = auth.trim();
  if (/wpa3.*(personal|psk)/i.test(a)) return 'WPA3 Personal';
  if (/wpa3.*(enterprise|eap)/i.test(a)) return 'WPA3 Enterprise';
  if (/wpa2.*(personal|psk)/i.test(a)) return 'WPA2 Personal';
  if (/wpa2.*(enterprise|eap)/i.test(a)) return 'WPA2 Enterprise';
  if (/wpa.*(personal|psk)/i.test(a) && !/wpa2|wpa3/i.test(a)) return 'WPA Personal';
  if (/owe/i.test(a)) return 'OWE';
  if (/open/i.test(a) || a === '') return 'Open';
  return a || 'Other / Unknown';
}

function normalizeEncryption(enc: string): string {
  const e = enc.trim().toUpperCase();
  if (e.includes('CCMP')) return 'CCMP';
  if (e.includes('TKIP') && e.includes('CCMP')) return 'TKIP+CCMP';
  if (e.includes('TKIP')) return 'TKIP';
  if (e.includes('AES')) return 'AES';
  if (e.includes('WEP')) return 'WEP';
  if (e.includes('GCMP')) return 'GCMP';
  if (e === 'NONE' || e === '') return 'None';
  return 'Other / Unknown';
}

function normalizeRadioType(radio: string): string {
  const r = radio.trim().toLowerCase();
  if (r.includes('be')) return '802.11be';
  if (r.includes('ax')) return '802.11ax';
  if (r.includes('ac')) return '802.11ac';
  if (r.includes('11n') || r === 'n') return '802.11n';
  if (r.includes('11g') || r === 'g') return '802.11g';
  if (r.includes('11b') || r === 'b') return '802.11b';
  if (r.includes('11a') || r === 'a') return '802.11a';
  return radio.trim() || 'Other / Unknown';
}

/* ------------------------------------------------------------------ */
/*  Median calculation                                                */
/* ------------------------------------------------------------------ */

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* ------------------------------------------------------------------ */
/*  Signal histogram bins                                             */
/* ------------------------------------------------------------------ */

const SIGNAL_BINS: { label: string; min: number; max: number }[] = [
  { label: '< -100 dBm', min: -Infinity, max: -100 },
  { label: '[-100,-90) dBm', min: -100, max: -90 },
  { label: '[-90,-80) dBm', min: -90, max: -80 },
  { label: '[-80,-70) dBm', min: -80, max: -70 },
  { label: '[-70,-60) dBm', min: -70, max: -60 },
  { label: '[-60,-50) dBm', min: -60, max: -50 },
  { label: '[-50,-40) dBm', min: -50, max: -40 },
  { label: '[-40,-30) dBm', min: -40, max: -30 },
  { label: '[-30,-20) dBm', min: -30, max: -20 },
  { label: '[-20,-10) dBm', min: -20, max: -10 },
  { label: '[-10,0) dBm', min: -10, max: 0 },
];

/* ------------------------------------------------------------------ */
/*  Core aggregate computation                                        */
/* ------------------------------------------------------------------ */

export function computeAggregateMetrics(data: WiFiData[]): AggregateMetrics {
  const bandCounts: BandCounts = { '2.4GHz': 0, '5GHz': 0, otherUnknown: 0 };
  const authCounts: Record<string, number> = {};
  const encCounts: Record<string, number> = {};
  const channelCounts: Record<number, number> = {};
  const signals: number[] = [];
  const bssidSet = new Set<string>();

  for (const row of data) {
    // Band
    bandCounts[frequencyToBand(row.frequency)] += 1;

    // Authentication
    const auth = normalizeAuth(row.authentication);
    authCounts[auth] = (authCounts[auth] ?? 0) + 1;

    // Encryption
    const enc = normalizeEncryption(row.encryption);
    encCounts[enc] = (encCounts[enc] ?? 0) + 1;

    // Channel
    if (row.channel !== null && row.channel > 0) {
      channelCounts[row.channel] = (channelCounts[row.channel] ?? 0) + 1;
    }

    // Signal
    if (row.signal !== null) signals.push(row.signal);

    // Unique networks by BSSID
    if (row.bssid) bssidSet.add(row.bssid.toLowerCase());
  }

  const topChannels: ChannelCount[] = Object.entries(channelCounts)
    .map(([ch, obs]) => ({ channel: Number(ch), observations: obs }))
    .sort((a, b) => b.observations - a.observations || a.channel - b.channel);

  return {
    observationCount: data.length,
    uniqueNetworkCount: bssidSet.size,
    medianSignalDbm: median(signals),
    bandCounts,
    authenticationCounts: authCounts,
    encryptionCounts: encCounts,
    topChannels,
  };
}

/* ------------------------------------------------------------------ */
/*  Dataset summary (full dataset)                                    */
/* ------------------------------------------------------------------ */

export function computeDatasetSummary(
  data: WiFiData[],
  inputCount: number,
  rejectedCount: number,
): DatasetSummary {
  const metrics = computeAggregateMetrics(data);

  // Signal histogram
  const signalHistogram: HistogramBin[] = SIGNAL_BINS.map(({ label }) => ({
    label,
    observations: 0,
  }));
  for (const row of data) {
    if (row.signal === null) continue;
    for (let i = 0; i < SIGNAL_BINS.length; i++) {
      if (row.signal >= SIGNAL_BINS[i].min && row.signal < SIGNAL_BINS[i].max) {
        signalHistogram[i].observations += 1;
        break;
      }
    }
  }

  // Radio type counts
  const radioTypeCounts: Record<string, number> = {};
  for (const row of data) {
    const radio = normalizeRadioType(row.radioType);
    radioTypeCounts[radio] = (radioTypeCounts[radio] ?? 0) + 1;
  }

  return {
    ...metrics,
    schemaVersion: 1 as const,
    sourceLabel: 'Chanthabuly historical survey dataset',
    historicalSurveyPeriod: 'November 2024 – March 2025',
    inputObservationCount: inputCount,
    rejectedObservationCount: rejectedCount,
    rejectionCounts: { invalidCoordinates: 0, invalidSignal: rejectedCount },
    publishedCellCount: 0, // will be set after grid computation
    suppressedCellCount: 0,
    signalHistogram,
    radioTypeCounts,
  };
}

/* ------------------------------------------------------------------ */
/*  Grid cell computation                                             */
/* ------------------------------------------------------------------ */

const MIN_UNIQUE_NETWORKS = 5;

export function computeGridCells(data: WiFiData[]): GridCell[] {
  // Group observations by grid cell
  const cellMap = new Map<string, WiFiData[]>();

  for (const row of data) {
    const { row: r, col: c } = toGridCoord(row.latitude, row.longitude);
    const key = `${r}_${c}`;
    let bucket = cellMap.get(key);
    if (!bucket) {
      bucket = [];
      cellMap.set(key, bucket);
    }
    bucket.push(row);
  }

  const cells: GridCell[] = [];
  for (const [cellId, rows] of cellMap) {
    const [rowStr, colStr] = cellId.split('_');
    const row = Number(rowStr);
    const col = Number(colStr);
    const metrics = computeAggregateMetrics(rows);

    // Only publish cells with enough unique networks
    if (metrics.uniqueNetworkCount < MIN_UNIQUE_NETWORKS) continue;

    const bounds = cellBounds(row, col);
    cells.push({
      ...metrics,
      cellId,
      row,
      col,
      bounds,
      center: {
        lat: (bounds.south + bounds.north) / 2,
        lng: (bounds.west + bounds.east) / 2,
      },
    });
  }

  return cells;
}

/* ------------------------------------------------------------------ */
/*  Area metrics (for Compare page — any bounds)                      */
/* ------------------------------------------------------------------ */

export function computeAreaMetrics(data: WiFiData[], bounds: Bounds): AggregateMetrics {
  const filtered = data.filter(
    (row) =>
      row.latitude >= bounds.south &&
      row.latitude <= bounds.north &&
      row.longitude >= bounds.west &&
      row.longitude <= bounds.east,
  );
  return computeAggregateMetrics(filtered);
}

/* ------------------------------------------------------------------ */
/*  Compare analysis — generate real insight statements               */
/* ------------------------------------------------------------------ */

export interface CompareInsight {
  title: string;
  description: string;
  icon: 'activity' | 'signal' | 'shield' | 'radio';
}

export function generateCompareInsights(
  areaAName: string,
  areaBName: string,
  metricsA: AggregateMetrics,
  metricsB: AggregateMetrics,
): CompareInsight[] {
  const insights: CompareInsight[] = [];

  // 1. Observation count comparison
  if (metricsA.observationCount > 0 && metricsB.observationCount > 0) {
    const diff = Math.abs(metricsA.observationCount - metricsB.observationCount);
    const smaller = Math.min(metricsA.observationCount, metricsB.observationCount);
    const pctDiff = smaller > 0 ? Math.round((diff / smaller) * 100) : 0;
    if (pctDiff >= 10) {
      const higher = metricsA.observationCount > metricsB.observationCount ? areaAName : areaBName;
      const lower = higher === areaAName ? areaBName : areaAName;
      insights.push({
        title: 'Recorded observations',
        description: `${higher} recorded approximately ${pctDiff}% more wireless observations than ${lower} in this survey.`,
        icon: 'activity',
      });
    }
  }

  // 2. 5 GHz share comparison
  const knownA = metricsA.bandCounts['2.4GHz'] + metricsA.bandCounts['5GHz'];
  const knownB = metricsB.bandCounts['2.4GHz'] + metricsB.bandCounts['5GHz'];
  if (knownA > 0 && knownB > 0) {
    const fiveA = metricsA.bandCounts['5GHz'] / knownA;
    const fiveB = metricsB.bandCounts['5GHz'] / knownB;
    if (Math.abs(fiveA - fiveB) >= 0.05) {
      const higher = fiveA > fiveB ? areaAName : areaBName;
      const lower = higher === areaAName ? areaBName : areaAName;
      const higherPct = Math.round((fiveA > fiveB ? fiveA : fiveB) * 100);
      const lowerPct = Math.round((fiveA > fiveB ? fiveB : fiveA) * 100);
      insights.push({
        title: 'Observed 5 GHz share',
        description: `${higher} shows a larger observed 5 GHz share: ${higherPct}% compared with ${lowerPct}% in ${lower}.`,
        icon: 'radio',
      });
    }
  }

  // 3. Security comparison
  const openA = metricsA.observationCount > 0
    ? (metricsA.authenticationCounts['Open'] ?? 0) / metricsA.observationCount
    : 0;
  const openB = metricsB.observationCount > 0
    ? (metricsB.authenticationCounts['Open'] ?? 0) / metricsB.observationCount
    : 0;
  if (metricsA.observationCount > 0 && metricsB.observationCount > 0 && Math.abs(openA - openB) >= 0.03) {
    const lower = openA < openB ? areaAName : areaBName;
    const higher = lower === areaAName ? areaBName : areaAName;
    insights.push({
      title: 'Advertised Open networks',
      description: `${lower} has a lower share of advertised Open networks than ${higher}.`,
      icon: 'shield',
    });
  }

  // 4. Signal quality comparison
  if (metricsA.medianSignalDbm !== null && metricsB.medianSignalDbm !== null) {
    const diff = Math.abs(metricsA.medianSignalDbm - metricsB.medianSignalDbm);
    if (diff >= 3) {
      const higher = metricsA.medianSignalDbm > metricsB.medianSignalDbm ? areaAName : areaBName;
      const lower = higher === areaAName ? areaBName : areaAName;
      const higherVal = Math.max(metricsA.medianSignalDbm, metricsB.medianSignalDbm);
      const lowerVal = Math.min(metricsA.medianSignalDbm, metricsB.medianSignalDbm);
      insights.push({
        title: 'Median recorded signal',
        description: `${higher} has a higher median recorded signal (${higherVal} dBm vs ${lowerVal} dBm in ${lower}), a ${diff} dB difference.`,
        icon: 'signal',
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      title: 'Similar surveyed indicators',
      description: 'The selected areas show broadly similar values across these surveyed wireless indicators.',
      icon: 'activity',
    });
  }

  return insights.slice(0, 3);
}
