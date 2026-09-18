import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

const COLORS = ['#0d9488', '#2563eb', '#94a3b8'];

export function FrequencyChart({ data }: { data: SummaryChartData['frequency'] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <Card><CardContent className="p-6">No recorded data</CardContent></Card>;

  const knownTotal = data.filter((d) => d.band !== 'Other / Unknown').reduce((s, d) => s + d.count, 0);
  const mainBand = data.reduce((a, b) => (b.count > a.count && b.band !== 'Other / Unknown' ? b : a), data[0]);
  const mainPct = knownTotal > 0 ? Math.round((mainBand.count / knownTotal) * 100) : 0;

  return (
    <Card className="py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-sm">Band Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 px-5 py-4 sm:flex-row sm:gap-6">
        <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="band"
                innerRadius="60%"
                outerRadius="90%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-900">{mainPct}%</span>
            <span className="text-[10px] text-slate-500">{mainBand.band}</span>
          </div>
        </div>
        <div className="w-full space-y-2 sm:w-auto">
          {data.map((d, i) => (
            <div key={d.band} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-slate-700">{d.band}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-900">
                {total > 0 ? `${Math.round((d.count / total) * 100)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
