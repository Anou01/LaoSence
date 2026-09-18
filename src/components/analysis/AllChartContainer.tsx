"use client"

import { useMemo } from 'react';
import type { DatasetSummary } from '@/type/spatial';
import { summaryChartData } from '@/utils/spatialMetrics';
import { FrequencyChart } from "./FrequencyChart"
import { EncryptionTypeChart } from "./EncryptionTypeChar"
import { ChannelChart } from "./ChannelChart"
import { SignalStrengthChart } from "./SignalStrengthChart"
import { AuthenticationMethodsChart } from "./AuthenticationChart"
import { RadioTypesChart } from "./RadioTypesChart"

export default function AllChartContainer({ summary }: { summary: DatasetSummary }) {
  const data = useMemo(() => summaryChartData(summary), [summary]);
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <FrequencyChart data={data.frequency} />
      <AuthenticationMethodsChart data={data.authentication} />
      <EncryptionTypeChart data={data.encryption} />
      <SignalStrengthChart data={data.signal} />
      <ChannelChart data={data.channel} />
      <RadioTypesChart data={data.radio} />
    </div>
  )
}
