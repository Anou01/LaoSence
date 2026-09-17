import type { BandCounts } from '@/type/spatial';

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
