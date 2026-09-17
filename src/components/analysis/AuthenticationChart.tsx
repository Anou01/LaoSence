// src/components/analysis/AuthenticationChart.tsx
"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
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
import { getAuthenticationDistribution } from "@/utils/analysisUtils";

const chartConfig = {
  count: {
    label: "Observations",
    color: "#2563eb",
  },
  Open: {
    label: "Open",
    color: "var(--chart-1)",
  },
  WPA: {
    label: "WPA",
    color: "var(--chart-2)",
  },
  WPA2: {
    label: "WPA2",
    color: "var(--chart-3)",
  },
  WPA3: {
    label: "WPA3",
    color: "var(--chart-4)",
  },
  WEP: {
    label: "WEP",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function AuthenticationMethodsChart() {
  const { wifiData, loading } = useWiFiData();
  const chartData = React.useMemo(() => {
    if (loading || !wifiData.length) return [];
    return getAuthenticationDistribution(wifiData);
  }, [wifiData, loading]);

  const totalCount = chartData.reduce((acc, curr) => acc + curr.count, 0);

  if (loading) return <Card className="py-0"><CardContent className="p-6">Loading...</CardContent></Card>;
  if (!chartData.length) return <Card className="py-0"><CardContent className="p-6">No authentication data available</CardContent></Card>;

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b px-6 py-4">
        <div className="flex flex-1 flex-col justify-center gap-1">
          <CardTitle>Authentication Methods</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-2">
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
            }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#e0e0e0" />
            <XAxis
              dataKey="method"
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
                  className="w-[150px]"
                  labelFormatter={(value) => `${value}`}
                  formatter={(value) => [value, "Observations"]}
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
      <CardFooter className="flex-col gap-2 text-sm mb-4">
        <div className="grid grid-cols-2 gap-4 w-full leading-none font-medium">
          {chartData.map((item, index) => {
            const percent = ((item.count / totalCount) * 100).toFixed(1);
            return (
              <div key={item.method} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-chart-${index + 1}`}></div>
                {item.method}: {percent}%
              </div>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
