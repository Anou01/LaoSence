"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

const COLORS: Record<string, string> = {
  'Open': '#ef4444',
  'OWE': '#22c55e',
  'WPA Personal': '#f59e0b',
  'WPA2 Personal': '#0d9488',
  'WPA2 Enterprise': '#0891b2',
  'WPA3 Personal': '#16a34a',
  'WPA3 Enterprise': '#15803d',
};
const DEFAULT_COLOR = '#94a3b8';

export function AuthenticationMethodsChart({ data: chartData }: { data: SummaryChartData['authentication'] }) {
  const total = chartData.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <Card><CardContent className="p-6">No recorded data</CardContent></Card>;

  return (
    <Card className="py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-sm">Authentication / Security Mix</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 px-5 py-4 sm:flex-row sm:gap-6">
        <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="method"
                innerRadius="60%"
                outerRadius="90%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={1}
              >
                {chartData.map((d) => (
                  <Cell key={d.method} fill={COLORS[d.method] ?? DEFAULT_COLOR} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full space-y-1.5 sm:w-auto">
          {chartData.map((d) => (
            <div key={d.method} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[d.method] ?? DEFAULT_COLOR }} />
              <span className="text-slate-700">{d.method}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-900">
                {Math.round((d.count / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
