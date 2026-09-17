"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ChartConfig,
} from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useWiFiData } from "@/context/WiFiDataContext";
import { getChannelDistribution } from "@/utils/analysisUtils";

const chartConfig = {
  count: {
    label: "Count",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChannelChart() {
  const { wifiData, loading } = useWiFiData();
  const chartData = React.useMemo(() => {
    if (loading || !wifiData.length) return [];
    return getChannelDistribution(wifiData);
  }, [wifiData, loading]);

  if (loading) return <Card className="py-0"><CardContent className="p-6">Loading...</CardContent></Card>;
  if (!chartData.length) return <Card className="py-0"><CardContent className="p-6">No channel data available</CardContent></Card>;
  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b px-6 py-4">
        <CardTitle>Most observed channels</CardTitle>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
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

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[120px]"
                  labelFormatter={(value) => `Channel: ${value}`}
                  formatter={(value) => [value, "Count"]}
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
