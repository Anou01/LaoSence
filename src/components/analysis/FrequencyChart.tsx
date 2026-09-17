import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWiFiData } from '@/context/WiFiDataContext';
import { getFrequencyDistribution } from '@/utils/analysisUtils';

export function FrequencyChart() {
  const { wifiData, loading } = useWiFiData();
  const data = useMemo(() => getFrequencyDistribution(wifiData), [wifiData]);
  return <Card>
    <CardHeader><CardTitle>Recorded frequency bands</CardTitle></CardHeader>
    <CardContent className="h-72">
      {loading ? 'Loading…' :
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="band" /><YAxis /><Tooltip formatter={(value) => [value, 'Observations']} />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>}
    </CardContent>
  </Card>;
}
