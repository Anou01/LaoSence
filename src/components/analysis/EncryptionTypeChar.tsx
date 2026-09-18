import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

const COLORS = ['#0d9488', '#14b8a6', '#f59e0b', '#8b5cf6', '#94a3b8'];

export function EncryptionTypeChart({ data }: { data: SummaryChartData['encryption'] }) {
  const total = data.reduce((s, d) => s + d.observations, 0);
  if (total === 0) return <Card><CardContent className="p-6">No recorded data</CardContent></Card>;

  return (
    <Card className="py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-sm">Encryption Mix</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6 px-5 py-4">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="observations" nameKey="browser" innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} paddingAngle={1}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {data.map((d, i) => (
            <div key={d.browser} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-slate-700">{d.browser}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-900">{Math.round((d.observations / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
