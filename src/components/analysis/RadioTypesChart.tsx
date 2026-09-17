import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

export function RadioTypesChart({ data }: { data: SummaryChartData['radio'] }) {
  return <Card>
    <CardHeader><CardTitle>Radio types by Observations</CardTitle></CardHeader>
    <CardContent className="h-72">
      {data.every((row) => row.count === 0) ? 'No recorded data' :
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="radioType" angle={-25} textAnchor="end" height={55} />
            <YAxis /><Tooltip formatter={(value) => [value, 'Observations']} /><Bar dataKey="count" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>}
    </CardContent>
  </Card>;
}
