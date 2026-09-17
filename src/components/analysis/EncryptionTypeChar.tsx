import { useMemo } from 'react';
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWiFiData } from '@/context/WiFiDataContext';
import { getEncryptionDistribution } from '@/utils/analysisUtils';

const colors = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#64748b'];

export function EncryptionTypeChart() {
  const { wifiData, loading } = useWiFiData();
  const data = useMemo(() => getEncryptionDistribution(wifiData), [wifiData]);
  return <Card>
    <CardHeader><CardTitle>Encryption by observation</CardTitle></CardHeader>
    <CardContent className="h-72">
      {loading ? 'Loading…' : data.length === 0 ? 'No encryption data' :
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="observations" nameKey="browser" innerRadius={55} outerRadius={85}>
              {data.map((item, index) => <Cell key={item.browser} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>}
    </CardContent>
  </Card>;
}
