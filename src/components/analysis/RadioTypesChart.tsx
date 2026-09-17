import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWiFiData } from '@/context/WiFiDataContext';
import { getRadioTypeDistribution } from '@/utils/analysisUtils';

export function RadioTypesChart() {
  const { wifiData, loading } = useWiFiData();
  const data = useMemo(() => getRadioTypeDistribution(wifiData), [wifiData]);
  return <Card>
    <CardHeader><CardTitle>Radio types by observation</CardTitle></CardHeader>
    <CardContent className="h-72">
      {loading ? 'Loading…' : data.length === 0 ? 'No radio type data' :
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="radioType" angle={-25} textAnchor="end" height={55} />
            <YAxis /><Tooltip /><Bar dataKey="count" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>}
    </CardContent>
  </Card>;
}
