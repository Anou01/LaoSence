"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryChartData } from '@/utils/spatialMetrics';

export function SignalStrengthChart({ data: chartData }: { data: SummaryChartData['signal'] }) {
  if (chartData.length === 0) return <Card><CardContent className="p-6">No recorded data</CardContent></Card>;

  const total = chartData.reduce((s, d) => s + d.count, 0);
  const pctData = chartData.map((d) => ({
    ...d,
    pct: total > 0 ? Number(((d.count / total) * 100).toFixed(1)) : 0,
  }));

  return (
    <Card className="py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-sm">Signal Strength Distribution</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pctData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="bin" tickLine={false} axisLine={false} fontSize={9} tick={{ fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" height={40} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `${v}%`} width={36} />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Share']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="pct" fill="#0d9488" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
