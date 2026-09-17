import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

const colors = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#64748b'];

export function EncryptionTypeChart({ data }: { data: SummaryChartData['encryption'] }) {
  return <Card>
    <CardHeader><CardTitle>Encryption by Observations</CardTitle></CardHeader>
    <CardContent className="h-72">
      {data.every((row) => row.observations === 0) ? 'No recorded data' :
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="observations" nameKey="browser" innerRadius={55} outerRadius={85}>
              {data.map((item, index) => <Cell key={item.browser} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Observations']} /><Legend />
          </PieChart>
        </ResponsiveContainer>}
    </CardContent>
  </Card>;
}
