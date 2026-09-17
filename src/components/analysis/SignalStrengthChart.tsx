
import React from "react";

// ========================================
// src/components/analysis/SignalStrengthChart.tsx
// ========================================

import {
  Card as CardSig,
  CardContent as CardContentSig,
  CardHeader as CardHeaderSig,
  CardTitle as CardTitleSig,
} from "@/components/ui/card";
import type {
  ChartConfig as ChartConfigSig,
} from "@/components/ui/chart";
import {
  ChartContainer as ChartContainerSig,
  ChartTooltip as ChartTooltipSig,
  ChartTooltipContent as ChartTooltipContentSig,
} from "@/components/ui/chart";
import { useWiFiData as useWiFiDataSig } from "@/context/WiFiDataContext";
import { getSignalStrengthHistogram } from "@/utils/analysisUtils";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const signalChartConfig = {
  count: {
    label: "Count",
    color: "var(--chart-1)",
  },
} satisfies ChartConfigSig;

export function SignalStrengthChart() {
  const { wifiData, loading } = useWiFiDataSig()
  const chartData = React.useMemo(() => {
    if (loading || !wifiData.length) return []
    return getSignalStrengthHistogram(wifiData)
  }, [wifiData, loading])

  if (loading) return <CardSig className="py-0"><CardContentSig className="p-6">Loading...</CardContentSig></CardSig>

  return (
    <CardSig className="py-0">
      <CardHeaderSig className="flex flex-col items-stretch border-b px-6 py-4">
        <div className="flex flex-1 flex-col justify-center gap-1">
          <CardTitleSig>Recorded signal (dBm)</CardTitleSig>
        </div>
      </CardHeaderSig>
      <CardContentSig className="px-2 sm:p-6">
        <ChartContainerSig
          config={signalChartConfig}
          className="aspect-auto h-[400px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#e0e0e0" />
            <XAxis
              dataKey="bin"
              tickLine={false}
              axisLine={true}
              tickMargin={8}
              stroke="#666"
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={true}
              tickMargin={8}
              stroke="#666"
              fontSize={12}
            />
            <ChartTooltipSig
              content={
                <ChartTooltipContentSig
                  className="w-[150px]"
                  labelFormatter={(value) => `Signal: ${value}`}
                  formatter={(value) => [value, "Networks"]}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              stroke="var(--color-count)"
              strokeWidth={1}
              radius={0}
            />
          </BarChart>
        </ChartContainerSig>
      </CardContentSig>
    </CardSig>
  )
}