import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

export function RadioTypesChart({ data }: { data: SummaryChartData['radio'] }) {
  if (data.every((r) => r.count === 0)) return <Card><CardContent className="p-6">No recorded data</CardContent></Card>;

  return (
    <Card className="py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-sm">Radio Types</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="radioType" tickLine={false} axisLine={false} fontSize={9} tick={{ fill: '#64748b' }} angle={-20} textAnchor="end" height={45} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} width={36} />
            <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Observations']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill="#0d9488" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
