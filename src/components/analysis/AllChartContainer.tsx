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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-8">
      <FrequencyChart data={data.frequency} />
      <EncryptionTypeChart data={data.encryption} />
      <ChannelChart data={data.channel} />
      <SignalStrengthChart data={data.signal} />
      <AuthenticationMethodsChart data={data.authentication} />
      <RadioTypesChart data={data.radio} />
    </div>
  )
}
