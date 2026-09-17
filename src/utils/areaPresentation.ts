import type { AggregateMetrics } from '@/type/spatial';
import { knownBandShares } from '@/utils/spatialMetrics';

function formatShare(value: number | null): string {
  return value === null ? 'Unknown' : `${Math.round(value * 100)}%`;
}

export function areaPresentation(metrics: AggregateMetrics) {
  const shares = knownBandShares(metrics.bandCounts);
  return {
    identifiers: metrics.uniqueNetworkCount.toLocaleString('en-US'),
    observations: metrics.observationCount.toLocaleString('en-US'),
    medianSignal: metrics.medianSignalDbm === null
      ? 'No recorded data'
      : `${metrics.medianSignalDbm} dBm`,
    twoPointFourShare: formatShare(shares.twoPointFour),
    fiveShare: formatShare(shares.five),
    unknownBandObservations: metrics.bandCounts.otherUnknown,
    securityMix: Object.entries(metrics.authenticationCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([label, observations]) => ({
        label,
        observations,
        percentage: metrics.observationCount === 0
          ? 'Unknown'
          : formatShare(observations / metrics.observationCount),
      })),
    channels: metrics.topChannels.slice(0, 5),
  };
}
