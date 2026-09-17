import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SummaryChartData } from '@/utils/spatialMetrics';

export function FrequencyChart({ data }: { data: SummaryChartData['frequency'] }) {
  return <Card>
    <CardHeader><CardTitle>Recorded frequency bands</CardTitle></CardHeader>
    <CardContent className="h-72">
      {data.every((row) => row.count === 0) ? 'No recorded data' :
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="band" /><YAxis /><Tooltip formatter={(value) => [value, 'Observations']} />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>}
    </CardContent>
    <CardFooter className="text-xs leading-5 text-slate-600">
      Counts include all Observations. Known-band percentage shares exclude Other / Unknown.
    </CardFooter>
  </Card>;
}
