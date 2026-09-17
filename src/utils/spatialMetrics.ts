import type { AggregateMetrics, BandCounts, GridCell, SpatialMetric } from '@/type/spatial';

export interface IntensityBin {
  upperInclusive: number | null;
  label: string;
  color: string;
}

export interface IntensityScale {
  minimum: number | null;
  maximum: number | null;
  bins: IntensityBin[];
}

export const INTENSITY_COLORS = ['#d1fae5', '#6ee7b7', '#34d399', '#059669', '#065f46'] as const;
export const NO_DATA_COLOR = '#cbd5e1';
const QUALITATIVE_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;

export function knownBandShares(
  bands: Partial<BandCounts> | null | undefined,
): { twoPointFour: number | null; five: number | null } {
  const twoPointFourValue = Number(bands?.['2.4GHz']);
  const fiveValue = Number(bands?.['5GHz']);
  const twoPointFour = Number.isFinite(twoPointFourValue) ? Math.max(0, twoPointFourValue) : 0;
  const five = Number.isFinite(fiveValue) ? Math.max(0, fiveValue) : 0;
  const denominator = twoPointFour + five;

  return denominator === 0
    ? { twoPointFour: null, five: null }
    : { twoPointFour: twoPointFour / denominator, five: five / denominator };
}

export function metricValue(metrics: AggregateMetrics, metric: SpatialMetric): number | null {
  if (metric === 'infrastructure') return metrics.uniqueNetworkCount;
  if (metric === 'medianSignal') return metrics.medianSignalDbm;
  return knownBandShares(metrics.bandCounts).five;
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function colorForBin(index: number, binCount: number): string {
  if (binCount === 1) return INTENSITY_COLORS[2];
  const paletteIndex = Math.round(index * (INTENSITY_COLORS.length - 1) / (binCount - 1));
  return INTENSITY_COLORS[paletteIndex];
}

function numericRangeLabel(index: number, boundaries: number[]): string {
  if (index === 0) return `≤ ${formatValue(boundaries[0])} within this survey`;
  if (index === boundaries.length) return `> ${formatValue(boundaries[boundaries.length - 1])} within this survey`;
  return `> ${formatValue(boundaries[index - 1])} to ${formatValue(boundaries[index])} within this survey`;
}

export function buildIntensityScale(cells: GridCell[]): IntensityScale {
  const values = cells
    .map((cell) => cell.uniqueNetworkCount)
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (values.length === 0) return { minimum: null, maximum: null, bins: [] };

  const minimum = values[0];
  const maximum = values[values.length - 1];
  if (minimum === maximum) {
    return {
      minimum,
      maximum,
      bins: [{
        upperInclusive: maximum,
        label: `${formatValue(maximum)} within this survey`,
        color: colorForBin(0, 1),
      }],
    };
  }

  const quantileBoundaries = [0.2, 0.4, 0.6, 0.8]
    .map((quantile) => values[Math.ceil(quantile * values.length) - 1])
    .filter((value, index, boundaries): value is number =>
      value < maximum && boundaries.indexOf(value) === index);
  if (quantileBoundaries.length === 0) {
    return {
      minimum,
      maximum,
      bins: [{
        upperInclusive: null,
        label: `${formatValue(minimum)}\u2013${formatValue(maximum)} within this survey`,
        color: colorForBin(0, 1),
      }],
    };
  }

  const binCount = quantileBoundaries.length + 1;
  const labels = binCount === QUALITATIVE_LABELS.length ? QUALITATIVE_LABELS : null;
  const bins: IntensityBin[] = quantileBoundaries.map((upperInclusive, index) => ({
    upperInclusive,
    label: labels?.[index] ?? numericRangeLabel(index, quantileBoundaries),
    color: colorForBin(index, binCount),
  }));
  bins.push({
    upperInclusive: null,
    label: labels?.[binCount - 1] ?? numericRangeLabel(binCount - 1, quantileBoundaries),
    color: colorForBin(binCount - 1, binCount),
  });

  return { minimum, maximum, bins };
}

export function colorForIntensity(scale: IntensityScale, value: number | null): string {
  if (value === null || !Number.isFinite(value) || scale.bins.length === 0) return NO_DATA_COLOR;
  return scale.bins.find((bin) => bin.upperInclusive === null || value <= bin.upperInclusive)?.color
    ?? scale.bins[scale.bins.length - 1].color;
}
